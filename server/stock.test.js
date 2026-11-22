import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import net from 'node:net'
import { promisify } from 'node:util'
import ExcelJS from 'exceljs'
import { pool } from './db.js'
import { readList } from './import.js'

const execFileAsync = promisify(execFile)

test('importa Excel y conserva ceros iniciales', async () => {
  const workbook = new ExcelJS.Workbook()
  workbook.addWorksheet('Lista').addRow(['001234', 'Pezonera'])
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  const sheets = await readList({ originalname: 'lista.xlsx', buffer })
  assert.deepEqual(sheets[0].rows[0], ['001234', 'Pezonera'])
})

test('el migrador puede ejecutarse dos veces sin perder datos', async () => {
  const schema = `stock_test_${randomBytes(8).toString('hex')}`
  const database = await pool.connect()
  try {
    await database.query(`CREATE SCHEMA "${schema}"`)
    const env = { ...process.env, PGOPTIONS: `-c search_path=${schema}` }
    await execFileAsync(process.execPath, ['server/migrate.js'], { env })
    await database.query(`SET search_path TO "${schema}"`)
    await database.query("INSERT INTO stock_suppliers(name) VALUES ('Proveedor de prueba')")
    await execFileAsync(process.execPath, ['server/migrate.js'], { env })
    assert.equal((await database.query('SELECT count(*)::integer AS total FROM stock_suppliers')).rows[0].total, 1)
  } finally {
    await database.query('SET search_path TO public')
    await database.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    database.release()
  }
})

