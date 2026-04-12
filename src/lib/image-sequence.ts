/** Build URLs for numbered JPEG/PNG frames (e.g. ezgif-frame-001.jpg …). */
export function buildNumberedFrameUrls(
  basePath: string,
  count: number,
  options?: { prefix?: string; pad?: number; extension?: string }
): string[] {
  const prefix = options?.prefix ?? 'frame-'
  const pad = options?.pad ?? 3
  const ext = options?.extension ?? 'jpg'
  const normalizedBase = basePath.replace(/\/$/, '')
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(pad, '0')
    return `${normalizedBase}/${prefix}${n}.${ext}`
  })
}

export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  displayW: number,
  displayH: number
) {
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!nw || !nh) return

  const ir = nw / nh
  const cr = displayW / displayH
  let dw: number
  let dh: number
  let ox: number
  let oy: number

  if (ir > cr) {
    dh = displayH
    dw = displayH * ir
    ox = (displayW - dw) / 2
    oy = 0
  } else {
    dw = displayW
    dh = displayW / ir
    ox = 0
    oy = (displayH - dh) / 2
  }

  ctx.clearRect(0, 0, displayW, displayH)
  ctx.drawImage(img, ox, oy, dw, dh)
}
