// Add your requirements
var assert = require('assert');
var mgo = require('./db/mongo');
var skypeSvc = require('./mongo_service/skype/skype_mongo')
var restifyValidation = require('node-restify-validation')
var restify = require('restify');
var builder = require('botbuilder');
var pgClient = require('./pgClient');
var setting = require('./config');
var napa = require('napajs');
var zone1 = napa.zone.create('zone1', {
  workers: 4
});

// Setup Restify Server
var server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());
server.use(restifyValidation.validationPlugin({
  // Shows errors as an array
  errorsAsArray: false,
  // Not exclude incoming variables not specified in validator rules
  forbidUndefinedVariables: false,
  // errorHandler: restify.errors.InvalidArgumentError,
}));

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
    console.log("invalid keyword")
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
    skypeSvc.find(mgo.db, (data) => {
      if (data && data.length != 0) {
        session.send("Sorry, you are already registered. Contaact admin for more information");
        session.endDialog();
        return
      }
      builder.Prompts.text(session, "What is  your name ?");
    }, {
      skype_id: session.message.user.id
    })
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
    builder.Prompts.number(session, "What is your Phone number ?");
  },
  function (session, results) {
    session.dialogData.phoneNumber = results.response;
    var data = session.dialogData;
    var message = session.message;

    session.send(`Registration success. registration details: <br/>Name: ${data.workerName}
                    <br/>Worker ID: ${data.workerID}<br/>Email/skype ID : ${data.email}<br/>Phone Number : ${data.phoneNumber}
                    <br/><br/>
                    You will receive ctms alert`);

    var newSkypeUser = [{
      skype_id: message.user.id,
      skype_name: data.workerName,
      email: data.email,
      phone_number: data.phoneNumber,
      conversation_address: message.address,
      conversation_entitas: message.entities,
      worker_id: data.workerID,
      created: new Date(Date.now()).toISOString(),
    }];

    skypeSvc.insert(mgo.db, (result) => {
      console.log(result)
    }, newSkypeUser);

    session.endDialog();
  }
]).triggerAction({
  matches: /^register$/i,
});

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


server.post({
  url: '/api/v1/skype/getuser',
  validation: {}
}, (req, res, next) => {
  if (!req.body || req.body.length == 0) {
    res.status(400);
    res.send();
    res.end;
    return;
  }

  console.log(req.body)
  skypeSvc.find(mgo.db, (data) => {
    res.status(200)
    res.send(data);
    res.end;
  });
})

server.post({
  url: '/api/v1/skype/sendNotification',
  validation: {
    content: {
      key_id: {
        isRequired: true
      },
    }
  }
}, (req, res, next) => {
  var query = {
    $or: [{
      skype_id: req.body.key_id
    }, {
      phone_number: parseFloat(req.body.key_id)
    }]
  };
  skypeSvc.find(mgo.db, (data) => {
    res.status(200)
    if (data) {
      console.log(data)
      data.forEach(r => {
        if (r.conversation_address) {
          var name = r.conversation_address.user.name || "no_name";
          sendProactiveMessage(r.conversation_address, name);
          console.log(r.conversation_id)
        } else {
          console.log("data is null")
        }
      });
    }
    res.send("notificatoin sended");
    res.end;
  }, query);
});


function run(db) {
  zone1.execute(
      (r) => r, [])
    .then(() => {
      server.listen(process.env.PORT || 3000, () => {
        console.log('%s listening to %s', server.name, server.url);
        mgo.db = db
      })
    });
}


mgo.con(run);