test('autenticación, reemplazo de lista y remitos por proveedor', async () => {
  const schema = `stock_test_${randomBytes(8).toString('hex')}`
  const database = await pool.connect()
  let server
  try {
    await database.query(`CREATE SCHEMA "${schema}"`)
    await database.query(`SET search_path TO "${schema}"`)
    await database.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'))
    const supplier = (await database.query("INSERT INTO stock_suppliers(name) VALUES ('Proveedor anterior') RETURNING id")).rows[0]
    const product = (await database.query("INSERT INTO stock_products(name,own_code) VALUES ('Producto anterior','LT-ANT') RETURNING id")).rows[0]
    const legacyItem = (await database.query("INSERT INTO stock_supplier_items(supplier_id,product_id,code,name) VALUES ($1,$2,'ANT','Artículo anterior') RETURNING id", [supplier.id, product.id])).rows[0]
    await database.query('INSERT INTO stock_balances(product_id,supplier_id,quantity) VALUES ($1,$2,4)', [product.id, supplier.id])
    const legacyNote = (await database.query("INSERT INTO stock_notes(kind,supplier_id) VALUES ('entry',$1) RETURNING id", [supplier.id])).rows[0]
    await database.query('INSERT INTO stock_note_lines(note_id,product_id,supplier_id,quantity) VALUES ($1,$2,$3,4)', [legacyNote.id, product.id, supplier.id])
    const migration = await readFile(new URL('./migrations/002_item_stock.sql', import.meta.url), 'utf8')
    await database.query('BEGIN')
    await database.query("INSERT INTO stock_supplier_items(supplier_id,product_id,code,name) VALUES ($1,$2,'AMB','Ambiguo')", [supplier.id, product.id])
    await assert.rejects(database.query(migration), /cero o varios artículos/)
    await database.query('ROLLBACK')
    await database.query('BEGIN')
    await database.query(migration)
    await database.query(await readFile(new URL('./migrations/003_shelf_stock.sql', import.meta.url), 'utf8'))
    await database.query(await readFile(new URL('./migrations/004_archived_items.sql', import.meta.url), 'utf8'))
    await database.query('COMMIT')
    assert.equal((await database.query('SELECT own_code FROM stock_supplier_items WHERE id=$1', [legacyItem.id])).rows[0].own_code, 'LT-ANT')
    assert.equal((await database.query('SELECT quantity FROM stock_item_balances WHERE item_id=$1', [legacyItem.id])).rows[0].quantity, '4.000')
    assert.equal((await database.query('SELECT item_id FROM stock_note_item_lines WHERE note_id=$1', [legacyNote.id])).rows[0].item_id, legacyItem.id)
    const portServer = net.createServer()
    portServer.listen(0, '127.0.0.1')
    await once(portServer, 'listening')
    const port = portServer.address().port
    await new Promise((resolve) => portServer.close(resolve))
    server = spawn(process.execPath, ['server/index.js'], {
      env: { ...process.env, PGOPTIONS: `-c search_path=${schema}`, PORT: String(port), ADMIN_USER: 'test', ADMIN_PASSWORD: 'test-password-long', SESSION_SECRET: randomBytes(32).toString('hex') },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    server.stdout.on('data', (data) => { output += data.toString() })
    server.stderr.on('data', (data) => { output += data.toString() })
    for (let i = 0; i < 100 && !output.includes('Servidor de stock iniciado'); i++) {
      if (server.exitCode !== null) throw new Error(`El servidor terminó: ${output}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (!output.includes('Servidor de stock iniciado')) throw new Error(`El servidor no inició: ${output}`)
    let cookie = ''
    async function request(path, method = 'GET', body) {
      const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
        method,
        headers: { 'X-Requested-With': 'stock-app', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0]
      return { status: response.status, data: await response.json() }
    }
    assert.equal((await request('/data')).status, 401)
    assert.equal((await fetch(`http://127.0.0.1:${port}/api/login`, { method: 'POST' })).status, 403)
    assert.equal((await request('/login', 'POST', { username: 'test', password: 'bad' })).status, 401)
    assert.equal((await request('/login', 'POST', { username: 'test', password: 'test-password-long' })).status, 200)
    const a = (await request('/suppliers', 'POST', { name: 'Proveedor A' })).data
    const b = (await request('/suppliers', 'POST', { name: 'Proveedor B' })).data
    const p = (await request('/products', 'POST', { name: 'Pezonera Irlanda', brand: 'Omega' })).data
    assert.ok(p.id)
    assert.equal((await request(`/products/${p.id}`, 'PUT', { name: 'Pezonera Irlanda', brand: 'Omega', own_code: 'LOB-1' })).data.own_code, 'LOB-1')
    assert.equal((await request('/import/confirm', 'POST', { supplier_id: a.id, rows: [{ code: '0001', name: 'Artículo' }, { code: '0001', name: 'Duplicado' }] })).status, 400)
    assert.equal((await request('/import/confirm', 'POST', { supplier_id: a.id, rows: [{ code: '0001', name: 'Artículo' }, { code: '0002', name: 'Otro' }] })).status, 200)
    let data = (await request('/data')).data
    const item = data.items.find((i) => i.code === '0001')
    const other = data.items.find((i) => i.code === '0002')
    assert.equal((await request(`/items/${item.id}/link`, 'PUT', { product_id: p.id })).status, 200)
    const third = (await request('/items', 'POST', { supplier_id: b.id, product_id: p.id, code: 'B01', name: 'Otro proveedor' })).data
    for (const article of [item, other, third]) {
      assert.equal((await request(`/items/${article.id}/own-code`, 'PUT', { own_code: 'LT-1' })).data.own_code, 'LT-1')
    }
    assert.equal((await request(`/items/${third.id}/own-code`, 'PUT', { own_code: '' })).data.own_code, null)
    assert.equal((await request(`/items/${third.id}/own-code`, 'PUT', { own_code: 'LT-1' })).status, 200)
    const shelfRequest = randomUUID()
    const initial = { item_id: other.id, quantity: '2', request_id: shelfRequest }
    const repeated = await Promise.all([request('/shelf-entries', 'POST', initial), request('/shelf-entries', 'POST', initial)])
    assert.deepEqual(repeated.map((r) => r.status), [201, 201])
    assert.equal(repeated[0].data.id, repeated[1].data.id)
    assert.equal((await request('/shelf-entries', 'POST', { ...initial, quantity: '3' })).status, 400)
    assert.equal((await request('/shelf-entries', 'POST', { item_id: other.id, quantity: '-1', request_id: randomUUID() })).status, 400)
    assert.equal((await request('/notes', 'POST', { kind: 'entry', supplier_id: a.id, lines: [{ item_id: item.id, quantity: '5' }, { item_id: other.id, quantity: '7' }] })).status, 201)
    assert.equal((await request('/notes', 'POST', { kind: 'entry', supplier_id: b.id, lines: [{ item_id: third.id, quantity: '3' }] })).status, 201)
    assert.equal((await request('/notes', 'POST', { kind: 'entry', supplier_id: a.id, lines: [{ item_id: third.id, quantity: '1' }] })).status, 400)
    assert.equal((await request('/notes', 'POST', { kind: 'exit', lines: [{ item_id: item.id, quantity: '2' }, { item_id: other.id, quantity: '1' }, { item_id: third.id, quantity: '1' }] })).status, 201)
    assert.equal((await request('/notes', 'POST', { kind: 'exit', lines: [{ item_id: item.id, quantity: '1' }, { item_id: third.id, quantity: '5' }] })).status, 400)
    assert.equal((await request('/shelf-entries', 'POST', { item_id: item.id, quantity: '4', request_id: randomUUID() })).data.stock_after, '7.000')
    assert.equal((await request('/import/confirm', 'POST', { supplier_id: a.id, rows: [{ code: '0001', name: 'Nombre actualizado' }] })).status, 200)
    data = (await request('/data')).data
    assert.equal(data.items.find((i) => i.code === '0001').product_id, p.id)
    assert.equal(data.items.find((i) => i.code === '0001').own_code, 'LT-1')
    assert.ok(data.items.find((i) => i.code === '0002'))
    assert.equal(data.balances.find((balance) => balance.item_id === item.id).quantity, '7.000')
    assert.equal(data.balances.find((balance) => balance.item_id === other.id).quantity, '8.000')
    assert.equal(data.balances.find((balance) => balance.item_id === third.id).quantity, '2.000')
    assert.equal(data.notes.length, 4)
    assert.equal(data.shelf_entries.length, 2)
    assert.equal((await request(`/notes/${data.notes[0].id}`)).data.lines.length, 3)
    assert.equal((await request(`/notes/${legacyNote.id}`)).data.lines[0].supplier_code, 'ANT')

    assert.equal(data.archive_supported, true)
    assert.equal(data.items.find((i) => i.id === other.id).archived, false)
    assert.equal((await request('/import/confirm', 'POST', { supplier_id: a.id, rows: [{ code: '0002', name: 'Otro' }], archive_ids: [other.id] })).status, 400)
    assert.equal((await request('/import/confirm', 'POST', { supplier_id: a.id, rows: [], archive_ids: [third.id] })).status, 400)
    assert.equal((await request('/import/confirm', 'POST', { supplier_id: a.id, rows: [], archive_ids: [other.id] })).status, 200)
    data = (await request('/data')).data
    assert.equal(data.items.find((i) => i.id === other.id).archived, true)
    assert.equal(data.items.find((i) => i.id === item.id).archived, false)
    assert.equal(data.items.find((i) => i.id === third.id).archived, false)
    assert.equal(data.balances.find((balance) => balance.item_id === other.id).quantity, '8.000')
    assert.equal(data.notes.length, 4)
    assert.equal((await request('/import/confirm', 'POST', { supplier_id: a.id, rows: [{ code: '0002', name: 'Otro actualizado' }] })).status, 200)
    assert.equal((await request('/data')).data.items.find((i) => i.id === other.id).archived, false)
    assert.equal((await request('/import/confirm', 'POST', { supplier_id: a.id, rows: [], archive_ids: [other.id] })).status, 200)
    assert.equal((await request(`/items/${other.id}/reactivate`, 'PUT')).data.archived, false)
    assert.equal((await request(`/items/${other.id}/archive`, 'PUT')).data.archived, true)
    assert.equal((await request(`/items/${other.id}/reactivate`, 'PUT')).data.archived, false)
    assert.equal((await request('/items/999999999/archive', 'PUT')).status, 404)
  } finally {
    if (server && server.exitCode === null) {
      server.kill()
      await once(server, 'exit')
    }
    await database.query('SET search_path TO public')
    await database.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    database.release()
    await pool.end()
  }
})
