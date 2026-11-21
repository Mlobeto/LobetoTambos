type SearchableItem = {
  id: number
  supplier_id: number
  supplier: string
  code: string
  name: string
  own_code: string | null
}

function normalize(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}

export function articleOptions<T extends SearchableItem>(items: T[], query: string, supplierId: string, selectedId: string) {
  const term = normalize(query)
  const available = items.filter((item) => !supplierId || String(item.supplier_id) === supplierId)
  const matches = available.filter((item) => [item.code, item.name, item.own_code || '', item.supplier].some((value) => normalize(value).includes(term)))
  const selected = available.find((item) => String(item.id) === selectedId)
  const options = selected && !matches.includes(selected) ? [selected, ...matches] : matches
  return { matches, options }
}
