export async function api<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const form = body instanceof FormData
  let response: Response
  try {
    response = await fetch(`/api${url}`, {
      method,
      headers: { 'X-Requested-With': 'stock-app', ...(!form && body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body === undefined ? undefined : form ? body : JSON.stringify(body),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verificá que el backend esté iniciado con npm run server.')
  }

  const raw = await response.text()
  let result: unknown
  try {
    result = JSON.parse(raw)
  } catch {
    if (!response.ok) {
      throw new Error(`El servidor no respondió correctamente (HTTP ${response.status}). Verificá que el backend esté iniciado con npm run server.`)
    }
    throw new Error('El servidor devolvió una respuesta inválida.')
  }
  if (!response.ok) {
    if (typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string') {
      throw new Error(result.error)
    }
    throw new Error(`Error del servidor (HTTP ${response.status}).`)
  }
  return result as T
}
