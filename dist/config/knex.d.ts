import knex from 'knex';
declare const config: knex.Knex.Config;
declare const db: knex.Knex<any, unknown[]>;
export default db;
export { config as knexConfig };
