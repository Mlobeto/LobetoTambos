import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { api } from './api'
import { articleOptions } from './articleSearch'

type Supplier = { id: number; name: string }
type Category = Supplier
type Product = { id: number; name: string; brand: string; own_code: string | null; category_id: number | null; category: string | null }
type Item = { id: number; supplier_id: number; supplier: string; code: string; name: string; own_code: string | null; product_id: number | null; archived: boolean }
type Balance = { item_id: number; quantity: string }
type Note = { id: number; kind: 'entry' | 'exit'; created_at: string; counterpart: string; supplier?: string; lines?: NoteLine[] }
type NoteLine = { name: string; brand: string; own_code: string | null; supplier_code: string; supplier: string; quantity: string }
type ShelfEntry = { id: number; quantity: string; stock_after: string; created_at: string; name: string; code: string; supplier: string }
type Data = { suppliers: Supplier[]; categories: Category[]; products: Product[]; items: Item[]; balances: Balance[]; notes: Note[]; shelf_entries: ShelfEntry[]; archive_supported: boolean }
type Sheet = { name: string; rows: string[][] }
type DraftRow = { code: string; name: string; selected: boolean; archiveCode: string | null; archiveSupplier: string | null }
type DraftLine = { item_id: string; quantity: string; search: string }

const emptyData: Data = { suppliers: [], categories: [], products: [], items: [], balances: [], notes: [], shelf_entries: [], archive_supported: false }
const input = 'min-h-12 rounded-lg border-2 border-slate-400 bg-white px-3 py-2 text-base text-slate-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700'
const button = 'min-h-12 rounded-lg bg-lobeto-navy px-5 py-3 text-base font-semibold text-white hover:bg-lobeto-navy-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-500'
const panel = 'rounded-xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6'
const secondaryButton = `${input} font-semibold text-lobeto-navy hover:bg-slate-100`
const emptyLine = () => ({ item_id: '', quantity: '', search: '' })
const displayQuantity = (value: string) => value.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1').replace('.', ',')

