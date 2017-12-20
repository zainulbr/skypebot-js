// Add your requirements
var restify = require('restify');
var builder = require('botbuilder');
var pgClient = require('./pgClient');
var setting  = require('./config')
// Setup Restify Server
var server = restify.createServer();
// setup presistent memory

var inMemoryStorage = new builder.MemoryBotStorage();

// Create chat bot
var connector = new builder.ChatConnector({
    appId: setting.config.appId,
    appPassword: setting.config.appPassword
});

// init bot instance
var bot = new builder.UniversalBot(connector,
    [
        //default commond
        function(session){
            session.send("Invalid Keyword");            
            session.endDialog();
        }
    ]
).set('storage', inMemoryStorage);// Register in-memory storage 


function sendProactiveMessage(address) {
    var msg = new builder.Message().address(address);
    msg.text('Hello, this is a notification, love u all');
    msg.textLocale('en-US');
    bot.send(msg);
  }
  
  

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
    // console.log(message, "the message")
    if (message.membersAdded && message.membersAdded.length > 0) {
        console.log(message.address.conversation, "this is conversation")
        var name = message.user.name || ""
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
// bot.dialog('firstRun', function (session) {
//     session.userData.firstRun = true;
//     session.send("Hello...").endDialog();
// }).triggerAction({
//     onFindAction: function (context, callback) {
//         // Only trigger if we've never seen user before
//         if (!context.userData.firstRun) {
//             // Return a score of 1.1 to ensure the first run dialog wins
//             callback(null, 1.1);
//         } else {
//             callback(null, 0.0);
//         }
//     }
// });


bot.dialog("register", [
    function (session) {
        session.send("Welcome to CTMS notification registration ");
        // builder.Prompts.time(session, "Please enter your name !");
        builder.Prompts.text(session, "What is  your name ?");        
    },
    function (session, results) {
        session.dialogData.workerName = results.response;        
        // session.dialogData.reservationDate = builder.EntityRecognizer.resolveTime([results.response]);
        // builder.Prompts.number(session, "What is your Worker ID ?");
        builder.Prompts.text(session, "What is your Worker ID ?");
        
    },
    function (session, results) {
        session.dialogData.workerID= results.response;
        builder.Prompts.text(session, "What is your designation ?");
    },
    function (session, results) {
        session.dialogData.designation = results.response;
        // Process request and display reservation details
        session.send(`Registration success. registration details: <br/>Name: ${session.dialogData.workerName}
                        <br/> Worker ID: ${session.dialogData.workerID} <br/>Designation: ${session.dialogData.designation}
                        <br/><br/>
                        You will receive ctms alert`);
        pgClient.client.query(pgClient.Queries.userQuery.update,[session.message.address.user.id,session.dialogData.workerID,session.dialogData.designation,session.dialogData.workerName])
        .then(r =>{
            console.log("success");
        }).catch (e =>{
            console.log(e.stack);            
        });
        session.endDialog();
    }
]).triggerAction({
    matches: /^register$/i,
});

// bot.dialog('help', function (session, args, next) {
//     session.endDialog("This is a bot that can help you make a dinner reservation. <br/>Please say 'next' to continue");
// })
// .triggerAction({
//     matches: /^help$/i,
// });
server.post('/', connector.listen());
server.post('/api/messages', connector.listen());

//start server
server.listen(process.env.PORT || 3000, function () {
    pgClient.client.connect();  
    console.log('%s listening to %s', server.name, server.url);
});

