import { Pool, QueryResult } from 'pg';

// Lazy-initialized pool
let pool: Pool | null = null;

// Get or create the connection pool
function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set. Please add it to your .env.local file.');
    }
    
    pool = new Pool({
      connectionString: url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection on startup
    pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  
  return pool;
}

/**
 * Query helper function
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Initialize database schema
 * Creates ns_connections table if it doesn't exist
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Create table
    await query(`
      CREATE TABLE IF NOT EXISTS ns_connections (
        id SERIAL PRIMARY KEY,
        ens_name_1 VARCHAR(255) NOT NULL,
        ens_name_2 VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_connection UNIQUE (
          LEAST(ens_name_1, ens_name_2),
          GREATEST(ens_name_1, ens_name_2)
        )
      )
    `);
    
    // Create index
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ns_connections_names 
      ON ns_connections (ens_name_1, ens_name_2)
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get all manual connections
 */
export async function getConnections(): Promise<Array<{ id: number; ens_name_1: string; ens_name_2: string }>> {
  const result = await query('SELECT id, ens_name_1, ens_name_2, created_at FROM ns_connections ORDER BY created_at DESC');
  return result.rows;
}

/**
 * Add a new connection
 */
export async function addConnection(ensName1: string, ensName2: string): Promise<{ id: number }> {
  // Normalize ENS names
  const name1 = ensName1.toLowerCase().trim();
  const name2 = ensName2.toLowerCase().trim();
  
  if (name1 === name2) {
    throw new Error('Cannot create connection to self');
  }
  
  try {
    const result = await query(
      'INSERT INTO ns_connections (ens_name_1, ens_name_2) VALUES ($1, $2) RETURNING id',
      [name1, name2]
    );
    return { id: result.rows[0].id };
  } catch (error: any) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('Connection already exists');
    }
    throw error;
  }
}

/**
 * Delete a connection by ID
 */
export async function deleteConnection(id: number): Promise<boolean> {
  const result = await query('DELETE FROM ns_connections WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Check if connection exists between two ENS names
 */
export async function connectionExists(ensName1: string, ensName2: string): Promise<boolean> {
  const name1 = ensName1.toLowerCase().trim();
  const name2 = ensName2.toLowerCase().trim();
  
  const result = await query(
    `SELECT id FROM ns_connections 
     WHERE (ens_name_1 = $1 AND ens_name_2 = $2) 
        OR (ens_name_1 = $2 AND ens_name_2 = $1)
     LIMIT 1`,
    [name1, name2]
  );
  
  return result.rows.length > 0;
}

export default getPool;

