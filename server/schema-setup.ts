import { sql } from './database';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

export async function runInitialMigrations() {
  try {
    console.log('🔄 Creating initial database schema...');
    
    // First, check if tables exist
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    if (!tablesExist[0]?.exists) {
      console.log('📋 Tables do not exist, creating schema...');
      
      // Create all tables from schema
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          profile_picture TEXT,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS boards (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          user_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS lists (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          board_id INTEGER REFERENCES boards(id) NOT NULL,
          "order" INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS cards (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          list_id INTEGER REFERENCES lists(id) NOT NULL,
          "order" INTEGER NOT NULL DEFAULT 0,
          due_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS labels (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          board_id INTEGER REFERENCES boards(id) NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS card_labels (
          id SERIAL PRIMARY KEY,
          card_id INTEGER REFERENCES cards(id) NOT NULL,
          label_id INTEGER REFERENCES labels(id) NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          card_id INTEGER REFERENCES cards(id) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          user_id INTEGER REFERENCES users(id),
          user_name TEXT NOT NULL DEFAULT 'Anonymous'
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS card_members (
          card_id INTEGER REFERENCES cards(id) NOT NULL,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          PRIMARY KEY (card_id, user_id)
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS checklists (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          card_id INTEGER REFERENCES cards(id) NOT NULL,
          "order" INTEGER NOT NULL DEFAULT 0
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS checklist_items (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          checklist_id INTEGER REFERENCES checklists(id) NOT NULL,
          "order" INTEGER NOT NULL DEFAULT 0,
          completed BOOLEAN NOT NULL DEFAULT false,
          assigned_to_user_id INTEGER REFERENCES users(id),
          due_date TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS board_members (
          board_id INTEGER REFERENCES boards(id) NOT NULL,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          PRIMARY KEY (board_id, user_id)
        );
      `;

      console.log('✅ Database schema created successfully!');
    } else {
      console.log('ℹ️ Tables already exist, skipping schema creation');
    }

  } catch (error) {
    console.error('❌ Error creating database schema:', error);
    throw error;
  }
}

export async function addDescriptionColumn() {
  try {
    console.log('🔄 Adding description column to boards table...');
    
    // Check if description column already exists
    const columnExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'boards' 
        AND column_name = 'description'
      );
    `;
    
    if (!columnExists[0]?.exists) {
      await sql`
        ALTER TABLE boards 
        ADD COLUMN description TEXT;
      `;
      console.log('✅ Description column added successfully!');
    } else {
      console.log('ℹ️ Description column already exists');
    }
    
  } catch (error) {
    console.error('❌ Error adding description column:', error);
    throw error;
  }
}