// TODO: DELETE THIS! This route is used to seed the database with placeholder data. 
// It is not intended for production use.
// This is how you would seed it for AWS RDS

import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcrypt';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';
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

async function seedUsers(client: PoolClient) {
  try {
    console.log('Starting seedUsers...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await client.query(
        `INSERT INTO users (id, name, email, password)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.name, user.email, hashedPassword]
      );
    }
  } catch (error) {
    console.error('Error in seedUsers:', error);
    throw error;
  }
}

async function seedCustomers(client: PoolClient) {
  try {
    console.log('Starting seedCustomers...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      )
    `);

    for (const customer of customers) {
      await client.query(
        `INSERT INTO customers (id, name, email, image_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [customer.id, customer.name, customer.email, customer.image_url]
      );
    }
  } catch (error) {
    console.error('Error in seedCustomers:', error);
    throw error;
  }
}

async function seedInvoices(client: PoolClient) {
  try {
    console.log('Starting seedInvoices...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      )
    `);

    for (const invoice of invoices) {
      await client.query(
        `INSERT INTO invoices (customer_id, amount, status, date)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [invoice.customer_id, invoice.amount, invoice.status, invoice.date]
      );
    }
  } catch (error) {
    console.error('Error in seedInvoices:', error);
    throw error;
  }
}

async function seedRevenue(client: PoolClient) {
  try {
    console.log('Starting seedRevenue...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      )
    `);

    for (const rev of revenue) {
      await client.query(
        `INSERT INTO revenue (month, revenue)
         VALUES ($1, $2)
         ON CONFLICT (month) DO NOTHING`,
        [rev.month, rev.revenue]
      );
    }
  } catch (error) {
    console.error('Error in seedRevenue:', error);
    throw error;
  }
}

export async function GET() {
  let client = null;
  
  try {
    console.log('Attempting to connect to database...');
    client = await pool.connect();
    console.log('Connected successfully');

    await client.query('BEGIN');

    await seedUsers(client);
    await seedCustomers(client);
    await seedInvoices(client);
    await seedRevenue(client);

    await client.query('COMMIT');
    
    return NextResponse.json({ 
      message: 'Database seeded successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error during seeding:', error);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    return NextResponse.json({ 
      error: (error as Error).message
    }, { status: 500 });

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