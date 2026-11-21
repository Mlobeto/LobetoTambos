import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { api } from './api.ts'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('informa que el backend puede estar detenido ante un error vacío del proxy', async () => {
  globalThis.fetch = async () => new Response('', { status: 502 })
  await assert.rejects(api('/session'), /HTTP 502.*npm run server/)
})

test('conserva los errores enviados por el backend', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Usuario o contraseña incorrectos.' }), { status: 401 })
  await assert.rejects(api('/login'), /Usuario o contraseña incorrectos/)
})

test('informa una respuesta exitosa inválida', async () => {
  globalThis.fetch = async () => new Response('no es JSON', { status: 200 })
  await assert.rejects(api('/session'), /respuesta inválida/)
})
