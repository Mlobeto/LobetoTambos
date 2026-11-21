import { test } from 'node:test'
import assert from 'node:assert/strict'
import { articleOptions } from './articleSearch.ts'

const items = [
  { id: 1, supplier_id: 1, supplier: 'Indargom', code: '000123', name: 'Válvula Irlanda', own_code: 'LT-40' },
  { id: 2, supplier_id: 2, supplier: 'Rubiolo', code: 'R-8', name: 'Pezonera', own_code: 'LT-40' },
  { id: 3, supplier_id: 1, supplier: 'Indargom', code: '12345', name: 'Manguera', own_code: null },
]

test('busca por código de proveedor, código LT y nombre sin distinguir mayúsculas ni tildes', () => {
  assert.deepEqual(articleOptions(items, '0001', '', '').matches.map((item) => item.id), [1])
  assert.deepEqual(articleOptions(items, 'lt-40', '', '').matches.map((item) => item.id), [1, 2])
  assert.deepEqual(articleOptions(items, ' VALVULA ', '', '').matches.map((item) => item.id), [1])
})

test('filtra por proveedor y mantiene visible la selección aunque no coincida con la búsqueda', () => {
  const result = articleOptions(items, 'manguera', '1', '1')
  assert.deepEqual(result.matches.map((item) => item.id), [3])
  assert.deepEqual(result.options.map((item) => item.id), [1, 3])
  assert.deepEqual(articleOptions(items, 'LT-40', '1', '2').options.map((item) => item.id), [1])
  assert.deepEqual(articleOptions(items, 'no existe', '', '').options, [])
})