export function StockApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const loggingInRef = useRef(false)
  useEffect(() => {
    api<{ authenticated: boolean }>('/session').then((r) => setAuthenticated(r.authenticated)).catch((e: Error) => setError(e.message))
  }, [])
  async function login(event: FormEvent) {
    event.preventDefault()
    if (loggingInRef.current) return
    loggingInRef.current = true
    setLoggingIn(true)
    try {
      setError('')
      await api('/login', 'POST', { username, password })
      setPassword('')
      setAuthenticated(true)
    } catch (e) { setError((e as Error).message) } finally {
      loggingInRef.current = false
      setLoggingIn(false)
    }
  }
  if (authenticated === null) return <p className="p-6" role="alert">{error || 'Cargando...'}</p>
  if (!authenticated) return (
    <main className="mx-auto max-w-md px-4 py-16">
      <a href="/" className="text-sm text-lobeto-navy">← Volver a la web</a>
      <form className={`${panel} mt-6 space-y-4`} onSubmit={login}>
        <h1 className="text-2xl font-bold text-lobeto-navy">Ingreso a stock</h1>
        <label className="block">Usuario<input className={`${input} mt-1 w-full`} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
        <label className="block">Contraseña<input className={`${input} mt-1 w-full`} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button className={button} disabled={loggingIn}>{loggingIn ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </main>
  )
  return <Dashboard onLogout={() => setAuthenticated(false)} />
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<Data>(emptyData)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [tab, setTab] = useState<'stock' | 'catalogo' | 'importar' | 'remitos'>('stock')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [search, setSearch] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [itemSupplier, setItemSupplier] = useState('')
  const [itemCode, setItemCode] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemProduct, setItemProduct] = useState('')
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [sheetIndex, setSheetIndex] = useState(0)
  const [codeColumn, setCodeColumn] = useState('0')
  const [nameColumn, setNameColumn] = useState('1')
  const [draft, setDraft] = useState<DraftRow[]>([])
  const [draftSearch, setDraftSearch] = useState('')
  const [duplicateIndexes, setDuplicateIndexes] = useState<number[] | null>(null)
  const [importSupplier, setImportSupplier] = useState('')
  const [kind, setKind] = useState<'entry' | 'exit'>('entry')
  const [noteSupplier, setNoteSupplier] = useState('')
  const [counterpart, setCounterpart] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()])
  const [noteReview, setNoteReview] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const noteSavingRef = useRef(false)
  const [stockPage, setStockPage] = useState(0)
  const [showWithoutStock, setShowWithoutStock] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [shelfItemId, setShelfItemId] = useState<number | null>(null)
  const [shelfQuantity, setShelfQuantity] = useState('')
  const [shelfReview, setShelfReview] = useState(false)
  const [shelfRequestId, setShelfRequestId] = useState('')
  const [shelfError, setShelfError] = useState('')
  const [shelfSaving, setShelfSaving] = useState(false)
  const shelfSavingRef = useRef(false)
  const [printNote, setPrintNote] = useState<Note | null>(null)

  async function refresh() {
    const result = await api<Data>('/data')
    if (!Array.isArray(result.shelf_entries) || result.archive_supported !== true) throw new Error('El servidor necesita actualizarse. Detené el backend, ejecutá la migración y volvé a iniciarlo.')
    setData(result)
  }
  useEffect(() => { refresh().catch((e: Error) => setError(e.message)) }, [])
  async function run(action: () => Promise<void>, success?: string) {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      setError('')
      setMessage('')
      await action()
      if (success) setMessage(success)
    } catch (e) { setError((e as Error).message) } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  const selectedRows = useMemo(() => draft.filter((row) => row.selected), [draft])
  const existing = data.items.filter((item) => String(item.supplier_id) === importSupplier)
  const existingByCode = new Map(existing.map((item) => [item.code, item]))
  const selectedCodes = new Set(selectedRows.map((row) => row.code.trim()))
  const archiveCodes = new Set(draft.flatMap((row) => !row.selected && row.archiveCode && row.archiveSupplier === importSupplier && !selectedCodes.has(row.archiveCode) ? [row.archiveCode] : []))
  const archiveItems = existing.filter((item) => !item.archived && archiveCodes.has(item.code))
  const archiveItemIds = new Set(archiveItems.map((item) => item.id))
  const duplicateCodes = useMemo(() => {
    const seen = new Set<string>()
    const duplicates = new Set<string>()
    selectedRows.forEach((row) => { if (seen.has(row.code.trim())) duplicates.add(row.code.trim()); seen.add(row.code.trim()) })
    return duplicates
  }, [selectedRows])
  const importBlockers = [
    !importSupplier && 'Elegí un proveedor.',
    !selectedRows.length && !archiveItems.length && 'Marcá alguna fila para importar o desmarcá un artículo existente para archivarlo.',
    duplicateCodes.size > 0 && 'Corregí o desmarcá los códigos repetidos.',
  ].filter(Boolean)
  const visibleDraft = useMemo(() => {
    const indexes = duplicateIndexes ?? draft.map((_, index) => index)
    const query = draftSearch.trim().toLowerCase()
    return indexes.flatMap((index) => {
      const row = draft[index]
      return row && `${row.code} ${row.name}`.toLowerCase().includes(query) ? [{ row, index }] : []
    })
  }, [draft, draftSearch, duplicateIndexes])
  const absent = existing.filter((item) => !selectedCodes.has(item.code) && !archiveCodes.has(item.code))
  const balances = new Map(data.balances.map((balance) => [balance.item_id, balance.quantity]))
  const hasStock = (item: Item) => Number(balances.get(item.id) || 0) > 0
  const availableItems = data.items.filter((item) => (!item.archived || hasStock(item) || showArchived) && (showWithoutStock || hasStock(item)))
  const filteredItems = articleOptions(availableItems, search, supplierFilter, '').matches
  const pageSize = 20
  const maxStockPage = Math.max(0, Math.ceil(filteredItems.length / pageSize) - 1)
  const currentStockPage = Math.min(stockPage, maxStockPage)
  const visibleStockItems = filteredItems.slice(currentStockPage * pageSize, (currentStockPage + 1) * pageSize)
  function prepareRows() {
    const sheet = sheets[sheetIndex]
    if (!sheet) return
    setDraftSearch('')
    setDuplicateIndexes(null)
    setDraft(sheet.rows.map((row) => {
      const code = (row[Number(codeColumn)] || '').trim()
      const itemNameValue = (row[Number(nameColumn)] || '').trim()
      return { code, name: itemNameValue, selected: (existingByCode.has(code) || (code.length >= 4 && /\d/.test(code))) && !!itemNameValue, archiveCode: null, archiveSupplier: null }
    }).filter((row) => row.code || row.name))
  }
  function showDuplicates(code?: string) {
    const indexes = draft.flatMap((row, index) => row.selected && duplicateCodes.has(row.code.trim()) && (!code || row.code.trim() === code) ? [index] : [])
    indexes.sort((a, b) => draft[a].code.trim().localeCompare(draft[b].code.trim()) || a - b)
    setDraftSearch('')
    setDuplicateIndexes(indexes)
  }
  function updateDraft(index: number, patch: Partial<DraftRow>) {
    setDraft((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row))
  }
  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, ...patch } : line))
  }
  function changeNoteKind(next: 'entry' | 'exit') {
    if (next === kind) return
    if (lines.some((line) => line.item_id || line.quantity || line.search) && !window.confirm('Al cambiar el tipo se borrarán los artículos escritos en este remito. ¿Querés continuar?')) return
    setKind(next)
    setLines([emptyLine()])
  }
  function changeNoteSupplier(value: string) {
    if (value === noteSupplier) return
    if (lines.some((line) => line.item_id || line.quantity || line.search) && !window.confirm('Al cambiar el proveedor se borrarán los artículos escritos en este remito. ¿Querés continuar?')) return
    setNoteSupplier(value)
    setLines([emptyLine()])
  }
  function chooseShelfItem(itemId: number) {
    if (shelfItemId !== null && shelfItemId !== itemId && shelfQuantity && !window.confirm('Se cerrará la carga de estantería que estabas preparando. ¿Querés continuar?')) return
    setShelfItemId(itemId)
    setShelfQuantity('')
    setShelfReview(false)
    setShelfRequestId('')
    setShelfError('')
  }
  async function saveShelf() {
    if (shelfSavingRef.current || shelfItemId === null || !shelfRequestId) return
    shelfSavingRef.current = true
    setShelfSaving(true)
    setShelfError('')
    let result: { stock_after: string }
    try {
      result = await api('/shelf-entries', 'POST', { item_id: shelfItemId, quantity: shelfQuantity, request_id: shelfRequestId })
    } catch (e) {
      setShelfError(`No pudimos confirmar si se guardó. Reintentá esta misma carga o revisá el historial antes de volver a contar. ${(e as Error).message}`)
      shelfSavingRef.current = false
      setShelfSaving(false)
      return
    }
    setShelfItemId(null)
    setShelfReview(false)
    setShelfQuantity('')
    setShelfRequestId('')
    setMessage(`Carga guardada. El stock registrado quedó en ${displayQuantity(result.stock_after)}.`)
    try { await refresh() } catch (e) { setError(`La carga se guardó, pero no se pudo actualizar la pantalla: ${(e as Error).message}`) }
    shelfSavingRef.current = false
    setShelfSaving(false)
  }
  async function saveNote() {
    if (noteSavingRef.current) return
    noteSavingRef.current = true
    setNoteSaving(true)
    setError('')
    setMessage('')
    let result: { id: number }
    try {
      result = await api('/notes', 'POST', { kind, supplier_id: noteSupplier, counterpart, lines: lines.map(({ item_id, quantity }) => ({ item_id, quantity })) })
    } catch (e) {
      setError(`No pudimos confirmar si el remito se registró. Revisá los últimos remitos antes de volver a intentarlo. ${(e as Error).message}`)
      noteSavingRef.current = false
      setNoteSaving(false)
      return
    }
    setLines([emptyLine()])
    setNoteReview(false)
    setMessage(`Remito #${result.id} registrado. No vuelvas a cargarlo.`)
    try {
      setPrintNote(await api<Note>(`/notes/${result.id}`))
      await refresh()
    } catch (e) { setError(`El remito #${result.id} se guardó, pero no se pudo actualizar la pantalla: ${(e as Error).message}`) }
    noteSavingRef.current = false
    setNoteSaving(false)
  }
  const supplierOptions = data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
  const productOptions = data.products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.brand ? ` — ${p.brand}` : ''}{p.own_code ? ` (${p.own_code})` : ''}</option>)
  const supplierSelect = (value: string, change: (value: string) => void, required = false) => <select className={input} value={value} onChange={(e) => change(e.target.value)} required={required}><option value="">Elegir proveedor</option>{supplierOptions}</select>
  const visibilityOptions = <div className="flex flex-wrap gap-5">
    <label className="flex items-center gap-2 font-semibold"><input className="h-5 w-5" type="checkbox" checked={showWithoutStock} onChange={(e) => { setShowWithoutStock(e.target.checked); if (!e.target.checked) setShowArchived(false); setStockPage(0) }} />Mostrar también productos sin stock para cargarlos</label>
    {showWithoutStock && <label className="flex items-center gap-2 font-semibold"><input className="h-5 w-5" type="checkbox" checked={showArchived} onChange={(e) => { setShowArchived(e.target.checked); setStockPage(0) }} />Mostrar archivados sin stock</label>}
  </div>
  return (
    <div className="min-h-screen bg-slate-50 text-base leading-relaxed text-slate-900">
      <header className="no-print bg-lobeto-navy px-4 py-5 text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wider text-blue-100">Lobeto Tambos</p><strong className="text-2xl">Gestión de stock</strong></div><div className="flex flex-wrap gap-5 text-base font-semibold"><a className="underline underline-offset-4" href="/">Volver a la web</a><button className="underline underline-offset-4 disabled:opacity-50" disabled={busy || noteSaving || shelfSaving} onClick={() => run(async () => { await api('/logout', 'POST'); onLogout() })}>Cerrar sesión</button></div></div></header>
      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        {error && <p className="no-print rounded bg-red-100 p-3 text-red-800" role="alert">{error}</p>}
        {message && <p className="no-print rounded bg-green-100 p-3 text-green-800" role="status">{message}</p>}
        {(busy || noteSaving || shelfSaving) && <p className="no-print rounded-lg bg-blue-100 p-4 text-lg font-bold text-lobeto-navy" role="status">Procesando… Esperá, no hace falta volver a hacer clic.</p>}
        <fieldset className="min-w-0 space-y-5" disabled={busy || noteSaving || shelfSaving} aria-busy={busy || noteSaving || shelfSaving}>
        <nav aria-label="Secciones de gestión" className="no-print flex flex-wrap gap-3">{([['stock', 'Consultar y cargar stock'], ['remitos', 'Hacer un remito'], ['catalogo', 'Productos y proveedores'], ['importar', 'Importar listas']] as const).map(([key, label]) => <button key={key} aria-current={tab === key ? 'page' : undefined} className={tab === key ? button : secondaryButton} onClick={() => { setTab(key); setPrintNote(null) }}>{label}</button>)}</nav>
        {tab === 'catalogo' && <div className="no-print space-y-3"><div className="flex flex-wrap gap-3"><label className="font-semibold">Proveedor {supplierSelect(supplierFilter, (value) => { setSupplierFilter(value); setStockPage(0) })}</label><label className="font-semibold">Buscar <input className={input} placeholder="Nombre o código" value={search} onChange={(e) => { setSearch(e.target.value); setStockPage(0) }} /></label></div>{visibilityOptions}</div>}
        {tab === 'stock' && <div className="space-y-5">
          <section className={`${panel} border-l-8 border-l-lobeto-navy`}>
            <p className="font-semibold text-lobeto-navy">CONSULTAR Y CARGAR STOCK</p>
            <h1 className="mt-1 text-3xl font-bold">Encontrá un producto</h1>
            <p className="mt-2 max-w-3xl text-lg">Buscá por nombre o código para ver lo registrado. También podés sumar las unidades que ya tenías en la estantería.</p>
            <p className="mt-3 text-lg"><strong>Para cargar estantería:</strong> buscá el producto y elegí «Sumar stock de estantería» debajo de su nombre.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <label className="block font-bold">Nombre o código del producto<input className={`${input} mt-2 w-full`} type="search" placeholder="Ejemplo: pezonera o 040282" value={search} disabled={shelfSaving} onChange={(e) => { setSearch(e.target.value); setStockPage(0) }} /></label>
              <label className="block font-bold">Proveedor <span className="font-normal">(opcional)</span><select className={`${input} mt-2 w-full`} value={supplierFilter} disabled={shelfSaving} onChange={(e) => { setSupplierFilter(e.target.value); setStockPage(0) }}><option value="">Todos los proveedores</option>{supplierOptions}</select></label>
            </div>
            <div className="mt-4">{visibilityOptions}</div>
            <p className="mt-3 text-base text-slate-700" role="status">{filteredItems.length} producto{filteredItems.length === 1 ? '' : 's'} encontrado{filteredItems.length === 1 ? '' : 's'}.</p>
          </section>
          <section aria-label="Resultados de búsqueda" className="space-y-3">
            {!filteredItems.length && <p className={panel}>{showWithoutStock ? 'No encontramos productos. Probá con otro nombre, código o proveedor.' : 'No encontramos productos con stock. Para cargar uno sin stock, marcá «Mostrar también productos sin stock para cargarlos».'}</p>}
            {visibleStockItems.map((item) => {
              const quantity = balances.get(item.id)
              const product = data.products.find((p) => p.id === item.product_id)
              return <article key={item.id} className={panel}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0"><h2 className="break-words text-xl font-bold">{item.name}</h2>{item.archived && <p className="font-semibold text-amber-900">Archivado</p>}<p className="mt-1 text-base">Proveedor: <strong>{item.supplier}</strong>{product?.brand && <> · Marca: <strong>{product.brand}</strong></>}</p><p className="text-base text-slate-700">Código proveedor: {item.code}{item.own_code && <> · Código LT: {item.own_code}</>}{product?.category && <> · Rubro: {product.category}</>}</p></div>
                  <div className="rounded-lg bg-blue-50 px-4 py-3"><p className="font-semibold text-lobeto-navy">Stock registrado</p><p className="text-2xl font-bold">{quantity === undefined ? 'Sin registrar' : displayQuantity(quantity)}</p></div>
                </div>
                {shelfItemId !== item.id && <button type="button" className={`${secondaryButton} mt-4`} disabled={shelfSaving} onClick={() => chooseShelfItem(item.id)}>Sumar stock de estantería</button>}
                {item.archived && <button type="button" className={`${secondaryButton} ml-3 mt-4`} onClick={() => run(async () => { await api(`/items/${item.id}/reactivate`, 'PUT'); await refresh() }, 'Artículo reactivado.')}>Volver a activar</button>}
                {shelfItemId === item.id && <div className="mt-4 rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
                  <h3 className="text-xl font-bold">Sumar stock que ya tenías</h3>
                  <p className="mt-2">Usá esto para contar la estantería de a poco. <strong>Se suma</strong> al stock registrado; no crea un remito.</p>
                  <p className="mt-2 font-semibold">Cargá solo unidades que todavía no registraste. No repitas unidades ya cargadas o ingresadas por remito.</p>
                  {!shelfReview ? <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); setShelfRequestId(crypto.randomUUID()); setShelfError(''); setShelfReview(true) }}>
                    <label className="font-bold">Unidades que vas a sumar<input className={`${input} mt-2 block w-44`} type="number" min="0.001" max="999999999999.999" step="0.001" inputMode="decimal" value={shelfQuantity} onChange={(e) => setShelfQuantity(e.target.value)} required /></label>
                    <button className={button}>Revisar carga</button><button type="button" className={secondaryButton} onClick={() => setShelfItemId(null)}>Cancelar</button>
                  </form> : <div className="mt-4 space-y-3">
                    <p className="text-lg"><strong>Revisá antes de guardar:</strong> se sumarán <strong>{displayQuantity(shelfQuantity)}</strong> unidades de <strong>{item.name}</strong> ({item.supplier}, código {item.code}).</p>
                    <p>Stock registrado al consultar: <strong>{quantity === undefined ? 'sin registrar' : displayQuantity(quantity)}</strong>. La suma no reemplaza los remitos.</p>
                    {shelfError && <p className="rounded bg-red-100 p-3 text-red-900" role="alert">{shelfError}</p>}
                    <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={shelfSaving} onClick={saveShelf}>{shelfSaving ? 'Guardando…' : 'Confirmar y sumar'}</button><button type="button" className={secondaryButton} disabled={shelfSaving} onClick={() => setShelfReview(false)}>Cambiar cantidad</button><button type="button" className={secondaryButton} disabled={shelfSaving} onClick={() => setShelfItemId(null)}>Cancelar</button></div>
                  </div>}
                </div>}
              </article>
            })}
          </section>
          {filteredItems.length > pageSize && <nav aria-label="Páginas de productos" className="flex flex-wrap items-center gap-3"><button type="button" className={secondaryButton} disabled={currentStockPage === 0 || shelfSaving} onClick={() => setStockPage(currentStockPage - 1)}>Anterior</button><span>Página {currentStockPage + 1} de {maxStockPage + 1}</span><button type="button" className={secondaryButton} disabled={currentStockPage === maxStockPage || shelfSaving} onClick={() => setStockPage(currentStockPage + 1)}>Siguiente</button></nav>}
          <details className={panel}><summary className="cursor-pointer text-lg font-bold">Ver últimas cargas de estantería</summary><p className="mt-2">Estas cargas son independientes de los remitos.</p>{data.shelf_entries.length === 0 ? <p className="mt-2">Todavía no hay cargas de estantería.</p> : <ul className="mt-3 space-y-2">{data.shelf_entries.map((entry) => <li key={entry.id} className="border-t border-slate-300 pt-2">{new Date(entry.created_at).toLocaleString('es-AR')} · <strong>{entry.name}</strong> ({entry.supplier}, {entry.code}): se sumaron <strong>{displayQuantity(entry.quantity)}</strong>; stock registrado después: {displayQuantity(entry.stock_after)}.</li>)}</ul>}</details>
        </div>}
        {tab === 'catalogo' && <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <form className={`${panel} flex flex-wrap items-end gap-2`} onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/suppliers', 'POST', { name: supplierName }); setSupplierName(''); await refresh() }, 'Proveedor creado.') }}><label>Nuevo proveedor <input className={input} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required /></label><button className={button}>Agregar</button></form>
            <form className={`${panel} flex flex-wrap items-end gap-2`} onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/categories', 'POST', { name: categoryName }); setCategoryName(''); await refresh() }, 'Rubro creado.') }}><label>Nuevo rubro <input className={input} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required /></label><button className={button}>Agregar</button></form>
          </div>
          <form className={`${panel} space-y-3`} onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/products', 'POST', { name, brand, category_id: categoryId }); setName(''); setBrand(''); await refresh() }, 'Detalle de producto creado.') }}><h2 className="font-bold">Crear detalle de producto (opcional)</h2><div className="flex flex-wrap gap-2"><input className={input} placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} required /><input className={input} placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} /><select className={input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Sin rubro</option>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className={button}>Crear producto</button></div><p className="text-sm text-slate-600">Podés usarlo para indicar marca y rubro; no es necesario para registrar stock.</p></form>
          <section className={panel}><h2 className="mb-3 font-bold">Detalles de productos</h2><div className="max-h-96 space-y-2 overflow-auto">{data.products.map((product) => <ProductEditor key={product.id} product={product} categories={data.categories} save={(values) => run(async () => { await api(`/products/${product.id}`, 'PUT', values); await refresh() }, 'Producto actualizado.')} />)}</div></section>
          <form className={`${panel} space-y-3`} onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/items', 'POST', { supplier_id: itemSupplier, code: itemCode, name: itemName, product_id: itemProduct }); setItemCode(''); setItemName(''); await refresh() }, 'Artículo agregado.') }}><h2 className="font-bold">Agregar artículo de proveedor manualmente</h2><div className="flex flex-wrap gap-2">{supplierSelect(itemSupplier, setItemSupplier, true)}<input className={input} placeholder="Código del proveedor" value={itemCode} onChange={(e) => setItemCode(e.target.value)} required /><input className={input} placeholder="Nombre del proveedor" value={itemName} onChange={(e) => setItemName(e.target.value)} required /><select className={input} value={itemProduct} onChange={(e) => setItemProduct(e.target.value)}><option value="">Sin vincular</option>{productOptions}</select><button className={button}>Agregar</button></div></form>
          <section className={panel}><h2 className="mb-2 font-bold">Artículos de proveedores ({filteredItems.length})</h2><p className="mb-3 text-sm text-slate-600">Asigná el mismo código LT a artículos equivalentes, aunque sean de distintas marcas. Es opcional y el stock permanece separado por artículo y proveedor. También podés archivar artículos que ya no estén en la lista.</p><div className="max-h-[36rem] overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Proveedor</th><th>Código proveedor</th><th>Nombre</th><th>Código LT (opcional)</th><th>Detalle de producto (opcional)</th><th>Estado</th></tr></thead><tbody>{filteredItems.map((item) => <tr className="border-t" key={item.id}><td>{item.supplier}</td><td>{item.code}</td><td>{item.name}</td><td><ItemCodeEditor item={item} save={(ownCode) => run(async () => { await api(`/items/${item.id}/own-code`, 'PUT', { own_code: ownCode }); await refresh() }, 'Código LT guardado.')} /></td><td>{item.product_id ? data.products.find((p) => p.id === item.product_id)?.name : <select className={input} value="" onChange={(e) => { if (e.target.value) run(async () => { await api(`/items/${item.id}/link`, 'PUT', { product_id: e.target.value }); await refresh() }, 'Artículo vinculado.') }}><option value="">Sin detalle</option>{productOptions}</select>}</td><td>{item.archived ? <span className="font-semibold">Archivado</span> : <button type="button" className={secondaryButton} onClick={() => { if (window.confirm(`¿Archivar ${item.name} (${item.supplier}, código ${item.code})? Se conservarán su stock y sus remitos.`)) run(async () => { await api(`/items/${item.id}/archive`, 'PUT'); try { await refresh() } catch (e) { throw new Error(`El artículo se archivó, pero no se pudo actualizar la pantalla. Recargá la página. ${(e as Error).message}`) } }, 'Artículo archivado. Su stock y remitos se conservan.') }}>Archivar</button>}</td></tr>)}</tbody></table></div></section>
        </div>}
        {tab === 'importar' && <section className={`${panel} space-y-4`}><h1 className="text-xl font-bold">Importar o reemplazar lista</h1><p className="text-sm">Se conserva el stock. Los códigos ausentes permanecen activos. Elegí el proveedor antes de desmarcar: los artículos existentes desmarcados se archivarán al confirmar. No se guardan precios.</p><div className="flex flex-wrap items-end gap-4"><label className="block font-bold">Proveedor<span className="mt-2 block">{supplierSelect(importSupplier, setImportSupplier, true)}</span></label><label className="block min-w-0 font-bold">Lista del proveedor (Excel o PDF)<input className="mt-2 block max-w-full rounded-lg border-2 border-slate-400 bg-white p-2 text-base font-normal focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-lobeto-navy file:px-5 file:py-3 file:font-semibold file:text-white hover:file:bg-lobeto-navy-dark" type="file" accept=".xlsx,.pdf" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; run(async () => { const form = new FormData(); form.append('file', file); const result = await api<{ sheets: Sheet[] }>('/import/read', 'POST', form); setSheets(result.sheets); setSheetIndex(0); setDraft([]) }, 'Archivo leído. Elegí las columnas y revisá las filas.') }} /></label></div>
          {sheets.length > 0 && <div className="flex flex-wrap items-center gap-2"><label>Hoja <select className={input} value={sheetIndex} onChange={(e) => setSheetIndex(Number(e.target.value))}>{sheets.map((sheet, i) => <option key={i} value={i}>{sheet.name}</option>)}</select></label><label>Columna código <input className={`${input} w-20`} type="number" min="1" value={Number(codeColumn) + 1} onChange={(e) => setCodeColumn(String(Number(e.target.value) - 1))} /></label><label>Columna nombre <input className={`${input} w-20`} type="number" min="1" value={Number(nameColumn) + 1} onChange={(e) => setNameColumn(String(Number(e.target.value) - 1))} /></label><button className={button} onClick={prepareRows}>Preparar vista previa</button></div>}
          {draft.length > 0 && <>
            <p className="text-sm">Revisá las filas marcadas: se excluyen automáticamente posibles títulos, pero la selección puede requerir correcciones. Marcadas: {selectedRows.length}. Códigos repetidos: {duplicateCodes.size}. Existentes ausentes (seguirán activos): {absent.length}. Si varias filas tienen el mismo código y una sigue marcada, el artículo no se archivará.</p>
            {archiveItems.length > 0 && <div className="rounded-lg bg-amber-50 p-4 text-amber-950" role="status"><p className="font-bold">Se archivarán {archiveItems.length} artículo{archiveItems.length === 1 ? '' : 's'} al confirmar.</p><p>Se conservan el stock y los remitos. Si tienen stock, seguirán visibles.</p><details className="mt-2"><summary className="cursor-pointer font-semibold">Ver artículos que se archivarán</summary><ul className="mt-2 max-h-40 overflow-auto">{archiveItems.map((item) => <li key={item.id}>{item.code} · {item.name}</li>)}</ul></details></div>}
            {duplicateCodes.size > 0 && <div role="alert" className="space-y-2 rounded bg-red-50 p-3 text-red-800">
              <p>Resolvé los códigos repetidos editando el código o desmarcando las filas que no quieras importar.</p>
              <div className="flex flex-wrap gap-2">{[...duplicateCodes].map((code) => <button key={code} type="button" className="rounded border border-red-300 bg-white px-2 py-1 text-sm underline" onClick={() => showDuplicates(code)} aria-label={`Buscar código repetido ${code}`}>{code}</button>)}</div>
            </div>}
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">Buscar por código o nombre <input className={`${input} ml-2`} value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} placeholder="Buscar en la lista" /></label>
              <button type="button" className={input} onClick={() => showDuplicates()} disabled={!duplicateCodes.size}>{duplicateIndexes ? 'Actualizar repetidos' : 'Mostrar repetidos'}</button>
              {(duplicateIndexes || draftSearch) && <button type="button" className={input} onClick={() => { setDuplicateIndexes(null); setDraftSearch('') }}>Mostrar todas las filas</button>}
              <span className="text-sm text-slate-600">{visibleDraft.length} filas visibles</span>
            </div>
            {duplicateIndexes && <p className="text-sm text-slate-600">Los repetidos se agrupan por código y permanecen visibles mientras los corregís. Usá «Actualizar repetidos» para revisar los pendientes.</p>}
            <details><summary>Ver códigos ausentes</summary><p className="max-h-32 overflow-auto text-sm">{absent.map((i) => `${i.code} ${i.name}`).join(' · ') || 'Ninguno'}</p></details>
            <div className="max-h-[32rem] overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Importar</th><th>Código</th><th>Nombre</th><th>Cambio</th></tr></thead><tbody>{visibleDraft.map(({ row, index }) => { const old = existingByCode.get(row.code.trim()); const repeated = row.selected && duplicateCodes.has(row.code.trim()); const archiving = old && archiveItemIds.has(old.id) && row.archiveCode === old.code && row.archiveSupplier === importSupplier; return <tr key={index} className={repeated ? 'border-t bg-red-50' : 'border-t'}><td><input type="checkbox" checked={row.selected} onChange={(e) => updateDraft(index, { selected: e.target.checked, archiveCode: e.target.checked ? null : row.code.trim(), archiveSupplier: e.target.checked ? null : importSupplier || null })} aria-label={`Importar fila ${index + 1}`} /></td><td><input className={`${input} w-40`} value={row.code} onChange={(e) => updateDraft(index, { code: e.target.value, archiveCode: null, archiveSupplier: null })} aria-label={`Código fila ${index + 1}`} /></td><td><input className={`${input} w-full min-w-64`} value={row.name} onChange={(e) => updateDraft(index, { name: e.target.value })} aria-label={`Nombre fila ${index + 1}`} /></td><td>{archiving ? 'Se archivará' : old ? old.name === row.name.trim() ? 'Sin cambios' : `Antes: ${old.name}` : 'Nuevo'}{repeated && <span className="ml-2 font-medium text-red-700">Repetido</span>}</td></tr> })}</tbody></table>{visibleDraft.length === 0 && <p className="py-3 text-sm">No hay filas para mostrar con este filtro.</p>}</div>
            {importBlockers.length > 0 && <div className="rounded bg-amber-50 p-3 text-sm text-amber-900" role="status"><p>Para confirmar la importación:</p><ul className="list-inside list-disc">{importBlockers.map((reason) => <li key={String(reason)}>{reason}</li>)}</ul></div>}
            <button className={button} disabled={importBlockers.length > 0 || !data.archive_supported} onClick={() => run(async () => { await api('/import/confirm', 'POST', { supplier_id: importSupplier, rows: selectedRows, archive_ids: archiveItems.map((item) => item.id) }); setDraft([]); try { await refresh() } catch (e) { throw new Error(`La importación se guardó, pero no se pudo actualizar la pantalla. No la vuelvas a confirmar; recargá la página. ${(e as Error).message}`) } }, 'Lista actualizada. Se conservaron el stock y los remitos.')}>{busy ? 'Procesando…' : 'Confirmar importación'}</button>
          </>}
        </section>}
        {tab === 'remitos' && <div className="space-y-5">
          {!noteReview ? <form className={`${panel} no-print space-y-6`} onSubmit={(e) => { e.preventDefault(); setError(''); setNoteReview(true) }}>
            <div><p className="font-semibold text-lobeto-navy">REMITOS</p><h1 className="mt-1 text-3xl font-bold">Preparar un remito</h1><p className="mt-2 text-lg">Seguí los pasos. Antes de guardar vas a poder revisar todo.</p></div>
            <fieldset><legend className="text-xl font-bold">1. ¿La mercadería entra o sale?</legend><div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 ${kind === 'entry' ? 'border-lobeto-navy bg-blue-50' : 'border-slate-400'}`}><input className="mt-1 h-5 w-5" type="radio" name="note-kind" checked={kind === 'entry'} onChange={() => changeNoteKind('entry')} /><span><strong className="block text-lg">Entrada: recibo mercadería</strong><span>Las cantidades se suman al stock.</span></span></label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 ${kind === 'exit' ? 'border-lobeto-navy bg-blue-50' : 'border-slate-400'}`}><input className="mt-1 h-5 w-5" type="radio" name="note-kind" checked={kind === 'exit'} onChange={() => changeNoteKind('exit')} /><span><strong className="block text-lg">Salida: entrego mercadería</strong><span>Las cantidades se restan del stock.</span></span></label>
            </div></fieldset>
            <section><h2 className="text-xl font-bold">2. {kind === 'entry' ? 'Elegí el proveedor' : 'Indicá el destino'}</h2><div className="mt-3 grid gap-4 md:grid-cols-2">
              {kind === 'entry' && <label className="font-semibold">Proveedor del remito<select className={`${input} mt-2 block w-full`} value={noteSupplier} onChange={(e) => changeNoteSupplier(e.target.value)} required><option value="">Elegí un proveedor</option>{supplierOptions}</select></label>}
              <label className="font-semibold">{kind === 'entry' ? 'Referencia' : 'Cliente o destino'} <span className="font-normal">(opcional)</span><input className={`${input} mt-2 block w-full`} value={counterpart} onChange={(e) => setCounterpart(e.target.value)} /></label>
            </div>{kind === 'exit' && <p className="mt-2">Podés elegir artículos de distintos proveedores en el mismo remito.</p>}</section>
            <section><h2 className="text-xl font-bold">3. Agregá los artículos</h2><p className="mt-2">Buscá cada artículo por nombre o código, elegilo de la lista e indicá la cantidad.</p>
              {kind === 'entry' && !noteSupplier && <p className="mt-3 rounded bg-amber-50 p-3 font-semibold text-amber-900">Primero elegí el proveedor en el paso 2.</p>}
              <div className="mt-4 space-y-4">{lines.map((line, index) => {
                const noteItems = kind === 'entry' && !noteSupplier ? [] : data.items.filter((item) => kind === 'entry' ? !item.archived || hasStock(item) : hasStock(item))
                const { matches, options } = articleOptions(noteItems, line.search, kind === 'entry' ? noteSupplier : '', line.item_id)
                const matchingIds = new Set(matches.map((item) => item.id))
                const locked = kind === 'entry' && !noteSupplier
                const selectedBalance = balances.get(Number(line.item_id))
                return <div key={index} className="rounded-lg border-2 border-slate-300 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">Artículo {index + 1}</h3>{lines.length > 1 && <button type="button" className={secondaryButton} onClick={() => setLines(lines.filter((_, i) => i !== index))}>Quitar artículo {index + 1}</button>}</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(8rem,0.5fr)]">
                    <label className="font-semibold">Buscar por nombre o código<input className={`${input} mt-2 block w-full`} type="search" placeholder="Nombre, código o código LT" aria-label={`Buscar artículo ${index + 1}`} disabled={locked} value={line.search} onChange={(e) => updateLine(index, { search: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }} /></label>
                    <label className="min-w-0 font-semibold">Elegir artículo<select className={`${input} mt-2 block w-full`} value={line.item_id} onChange={(e) => updateLine(index, { item_id: e.target.value })} disabled={locked} required aria-label={`Artículo ${index + 1}`}><option value="">Elegí un artículo de la lista</option>{options.map((item) => <option key={item.id} value={item.id}>{item.supplier} · {item.code} · {item.name}{item.own_code ? ` · LT: ${item.own_code}` : ''}{item.archived ? ' (archivado)' : ''}{!matchingIds.has(item.id) ? ' (seleccionado)' : ''}</option>)}</select></label>
                    <label className="font-semibold">Cantidad<input className={`${input} mt-2 block w-full`} type="number" min="0.001" max="999999999999.999" step="0.001" inputMode="decimal" aria-label={`Cantidad del artículo ${index + 1}`} value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} required /></label>
                  </div>
                  {line.search.trim() && <p className="mt-2 text-slate-700" role="status">{matches.length ? `${matches.length} coincidencia${matches.length === 1 ? '' : 's'}` : 'No encontramos artículos con esa búsqueda.'}</p>}
                  {line.item_id && <p className="mt-2">Stock registrado de este artículo: <strong>{selectedBalance === undefined ? 'sin registrar' : displayQuantity(selectedBalance)}</strong>. {kind === 'exit' && selectedBalance === undefined && 'Si ya está en la estantería, primero cargalo en Consultar stock.'}</p>}
                </div>
              })}</div>
              <button type="button" className={`${secondaryButton} mt-4`} onClick={() => setLines([...lines, emptyLine()])}>+ Agregar otro artículo</button>
            </section>
            <section className="border-t border-slate-300 pt-5"><h2 className="text-xl font-bold">4. Revisá y guardá</h2><p className="mt-2">{kind === 'entry' ? 'La entrada sumará las cantidades indicadas.' : 'La salida restará las cantidades indicadas. No se permite dejar el stock negativo.'}</p><button className={`${button} mt-4`}>Revisar el remito</button></section>
          </form> : <section className={`${panel} no-print space-y-4`}><p className="font-semibold text-lobeto-navy">ÚLTIMO PASO</p><h1 className="text-3xl font-bold">Revisá el remito antes de guardar</h1><p className="text-lg"><strong>{kind === 'entry' ? 'Entrada: suma stock' : 'Salida: resta stock'}</strong>{kind === 'entry' && <> · Proveedor: {data.suppliers.find((supplier) => String(supplier.id) === noteSupplier)?.name}</>}{counterpart && <> · {kind === 'entry' ? 'Referencia' : 'Destino'}: {counterpart}</>}</p><ul className="space-y-2">{lines.map((line, index) => { const item = data.items.find((candidate) => String(candidate.id) === line.item_id); return <li key={index} className="rounded-lg border border-slate-300 p-4"><strong>{item?.name}</strong><span className="block">Proveedor: {item?.supplier} · Código: {item?.code}</span><span className="block text-lg font-bold">Cantidad: {displayQuantity(line.quantity)}</span></li> })}</ul><p>Al confirmar, el remito quedará guardado y se actualizará el stock.</p><div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={noteSaving} onClick={saveNote}>{noteSaving ? 'Guardando…' : `Confirmar ${kind === 'entry' ? 'entrada' : 'salida'}`}</button><button type="button" className={secondaryButton} disabled={noteSaving} onClick={() => setNoteReview(false)}>Volver a editar</button></div></section>}
          {printNote && <section className={panel}><div className="no-print mb-4"><button className={button} onClick={() => window.print()}>Imprimir remito</button></div><h2 className="text-xl font-bold">Lobeto Tambos · Remito interno #{printNote.id}</h2><p>Comprobante interno sin validez fiscal</p><p>{printNote.kind === 'entry' ? 'Entrada' : 'Salida'} · {new Date(printNote.created_at).toLocaleString('es-AR')}</p><p>{printNote.supplier && `Proveedor: ${printNote.supplier} · `}{printNote.counterpart}</p><table className="mt-4 w-full text-left text-sm"><thead><tr><th>Artículo</th><th>Código proveedor</th><th>Código LT</th><th>Marca</th><th>Proveedor</th><th>Cantidad</th></tr></thead><tbody>{printNote.lines?.map((line, i) => <tr className="border-t" key={i}><td>{line.name}</td><td>{line.supplier_code}</td><td>{line.own_code || '—'}</td><td>{line.brand}</td><td>{line.supplier}</td><td>{line.quantity}</td></tr>)}</tbody></table></section>}
          <section className={`${panel} no-print`}><h2 className="mb-3 font-bold">Últimos remitos</h2>{data.notes.map((note) => <div className="flex gap-4 border-t py-2" key={note.id}><span>#{note.id} · {note.kind === 'entry' ? 'Entrada' : 'Salida'} · {new Date(note.created_at).toLocaleString('es-AR')}</span><button className="text-lobeto-navy underline" onClick={() => run(async () => setPrintNote(await api<Note>(`/notes/${note.id}`)))}>Ver / imprimir</button></div>)}</section>
        </div>}
        </fieldset>
      </main>
    </div>
  )
}

