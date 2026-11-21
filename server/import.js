import ExcelJS from 'exceljs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export async function readList(file) {
  const extension = file.originalname.toLowerCase().split('.').pop()
  if (extension === 'xlsx') {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(file.buffer)
    return workbook.worksheets.map((sheet) => ({
      name: sheet.name,
      rows: Array.from({ length: sheet.rowCount }, (_, index) => {
        const row = sheet.getRow(index + 1)
        return Array.from({ length: Math.min(sheet.columnCount, 30) }, (_, col) => row.getCell(col + 1).text.trim())
      }),
    }))
  }
  if (extension === 'pdf') {
    const loadingTask = getDocument({ data: new Uint8Array(file.buffer), useSystemFonts: true, isEvalSupported: false })
    const document = await loadingTask.promise
    try {
      const rows = []
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const content = await (await document.getPage(pageNumber)).getTextContent()
        const lines = new Map()
        for (const item of content.items) {
          if (!('str' in item) || !item.str.trim()) continue
          const y = Math.round(item.transform[5] * 2) / 2
          const line = lines.get(y) ?? []
          line.push({ x: item.transform[4], text: item.str })
          lines.set(y, line)
        }
        for (const line of lines.values()) {
          const text = line.sort((a, b) => a.x - b.x).map((part) => part.text).join(' ').replace(/\s+/g, ' ').trim()
          const match = text.match(/^([A-Za-z0-9][A-Za-z0-9.-]*)\s+(.+)$/)
          if (match) {
            const name = match[2].replace(/\s+\d{2}\/\d{2}\/\d{2,4}\s+[\d.,]+.*$/, '').replace(/\s+(?:[\d.,]+\s+){2}[\d.,]+\s*$/, '').trim()
            rows.push([match[1], name])
          } else rows.push(['', text])
        }
      }
      return [{ name: 'PDF', rows }]
    } finally {
      await loadingTask.destroy()
    }
  }
  throw new Error('Solo se admiten archivos .xlsx y .pdf.')
}
