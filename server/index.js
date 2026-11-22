import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import { pool } from './db.js'
import { readList } from './import.js'

const { ADMIN_USER, ADMIN_PASSWORD, SESSION_SECRET } = process.env
if (!ADMIN_USER || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12 || !SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error('Configurá ADMIN_USER, ADMIN_PASSWORD (mínimo 12 caracteres) y SESSION_SECRET (mínimo 32 caracteres).')
}
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
const app = express()
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet())
app.use(express.json({ limit: '2mb' }))
const PgStore = connectPgSimple(session)
app.use(session({
  store: new PgStore({ pool, tableName: 'stock_sessions', createTableIfMissing: false }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 },
}))
app.use('/api', (req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('X-Requested-With') !== 'stock-app') {
    return res.status(403).json({ error: 'Solicitud no permitida.' })
  }
  next()
})
app.post('/api/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }), async (req, res, next) => {
  try {
    const valid = await bcrypt.compare(typeof req.body.password === 'string' ? req.body.password : '', passwordHash)
    if (req.body.username !== ADMIN_USER || !valid) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
    req.session.regenerate((error) => {
      if (error) return next(error)
      req.session.authenticated = true
      req.session.save((saveError) => saveError ? next(saveError) : res.json({ ok: true }))
    })
  } catch (error) { next(error) }
})
app.get('/api/session', (req, res) => res.json({ authenticated: !!req.session.authenticated }))
app.use('/api', (req, res, next) => req.session.authenticated ? next() : res.status(401).json({ error: 'Iniciá sesión.' }))
app.post('/api/logout', (req, res, next) => req.session.destroy((error) => error ? next(error) : res.json({ ok: true })))

