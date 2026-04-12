import gsap from 'gsap'

export type BlurSlideSegment = {
  start: number
  end: number
  /** Hidden-state offset in px (positive = starts lower). */
  y?: number
  /** Blur in px at fully hidden. Use 0 for opacity/y only. */
  blurPx?: number
}

export function segment01(t: number, a: number, b: number): number {
  if (b <= a) return t >= b ? 1 : 0
  return gsap.utils.clamp(0, 1, (t - a) / (b - a))
}

export function applyBlurSlideState(element: HTMLElement, revealed01: number, options: { y: number; blurPx: number }) {
  const u = gsap.utils.clamp(0, 1, revealed01)
  const { y, blurPx } = options
  gsap.set(element, {
    y: y * (1 - u),
    opacity: u,
    filter: blurPx > 0 ? `blur(${blurPx * (1 - u)}px)` : 'none',
  })
}

export function applyBlurSlideFromGlobalProgress(
  element: HTMLElement,
  globalProgress: number,
  segment: BlurSlideSegment,
  defaults: { y: number; blurPx: number }
) {
  const y = segment.y ?? defaults.y
  const blurPx = segment.blurPx ?? defaults.blurPx
  const u = segment01(globalProgress, segment.start, segment.end)
  applyBlurSlideState(element, u, { y, blurPx })
}
