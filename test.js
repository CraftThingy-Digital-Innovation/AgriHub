const db = require('./apps/backend/dist/config/knex').default;
db('users')
  .where('id', 'wa-bot')
  .first()
  .then(user => console.log('Found:', user))
  .catch(console.error)
  .finally(() => process.exit(0));