function ProductEditor({ product, categories, save }: { product: Product; categories: Category[]; save: (values: { name: string; brand: string; own_code: string; category_id: string }) => void }) {
  const [name, setName] = useState(product.name)
  const [brand, setBrand] = useState(product.brand)
  const [category, setCategory] = useState(product.category_id ? String(product.category_id) : '')
  return <form className="flex flex-wrap gap-2 border-t pt-2" onSubmit={(e) => { e.preventDefault(); save({ name, brand, own_code: product.own_code || '', category_id: category }) }}><input aria-label="Nombre del producto" className={input} value={name} onChange={(e) => setName(e.target.value)} required /><input aria-label="Marca" className={input} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Marca" /><select aria-label="Rubro" className={input} value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Sin rubro</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className={button}>Guardar</button></form>
}

function ItemCodeEditor({ item, save }: { item: Item; save: (code: string) => void }) {
  const [code, setCode] = useState(item.own_code || '')
  useEffect(() => { setCode(item.own_code || '') }, [item.own_code])
  return <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); save(code) }}><input className={`${input} w-32`} aria-label={`Código LT para ${item.supplier} ${item.code}`} placeholder="Opcional" maxLength={250} value={code} onChange={(e) => setCode(e.target.value)} /><button className={button} disabled={code.trim() === (item.own_code || '')}>Guardar</button></form>
}
