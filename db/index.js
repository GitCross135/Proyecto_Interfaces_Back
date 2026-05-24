import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch((err) => console.error('DB connection error:', err));

export default pool;