const text = (value, label, max = 250) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${label} inválido.`)
  return value.trim()
}
const id = (value) => {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error('Identificador inválido.')
  return parsed
}
const positiveQuantity = (value) => {
  const quantity = String(value)
  if (!/^\d{1,12}(?:\.\d{1,3})?$/.test(quantity) || Number(quantity) <= 0) throw new Error('Cantidad inválida (máximo tres decimales).')
  return quantity
}
const endpoint = (handler) => async (req, res, next) => {
  try { await handler(req, res) } catch (error) { next(error) }
}
async function transaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}
app.get('/api/data', endpoint(async (_req, res) => {
  const [suppliers, categories, products, items, balances, notes, shelfEntries] = await Promise.all([
    pool.query('SELECT * FROM stock_suppliers ORDER BY name'),
    pool.query('SELECT * FROM stock_categories ORDER BY name'),
    pool.query('SELECT p.*, c.name AS category FROM stock_products p LEFT JOIN stock_categories c ON c.id=p.category_id ORDER BY p.name'),
    pool.query('SELECT i.*, i.archived, s.name AS supplier FROM stock_supplier_items i JOIN stock_suppliers s ON s.id=i.supplier_id ORDER BY i.name'),
    pool.query('SELECT * FROM stock_item_balances'),
    pool.query('SELECT * FROM stock_notes ORDER BY id DESC LIMIT 100'),
    pool.query(`SELECT e.id, e.item_id, e.quantity, e.stock_after, e.created_at, i.name, i.code, s.name AS supplier
      FROM stock_shelf_entries e JOIN stock_supplier_items i ON i.id=e.item_id
      JOIN stock_suppliers s ON s.id=i.supplier_id ORDER BY e.id DESC LIMIT 30`),
  ])
  res.json({ suppliers: suppliers.rows, categories: categories.rows, products: products.rows, items: items.rows, balances: balances.rows, notes: notes.rows, shelf_entries: shelfEntries.rows, archive_supported: true })
}))
for (const [route, table] of [['suppliers', 'stock_suppliers'], ['categories', 'stock_categories']]) {
  app.post(`/api/${route}`, endpoint(async (req, res) => {
    const result = await pool.query(`INSERT INTO ${table} (name) VALUES ($1) RETURNING *`, [text(req.body.name, 'Nombre')])
    res.status(201).json(result.rows[0])
  }))
}
app.post('/api/products', endpoint(async (req, res) => {
  const name = text(req.body.name, 'Nombre')
  const brand = typeof req.body.brand === 'string' ? req.body.brand.trim().slice(0, 250) : ''
  const ownCode = req.body.own_code ? text(req.body.own_code, 'Código propio') : null
  const category = req.body.category_id ? id(req.body.category_id) : null
  const result = await pool.query('INSERT INTO stock_products(name, brand, own_code, category_id) VALUES ($1,$2,$3,$4) RETURNING *', [name, brand, ownCode, category])
  res.status(201).json(result.rows[0])
}))
app.put('/api/products/:id', endpoint(async (req, res) => {
  const name = text(req.body.name, 'Nombre')
  const brand = typeof req.body.brand === 'string' ? req.body.brand.trim().slice(0, 250) : ''
  const ownCode = req.body.own_code ? text(req.body.own_code, 'Código propio') : null
  const category = req.body.category_id ? id(req.body.category_id) : null
  const result = await pool.query('UPDATE stock_products SET name=$1, brand=$2, own_code=$3, category_id=$4 WHERE id=$5 RETURNING *', [name, brand, ownCode, category, id(req.params.id)])
  if (!result.rowCount) return res.status(404).json({ error: 'Producto no encontrado.' })
  res.json(result.rows[0])
}))
app.post('/api/items', endpoint(async (req, res) => {
  const result = await pool.query('INSERT INTO stock_supplier_items(supplier_id,code,name,product_id) VALUES($1,$2,$3,$4) RETURNING *', [id(req.body.supplier_id), text(req.body.code, 'Código'), text(req.body.name, 'Nombre'), req.body.product_id ? id(req.body.product_id) : null])
  res.status(201).json(result.rows[0])
}))
app.put('/api/items/:id/link', endpoint(async (req, res) => {
  const result = await pool.query('UPDATE stock_supplier_items SET product_id=$1 WHERE id=$2 AND (product_id IS NULL OR product_id=$1) RETURNING *', [id(req.body.product_id), id(req.params.id)])
  if (!result.rowCount) return res.status(409).json({ error: 'El artículo ya está vinculado o no existe. No se modifica stock existente.' })
  res.json(result.rows[0])
}))
app.put('/api/items/:id/own-code', endpoint(async (req, res) => {
  const value = req.body.own_code
  if (typeof value !== 'string' && value !== null) throw new Error('Código LT inválido.')
  const ownCode = value === null || !value.trim() ? null : text(value, 'Código LT')
  const result = await pool.query('UPDATE stock_supplier_items SET own_code=$1 WHERE id=$2 RETURNING *', [ownCode, id(req.params.id)])
  if (!result.rowCount) return res.status(404).json({ error: 'Artículo no encontrado.' })
  res.json(result.rows[0])
}))
app.put('/api/items/:id/reactivate', endpoint(async (req, res) => {
  const result = await pool.query('UPDATE stock_supplier_items SET archived=false WHERE id=$1 RETURNING *', [id(req.params.id)])
  if (!result.rowCount) return res.status(404).json({ error: 'Artículo no encontrado.' })
  res.json(result.rows[0])
}))
app.put('/api/items/:id/archive', endpoint(async (req, res) => {
  const result = await pool.query('UPDATE stock_supplier_items SET archived=true WHERE id=$1 RETURNING *', [id(req.params.id)])
  if (!result.rowCount) return res.status(404).json({ error: 'Artículo no encontrado.' })
  res.json(result.rows[0])
}))
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } })
app.post('/api/import/read', upload.single('file'), endpoint(async (req, res) => {
  if (!req.file) throw new Error('Seleccioná un archivo.')
  const sheets = await readList(req.file)
  if (sheets.some((sheet) => sheet.rows.length > 20000)) throw new Error('El archivo supera el límite de 20.000 filas por hoja.')
  res.json({ sheets })
}))
app.post('/api/import/confirm', endpoint(async (req, res) => {
  const supplierId = id(req.body.supplier_id)
  const archiveIds = req.body.archive_ids === undefined ? [] : req.body.archive_ids
  if (!Array.isArray(archiveIds) || archiveIds.length > 20000) throw new Error('Lista de artículos a archivar inválida.')
  const ids = archiveIds.map(id)
  if (new Set(ids).size !== ids.length) throw new Error('Hay artículos repetidos para archivar.')
  if (!Array.isArray(req.body.rows) || req.body.rows.length > 20000 || (!req.body.rows.length && !ids.length)) throw new Error('Lista de artículos inválida.')
  const rows = req.body.rows.map((row) => ({ code: text(row.code, 'Código'), name: text(row.name, 'Nombre') }))
  const codes = new Set()
  for (const row of rows) {
    if (codes.has(row.code)) throw new Error(`Código repetido: ${row.code}. Corregilo antes de importar.`)
    codes.add(row.code)
  }
  await transaction(async (client) => {
    if (ids.length) {
      const archived = await client.query('SELECT id, code FROM stock_supplier_items WHERE supplier_id=$1 AND id=ANY($2::integer[]) FOR UPDATE', [supplierId, ids])
      if (archived.rowCount !== ids.length) throw new Error('Algún artículo a archivar no pertenece al proveedor o ya no existe.')
      if (archived.rows.some((item) => codes.has(item.code))) throw new Error('Un artículo no puede importarse y archivarse a la vez.')
      await client.query('UPDATE stock_supplier_items SET archived=true WHERE supplier_id=$1 AND id=ANY($2::integer[])', [supplierId, ids])
    }
    for (const row of rows) {
      await client.query(`INSERT INTO stock_supplier_items(supplier_id,code,name)
        VALUES ($1,$2,$3) ON CONFLICT(supplier_id,code) DO UPDATE SET name=EXCLUDED.name, archived=false`, [supplierId, row.code, row.name])
    }
  })
  res.json({ count: rows.length, archived: ids.length })
}))
app.post('/api/shelf-entries', endpoint(async (req, res) => {
  const itemId = id(req.body.item_id)
  const quantity = positiveQuantity(req.body.quantity)
  const requestId = req.body.request_id
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new Error('Identificador de carga inválido.')
  const result = await transaction(async (client) => {
    const entry = await client.query(`INSERT INTO stock_shelf_entries(request_id,item_id,quantity)
      VALUES ($1,$2,$3) ON CONFLICT(request_id) DO NOTHING RETURNING id`, [requestId, itemId, quantity])
    if (!entry.rowCount) {
      const previous = await client.query('SELECT id, stock_after FROM stock_shelf_entries WHERE request_id=$1 AND item_id=$2 AND quantity=$3::numeric', [requestId, itemId, quantity])
      if (!previous.rowCount) throw new Error('Esta carga ya fue usada con otros datos. Revisá antes de volver a guardar.')
      return previous.rows[0]
    }
    await client.query('INSERT INTO stock_item_balances(item_id) VALUES($1) ON CONFLICT DO NOTHING', [itemId])
    const updated = await client.query('UPDATE stock_item_balances SET quantity=quantity+$2::numeric WHERE item_id=$1 RETURNING quantity', [itemId, quantity])
    await client.query('UPDATE stock_shelf_entries SET stock_after=$2 WHERE id=$1', [entry.rows[0].id, updated.rows[0].quantity])
    return { id: entry.rows[0].id, stock_after: updated.rows[0].quantity }
  })
  res.status(201).json(result)
}))
app.post('/api/notes', endpoint(async (req, res) => {
  const kind = req.body.kind
  if (!['entry', 'exit'].includes(kind)) throw new Error('Tipo de remito inválido.')
  const supplierId = kind === 'entry' ? id(req.body.supplier_id) : null
  if (!Array.isArray(req.body.lines) || !req.body.lines.length || req.body.lines.length > 200) throw new Error('Agregá al menos un artículo.')
  const lines = req.body.lines.map((line) => {
    return { item: id(line.item_id), quantity: positiveQuantity(line.quantity) }
  })
  lines.sort((a, b) => a.item - b.item)
  const result = await transaction(async (client) => {
    const note = await client.query('INSERT INTO stock_notes(kind,supplier_id,counterpart) VALUES($1,$2,$3) RETURNING id', [kind, supplierId, typeof req.body.counterpart === 'string' ? req.body.counterpart.trim().slice(0, 250) : ''])
    for (const line of lines) {
      const item = await client.query('SELECT supplier_id FROM stock_supplier_items WHERE id=$1', [line.item])
      if (!item.rowCount) throw new Error('El artículo no existe.')
      if (kind === 'entry' && item.rows[0].supplier_id !== supplierId) throw new Error('Todos los artículos de entrada deben ser del mismo proveedor.')
      await client.query('INSERT INTO stock_item_balances(item_id) VALUES($1) ON CONFLICT DO NOTHING', [line.item])
      const updated = await client.query(`UPDATE stock_item_balances SET quantity=quantity ${kind === 'entry' ? '+' : '-'} $2::numeric
        WHERE item_id=$1 AND quantity >= ${kind === 'entry' ? '0' : '$2::numeric'} RETURNING quantity`, [line.item, line.quantity])
      if (!updated.rowCount) throw new Error('Stock insuficiente para una de las líneas.')
      await client.query('INSERT INTO stock_note_item_lines(note_id,item_id,quantity) VALUES($1,$2,$3)', [note.rows[0].id, line.item, line.quantity])
    }
    return note.rows[0]
  })
  res.status(201).json(result)
}))
app.get('/api/notes/:id', endpoint(async (req, res) => {
  const note = await pool.query('SELECT n.*, s.name AS supplier FROM stock_notes n LEFT JOIN stock_suppliers s ON s.id=n.supplier_id WHERE n.id=$1', [id(req.params.id)])
  if (!note.rowCount) return res.status(404).json({ error: 'Remito no encontrado.' })
  const lines = await pool.query(`SELECT l.quantity, i.name, i.code AS supplier_code, i.own_code, COALESCE(p.brand, '') AS brand, s.name AS supplier
    FROM stock_note_item_lines l JOIN stock_supplier_items i ON i.id=l.item_id JOIN stock_suppliers s ON s.id=i.supplier_id
    LEFT JOIN stock_products p ON p.id=i.product_id WHERE l.note_id=$1 ORDER BY l.id`, [id(req.params.id)])
  res.json({ ...note.rows[0], lines: lines.rows })
}))
app.use((error, _req, res, _next) => {
  console.error(error)
  if (error.code === '23505') return res.status(409).json({ error: 'Ese dato ya existe.' })
  if (error.code === '23503') return res.status(400).json({ error: 'La referencia seleccionada no existe.' })
  if (error instanceof multer.MulterError) return res.status(400).json({ error: 'Archivo inválido o demasiado grande (máximo 10 MB).' })
  res.status(error.code ? 500 : 400).json({ error: error.code ? 'Error interno del servidor.' : error.message })
})
app.listen(Number(process.env.PORT || 3001), process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'), () => console.log('Servidor de stock iniciado.'))
