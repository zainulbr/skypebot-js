// Add your requirements
var restify = require('restify');
var builder = require('botbuilder');
var pgClient = require('./pgClient');
var setting  = require('./config')
// Setup Restify Server
var server = restify.createServer();
// setup presistent memory

var inMemoryStorage = new builder.MemoryBotStorage();

//example message address

function sendProactiveMessage(address) {
    var msg = new builder.Message().address(address);
    msg.text('Hello, this is a notification, love u all');
    msg.textLocale('en-US');
    bot.send(msg);
  }
  
  

// Create chat bot
var connector = new builder.ChatConnector({
    appId: setting.config.appId,
    appPassword: setting.config.appPassword
});

// init bot instance
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Welcome to the dinner reservation.");
        builder.Prompts.time(session, "Please provide a reservation date and time (e.g.: June 6th at 5pm)");
    },
    function (session, results) {
        session.dialogData.reservationDate = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.text(session, "How many people are in your party?");
    },
    function (session, results) {
        session.dialogData.partySize = results.response;
        builder.Prompts.text(session, "Who's name will this reservation be under?");
    },
    function (session, results) {
        session.dialogData.reservationName = results.response;

        // Process request and display reservation details
        session.send(`Reservation confirmed. Reservation details: <br/>Date/Time: ${session.dialogData.reservationDate} <br/>Party size: ${session.dialogData.partySize} <br/>Reservation name: ${session.dialogData.reservationName}`);
        session.endDialog();
    }
]).set('storage', inMemoryStorage); // Register in-memory storage 
bot.use(builder.Middleware.dialogVersion({
    version: 1.0,
    resetCommand: /^reset/i
}));

// Ask the user for their name and greet them by name.
bot.dialog('greetings', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.endDialog(`Hello ${results.response}!`);
    }
]);

//make event on conversation update
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded && message.membersAdded.length > 0) {
        console.log(message.address.conversation, "this is conversation")
        // Say hello
        var isGroup = message.address.conversation.isGroup;
        var txt = isGroup ? "Hello everyone!" : "Hello...";
        var reply = new builder.Message()
            .address(message.address)
            .text(txt);
        bot.send(reply);
    } else if (message.membersRemoved) {
        console.log(message, "this removed")
        // See if bot was removed
        var botId = message.address.bot.id;
        for (var i = 0; i < message.membersRemoved.length; i++) {
            if (message.membersRemoved[i].id === botId) {
                // Say goodbye
                var reply = new builder.Message()
                    .address(message.address)
                    .text("Goodbye");
                bot.send(reply);
                break;
            }
        }
    }
});

//make event on add bot into your friend
bot.on('contactRelationUpdate', function (message) {
    console.log(message)
    if (message.action === 'add') {
        var name = message.user ? message.user.name : "";
        var reply = new builder.Message()
            .address(message.address)
            .text("Hello %s... Thanks for adding me.", name || 'there');
        bot.send(reply);


        pgClient.client.query(pgClient.Queries.userQuery.insert,[message.user.id,name,"","",""])
        .then(res => {
            console.log(res.rows[0])
            var userID = res.rows[0].user_id;
            pgClient.client.query(pgClient.Queries.conversationQuery.insert,[message.address.conversation.id,userID,"",JSON.stringify(message.address),JSON.stringify(message.entities)])
            .then(r => {
                console.log("succes ", r)
            })
            .catch(err => {
                console.log("fail ", err)
            });
          })
          .catch(e => {
            console.error(e.stack)
          });
      
    }
});



// Add first run dialog
bot.dialog('firstRun', function (session) {
    session.userData.firstRun = true;
    session.send("Hello...").endDialog();
}).triggerAction({
    onFindAction: function (context, callback) {
        // Only trigger if we've never seen user before
        if (!context.userData.firstRun) {
            // Return a score of 1.1 to ensure the first run dialog wins
            callback(null, 1.1);
        } else {
            callback(null, 0.0);
        }
    }
});

server.post('/', connector.listen());
server.post('/api/messages', connector.listen());

//start server
server.listen(process.env.PORT || 3000, function () {
    pgClient.client.connect();
    console.log('%s listening to %s', server.name, server.url);
});

