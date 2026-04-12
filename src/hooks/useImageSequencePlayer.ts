'use client'

import { drawImageCover } from '@/lib/image-sequence'
import { useCallback, useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react'

type Options = {
  windowRadius?: number
  maxCache?: number
  /**
   * When set, backing-store size uses this CSS pixel size (× dpr) instead of the canvas
   * element’s layout box. Use while the visible wrapper is animated with changing width/height
   * so the bitmap is not cleared every frame (avoids flicker).
   */
  layoutSizeCssRef?: MutableRefObject<{ w: number; h: number } | null>
}

/**
 * Canvas image sequence with on-demand decode, neighbor prefetch, and LRU cache.
 */
export function useImageSequencePlayer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  frameSrcs: readonly string[],
  options?: Options
) {
  const windowRadius = options?.windowRadius ?? 12
  const maxCache = options?.maxCache ?? 56
  const optionsRef = useRef(options)
  useLayoutEffect(() => {
    optionsRef.current = options
  }, [options])

  const cacheRef = useRef(new Map<number, HTMLImageElement>())
  const lruRef = useRef<number[]>([])
  const targetIndexRef = useRef(0)

  const bumpLru = useCallback(
    (index: number) => {
      const lru = lruRef.current
      const i = lru.indexOf(index)
      if (i >= 0) lru.splice(i, 1)
      lru.push(index)
      while (lru.length > maxCache) {
        const idx = lru.findIndex((k) => k !== targetIndexRef.current)
        if (idx === -1) break
        const [removed] = lru.splice(idx, 1)
        cacheRef.current.delete(removed)
      }
    },
    [maxCache]
  )

  const ensureLoaded = useCallback(
    (index: number, onReady: (img: HTMLImageElement) => void) => {
      const n = frameSrcs.length
      if (index < 0 || index >= n) return

      const hit = cacheRef.current.get(index)
      if (hit?.complete && hit.naturalWidth) {
        bumpLru(index)
        onReady(hit)
        return
      }
      if (hit) {
        const onLoad = () => {
          bumpLru(index)
          onReady(hit)
        }
        if (hit.complete) onLoad()
        else hit.addEventListener('load', onLoad, { once: true })
        return
      }

      const img = new Image()
      img.decoding = 'async'
      img.src = frameSrcs[index]!
      cacheRef.current.set(index, img)
      img.onload = () => {
        bumpLru(index)
        onReady(img)
      }
    },
    [bumpLru, frameSrcs]
  )

  const prefetchAround = useCallback(
    (center: number) => {
      const n = frameSrcs.length
      const lo = Math.max(0, center - windowRadius)
      const hi = Math.min(n - 1, center + windowRadius)
      for (let i = lo; i <= hi; i++) {
        ensureLoaded(i, () => {})
      }
    },
    [ensureLoaded, frameSrcs.length, windowRadius]
  )

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const fixed = optionsRef.current?.layoutSizeCssRef?.current
    let cssW: number
    let cssH: number
    if (fixed && fixed.w > 0 && fixed.h > 0) {
      cssW = fixed.w
      cssH = fixed.h
    } else {
      const rect = canvas.getBoundingClientRect()
      cssW = Math.max(1, rect.width)
      cssH = Math.max(1, rect.height)
    }
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
    const nextW = Math.floor(cssW * dpr)
    const nextH = Math.floor(cssH * dpr)
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW
      canvas.height = nextH
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { ctx, cssW, cssH }
  }, [canvasRef])

  const drawFrame = useCallback(
    (rawIndex: number) => {
      const n = frameSrcs.length
      if (n === 0) return
      const index = Math.min(n - 1, Math.max(0, Math.floor(rawIndex)))
      targetIndexRef.current = index

      const layout = resizeCanvas()
      if (!layout) return
      const { ctx, cssW, cssH } = layout

      prefetchAround(index)

      ensureLoaded(index, (img) => {
        if (targetIndexRef.current !== index) return
        drawImageCover(ctx, img, cssW, cssH)
      })
    },
    [ensureLoaded, frameSrcs.length, prefetchAround, resizeCanvas]
  )

  useEffect(() => {
    cacheRef.current.clear()
    lruRef.current = []
    targetIndexRef.current = 0
  }, [frameSrcs])

  return { drawFrame, resizeCanvas }
}
