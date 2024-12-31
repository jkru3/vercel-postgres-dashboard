import { Pool, PoolClient } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function listInvoices(client: PoolClient) {
	const res = await client.query(`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `);

	return res.rows;
}

export async function GET() {
  let client = null;
  
  try {
    console.log('Attempting to connect to database...');
    client = await pool.connect();
    console.log('Connected successfully');
  	return NextResponse.json(await listInvoices(client));
  } catch (error) {
  	return NextResponse.json({ error }, { status: 500 });
  } finally {
    if (client) {
      try {
        client.release();
        console.log('Client released');
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
}
