/** Small ZIP writer for exporting a handful of raw messages without another runtime dependency. */
export function zipStoredFiles(files: { name: string; bytes: Uint8Array }[]): Blob {
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  const encoder = new TextEncoder()
  let offset = 0
  for (const file of files) {
    const name = encoder.encode(file.name)
    const size = file.bytes.byteLength
    if (name.byteLength > 65535 || size > 0xffffffff || offset + size > 0xffffffff) throw new Error("Export is too large for ZIP format.")
    const crc = crc32(file.bytes)
    const local = new Uint8Array(30 + name.byteLength)
    const localView = new DataView(local.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0x0800, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, size, true)
    localView.setUint32(22, size, true)
    localView.setUint16(26, name.byteLength, true)
    local.set(name, 30)
    parts.push(local, file.bytes)
    const record = new Uint8Array(46 + name.byteLength)
    const view = new DataView(record.buffer)
    view.setUint32(0, 0x02014b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 20, true)
    view.setUint16(8, 0x0800, true)
    view.setUint32(16, crc, true)
    view.setUint32(20, size, true)
    view.setUint32(24, size, true)
    view.setUint16(28, name.byteLength, true)
    view.setUint32(42, offset, true)
    record.set(name, 46)
    central.push(record)
    offset += local.byteLength + size
  }
  const centralSize = central.reduce((sum, item) => sum + item.byteLength, 0)
  const end = new Uint8Array(22)
  const view = new DataView(end.buffer)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, files.length, true)
  view.setUint16(10, files.length, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, offset, true)
  return new Blob([...parts, ...central, end].map(part => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer), { type: "application/zip" })
}

function crc32(bytes: Uint8Array): number {
  let crc = -1
  for (const byte of bytes) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ -1) >>> 0
}
