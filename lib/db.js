import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    const conn = process.env.DATABASE_URL || process.env.MYSQL_URL;
    if (!conn) {
      throw new Error('DATABASE_URL (or MYSQL_URL) is not set');
    }
    pool = mysql.createPool(conn);
  }
  return pool;
}
