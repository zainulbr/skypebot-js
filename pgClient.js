const {
  Client
} = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'skyebot',
  password: '',
  port: 1234,
});


const Queries = {
  userQuery: {
    insert: 'INSERT INTO account.user(skype_id, skype_name, worker_id, designation,email) VALUES($1, $2, $3,$4,$5) RETURNING user_id',
    get: 'SELECT skype_id, skype_name, worker_id, designation,email FROM account.user WHERE user_id = $1',
    getByWID: 'SELECT skype_id, skype_name, worker_id, designation,email FROM account.user WHERE worker_id = $1',
    getBySkypeID: 'SELECT skype_id, skype_name, worker_id, designation,email FROM account.user WHERE skype_id = $1',
    delete: 'DELETE FROM account.user WHERE user_id = $1',
    update: 'UPDATE account.user SET skype_id = $2, skype_name = $3, worker_id = $4, designation $5 ,email = $6 WHERE user_id = $1',
  },
  conversationQuery: {
    insert: 'INSERT INTO account.conversation(conversation_id, user_id, worker_id, conversation_address,conversation_entitas) VALUES($1, $2, $3,$4::jsonb,$5::jsonb) RETURNING conversation_id',
    get: 'SELECT conversation_id, conversation_address,conversation_entitas FROM account.conversation WHERE user_id = $1',
    delete: 'DELETE FROM account.conversation WHERE conversation_id = $1',
    update: 'UPDATE account.conversation SET conversation_id = $2, conversation_address = $3 ,conversation_entitas = $4 WHERE user_id = $1',
  }
}

function callQuery(query, value) {
  client.query(query, value)
    .then(res => {
      console.log(res.rows[0])
      return res.rows[0];
    })
    .catch(e => {
      console.error(e.stack)
      return e;
    });
};


module.exports = {
  callQuery: callQuery,
  addr: addr,
  entities: entities,
  Queries: Queries,
  client:client,
};