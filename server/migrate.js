import { readFile } from 'node:fs/promises'
import { pool } from './db.js'

const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query('SELECT pg_advisory_xact_lock(4391782026)')
  await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'))
  await client.query('CREATE TABLE IF NOT EXISTS stock_schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
  for (const migration of ['002_item_stock', '003_shelf_stock']) {
    const applied = await client.query('SELECT 1 FROM stock_schema_migrations WHERE version = $1', [migration])
    if (!applied.rowCount) {
      await client.query(await readFile(new URL(`./migrations/${migration}.sql`, import.meta.url), 'utf8'))
      await client.query('INSERT INTO stock_schema_migrations(version) VALUES ($1)', [migration])
    }
  }
  await client.query('COMMIT')
  console.log('Tablas de stock preparadas.')
} catch (error) {
  await client.query('ROLLBACK')
  console.error('No se pudo preparar la base:', error.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
