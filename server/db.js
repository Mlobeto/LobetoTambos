import pg from 'pg'

export const pool = new pg.Pool(
  process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {},
)
