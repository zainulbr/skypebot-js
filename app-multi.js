
// Add your requirements
var skypeSvc = require('./mongo_service/skype/skype_mongo')
var assert = require('assert');
var restify = require('restify');
var builder = require('botbuilder');
var pgClient = require('./pgClient');
var setting = require('./config');
var napa = require('napajs');
var mongo = require('mongodb-core');
var zone1 = napa.zone.create('zone1', {
  workers: 4
});

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
var bot = new builder.UniversalBot(connector, [
  //default commond
  function (session) {
    session.send("Invalid Keyword");
    session.endDialog();
  }
]).set('storage', inMemoryStorage); // Register in-memory storage 


function sendProactiveMessage(address, name) {
  var msg = new builder.Message().address(address);
  msg.text(`Hello ${name}, this is a notification, Take care of your health please`);
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
    var name = message.user.name || "";
    // Say hello
    var isGroup = message.address.conversation.isGroup;
    var txt = isGroup ? "Hello everyone!" : "Hello... " + name;
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

  }
});



bot.dialog("/register", [
  function (session) {
    session.send("Welcome to CTMS notification registration ");
    builder.Prompts.text(session, "What is  your name ?");
  },
  function (session, results) {
    session.dialogData.workerName = results.response;
    builder.Prompts.text(session, "What is your Worker ID ?");
  },
  function (session, results) {
    session.dialogData.workerID = results.response;
    builder.Prompts.text(session, "What is your Email/skype ID ?");
  },
  function (session, results) {
    session.dialogData.email = results.response;
    session.send(`Registration success. registration details: <br/>Name: ${session.dialogData.workerName}
                    <br/> Worker ID: ${session.dialogData.workerID} <br/>Email/skype ID : ${session.dialogData.email}
                    <br/><br/>
                    You will receive ctms alert`);
    var message = session.message;
    var data = session.dialogData;
    pgClient.client.query(pgClient.Queries.userQuery.insert, [message.user.id, data.workerName, data.workerID, "", data.email])
      .then(res => {
        console.log(res.rows[0])
        var userID = res.rows[0].user_id;
        pgClient.client.query(pgClient.Queries.conversationQuery.insert, [message.address.conversation.id, userID, "", JSON.stringify(message.address), JSON.stringify(message.entities)])
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
    session.endDialog();
  }
]).triggerAction({
  matches: /^register$/i,
});


function boardCastMessage() {
  pgClient.client.query(pgClient.Queries.conversationQuery.getAll)
    .then(res => {
      if (res.rows) {
        res.rows.forEach(r => {
          var name = r.conversation_address.user.name || "no_name";
          sendProactiveMessage(r.conversation_address, name);
          console.log(r.conversation_id)
        });
      }
    })
    .catch(e => {
      console.error(e.stack)
    });
}

zone1.execute(
  (r) => r, [])
.then(() => {
  server.post('/', connector.listen())
});

zone1.execute(
  (r) => r, [])
.then(() => {
  server.post('/api/messages', connector.listen())
});

zone1.execute(
    (r) => r, [])
  .then(() => {
    server.listen(process.env.PORT || 3001, function () {
      pgClient.client.connect();
      console.log('%s listening to %s', server.name, server.url);
    })
  });

  var server = new  mongo.Server({
    host: 'localhost'
  , port: 27017
  , reconnect: true
  , reconnectInterval: 50
  });

  // Add event listeners
server.on('connect', function(_server) {
  console.log('mongo db connected');
  test.done();
});
 
server.on('close', function() {
  console.log('closed');
});
 
server.on('reconnect', function() {
  console.log('reconnect');
});
 
server.Connnect