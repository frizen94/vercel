import { sql } from './database';

export async function runInitialMigrations() {
  try {
    console.log('🔄 Creating initial database schema...');
    
    // Create all tables in the correct order (respecting foreign key dependencies)
    
    // 1. Users table first (no dependencies)
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

    // 2. Portfolios table (depends on users)
    await sql`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // 3. Boards table (depends on users and portfolios)
    await sql`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#22C55E',
        user_id INTEGER REFERENCES users(id),
        portfolio_id INTEGER REFERENCES portfolios(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // 4. Lists table (depends on boards)
    await sql`
      CREATE TABLE IF NOT EXISTS lists (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        board_id INTEGER REFERENCES boards(id) NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // 5. Cards table (depends on lists)
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

    // 6. Labels table (depends on boards)
    await sql`
      CREATE TABLE IF NOT EXISTS labels (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        board_id INTEGER REFERENCES boards(id) NOT NULL
      );
    `;

    // 7. Junction tables
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
    return true;

  } catch (error) {
    console.error('❌ Error creating database schema:', error);
    throw error;
  }
}

export async function addDescriptionColumn() {
  try {
    // This function is now redundant since description is included in the main schema
    console.log('ℹ️ Description column already included in schema');
    return true;
    
  } catch (error) {
    console.error('❌ Error with description column:', error);
    throw error;
  }
}

export async function runPortfolioMigrations() {
  try {
    console.log('🔄 Running portfolio migrations...');
    
    // Ensure portfolios table exists
    await sql`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Add portfolio_id column to boards table if it doesn't exist
    await sql`
      ALTER TABLE boards 
      ADD COLUMN IF NOT EXISTS portfolio_id INTEGER REFERENCES portfolios(id);
    `;
    
    // Add color column to boards table if it doesn't exist
    await sql`
      ALTER TABLE boards 
      ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#22C55E';
    `;
    
    // Create indices for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_boards_portfolio_id ON boards(portfolio_id);`;
    
    console.log('✅ Portfolio migrations completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error running portfolio migrations:', error);
    throw error;
  }
}

export async function runMissingSqlMigrations() {
  try {
    console.log('🔄 Running missing SQL migrations...');
    
    // 1. Create notifications table (from 20250131_add_notifications_table.sql)
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        deleted BOOLEAN NOT NULL DEFAULT FALSE,
        action_url TEXT,
        related_card_id INTEGER REFERENCES cards(id),
        related_checklist_item_id INTEGER REFERENCES checklist_items(id),
        from_user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Add deleted column to existing notifications table if it doesn't exist (from 20250131_add_deleted_to_notifications.sql)
    await sql`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
    `;
    
    // Create indices for notifications
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_deleted ON notifications(deleted);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_deleted ON notifications(user_id, deleted);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);`;
    
    // 2. Add checklist_item_id to comments (from 20250917_add_checklist_item_id_to_comments.sql)
    await sql`
      ALTER TABLE comments
      ADD COLUMN IF NOT EXISTS checklist_item_id INTEGER REFERENCES checklist_items(id);
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_checklist_item_id ON comments(checklist_item_id);`;
    
    // 3. Add description to checklist_items (from 20250917_add_description_to_checklist_items.sql)
    await sql`
      ALTER TABLE checklist_items
      ADD COLUMN IF NOT EXISTS description TEXT;
    `;
    
    // 4. Add parent_item_id to checklist_items (from 20250917_add_parent_item_to_checklist_items.sql)
    await sql`
      ALTER TABLE checklist_items
      ADD COLUMN IF NOT EXISTS parent_item_id INTEGER;
    `;
    
    // Add constraint only if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'fk_checklist_items_parent'
        ) THEN
          ALTER TABLE checklist_items
          ADD CONSTRAINT fk_checklist_items_parent
          FOREIGN KEY (parent_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_checklist_items_parent ON checklist_items(parent_item_id);`;
    
    // 5. Create checklist_item_members table (from 20250917_create_checklist_item_members.sql)
    await sql`
      CREATE TABLE IF NOT EXISTS checklist_item_members (
        checklist_item_id INTEGER NOT NULL REFERENCES checklist_items(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        PRIMARY KEY (checklist_item_id, user_id)
      );
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_checklist_item_members_checklist_item_id ON checklist_item_members(checklist_item_id);`;
    
    // 6. Add completed column to cards table (from 20251007_add_completed_to_cards.sql)
    await sql`
      ALTER TABLE cards 
      ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false;
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_cards_completed ON cards(completed);`;
    
    // 7. Fix label duplicates and add unique constraint (from fix-label-duplicates.sql)
    await sql`
      DELETE FROM card_labels 
      WHERE id NOT IN (
          SELECT MIN(id) 
          FROM card_labels 
          GROUP BY card_id, label_id
      );
    `;
    
    // Add unique constraint only if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'unique_card_label'
        ) THEN
          ALTER TABLE card_labels 
          ADD CONSTRAINT unique_card_label 
          UNIQUE (card_id, label_id);
        END IF;
      END$$;
    `;
    
    // 8. Add audit_logs and activities tables (from add_audit_logs_and_activities_tables.sql)
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        old_data TEXT,
        new_data TEXT,
        metadata TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Índices para audit_logs
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        board_id INTEGER REFERENCES boards(id),
        activity_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        description TEXT NOT NULL,
        metadata TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Índices para activities
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_board_id ON activities(board_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_dashboard ON activities(user_id, board_id, timestamp DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_board_timeline ON activities(board_id, timestamp DESC);`;
    
    console.log('✅ Missing SQL migrations completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error running missing SQL migrations:', error);
    throw error;
  }
}