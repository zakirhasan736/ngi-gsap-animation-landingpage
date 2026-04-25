'use client'

import { drawImageCover } from '@/lib/image-sequence'
import { useCallback, useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react'

type Options = {
  windowRadius?: number
  maxCache?: number
  preloadAll?: boolean
  preloadConcurrency?: number
  maxDpr?: number
  /**
   * When set, backing-store size uses this CSS pixel size (x dpr) instead of the canvas
   * element's layout box. Use while the visible wrapper is animated with changing width/height
   * so the bitmap is not cleared every frame (avoids flicker).
   */
  layoutSizeCssRef?: MutableRefObject<{ w: number; h: number } | null>
}

/**
 * Canvas image sequence with async decode, neighbor prefetch, optional full preload, and LRU cache.
 */
export function useImageSequencePlayer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  frameSrcs: readonly string[],
  options?: Options
) {
  const windowRadius = options?.windowRadius ?? 12
  const maxCache = options?.maxCache ?? 56
  const preloadAll = options?.preloadAll ?? false
  const preloadConcurrency = Math.max(1, options?.preloadConcurrency ?? 4)
  const optionsRef = useRef(options)

  useLayoutEffect(() => {
    optionsRef.current = options
  }, [options])

  const cacheRef = useRef(new Map<number, HTMLImageElement>())
  const loadedIndexesRef = useRef(new Set<number>())
  const loadingRef = useRef(new Map<number, Promise<HTMLImageElement | null>>())
  const decodedRef = useRef(new WeakSet<HTMLImageElement>())
  const lruRef = useRef<number[]>([])
  const targetIndexRef = useRef(0)
  const lastDrawnLoadedIndexRef = useRef<number | null>(null)

  const bumpLru = useCallback(
    (index: number) => {
      const lru = lruRef.current
      const i = lru.indexOf(index)
      if (i >= 0) lru.splice(i, 1)
      lru.push(index)

      const cacheLimit = preloadAll ? Math.max(maxCache, frameSrcs.length) : maxCache
      while (lru.length > cacheLimit) {
        const idx = lru.findIndex((k) => k !== targetIndexRef.current)
        if (idx === -1) break
        const [removed] = lru.splice(idx, 1)
        if (removed === undefined) break
        cacheRef.current.delete(removed)
        loadedIndexesRef.current.delete(removed)
      }
    },
    [frameSrcs.length, maxCache, preloadAll]
  )

  const waitForImage = useCallback((img: HTMLImageElement) => {
    if (img.complete) return Promise.resolve(img.naturalWidth ? img : null)

    return new Promise<HTMLImageElement | null>((resolve) => {
      const cleanup = () => {
        img.removeEventListener('load', onLoad)
        img.removeEventListener('error', onError)
      }

      const onLoad = () => {
        cleanup()
        resolve(img.naturalWidth ? img : null)
      }

      const onError = () => {
        cleanup()
        resolve(null)
      }

      img.addEventListener('load', onLoad, { once: true })
      img.addEventListener('error', onError, { once: true })
    })
  }, [])

  const decodeImage = useCallback(async (img: HTMLImageElement) => {
    if (decodedRef.current.has(img)) return img

    try {
      await img.decode?.()
    } catch {
      // Safari can reject decode() for cached images even when drawImage can use them.
    }

    decodedRef.current.add(img)
    return img
  }, [])

  const loadFrame = useCallback(
    async (index: number) => {
      const n = frameSrcs.length
      if (index < 0 || index >= n) return null

      const hit = cacheRef.current.get(index)
      if (hit?.complete && hit.naturalWidth) {
        const decoded = await decodeImage(hit)
        loadedIndexesRef.current.add(index)
        bumpLru(index)
        return decoded
      }

      const inFlight = loadingRef.current.get(index)
      if (inFlight) return inFlight

      const img = hit ?? new Image()
      if (!hit) {
        img.decoding = 'async'
        img.loading = 'eager'
        img.src = frameSrcs[index]!
        cacheRef.current.set(index, img)
      }

      const promise = waitForImage(img)
        .then(async (loaded) => {
          if (!loaded) return null
          const decoded = await decodeImage(loaded)
          loadedIndexesRef.current.add(index)
          bumpLru(index)
          return decoded
        })
        .finally(() => {
          loadingRef.current.delete(index)
        })

      loadingRef.current.set(index, promise)
      return promise
    },
    [bumpLru, decodeImage, frameSrcs, waitForImage]
  )

  const ensureLoaded = useCallback(
    (index: number, onReady: (img: HTMLImageElement) => void) => {
      void loadFrame(index).then((img) => {
        if (img) onReady(img)
      })
    },
    [loadFrame]
  )

  const prefetchAround = useCallback(
    (center: number) => {
      const n = frameSrcs.length
      const lo = Math.max(0, center - windowRadius)
      const hi = Math.min(n - 1, center + windowRadius)

      ensureLoaded(center, () => {})

      for (let offset = 1; offset <= windowRadius; offset++) {
        const ahead = center + offset
        const behind = center - offset
        if (ahead <= hi) ensureLoaded(ahead, () => {})
        if (behind >= lo) ensureLoaded(behind, () => {})
      }
    },
    [ensureLoaded, frameSrcs.length, windowRadius]
  )

  const findClosestLoadedIndex = useCallback(
    (index: number) => {
      if (loadedIndexesRef.current.has(index)) return index

      const n = frameSrcs.length
      for (let offset = 1; offset < n; offset++) {
        const ahead = index + offset
        const behind = index - offset
        if (ahead < n && loadedIndexesRef.current.has(ahead)) return ahead
        if (behind >= 0 && loadedIndexesRef.current.has(behind)) return behind
      }

      return lastDrawnLoadedIndexRef.current
    },
    [frameSrcs.length]
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
    const dprLimit = optionsRef.current?.maxDpr ?? 2
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, dprLimit)
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
      const index = Math.min(n - 1, Math.max(0, Math.round(rawIndex)))
      targetIndexRef.current = index

      const layout = resizeCanvas()
      if (!layout) return
      const { ctx, cssW, cssH } = layout

      prefetchAround(index)

      const loadedIndex = findClosestLoadedIndex(index)
      const loadedImg = loadedIndex === null ? null : cacheRef.current.get(loadedIndex)
      if (loadedImg?.complete && loadedImg.naturalWidth) {
        lastDrawnLoadedIndexRef.current = loadedIndex
        drawImageCover(ctx, loadedImg, cssW, cssH)
      }

      ensureLoaded(index, () => {
        if (targetIndexRef.current !== index) return
        const current = cacheRef.current.get(index)
        const nextLayout = resizeCanvas()
        if (!current || !nextLayout) return
        lastDrawnLoadedIndexRef.current = index
        drawImageCover(nextLayout.ctx, current, nextLayout.cssW, nextLayout.cssH)
      })
    },
    [ensureLoaded, findClosestLoadedIndex, frameSrcs.length, prefetchAround, resizeCanvas]
  )

  useEffect(() => {
    cacheRef.current.clear()
    loadedIndexesRef.current.clear()
    loadingRef.current.clear()
    lruRef.current = []
    targetIndexRef.current = 0
    lastDrawnLoadedIndexRef.current = null
  }, [frameSrcs])

  useEffect(() => {
    if (!preloadAll || frameSrcs.length === 0) return

    let cancelled = false
    let cursor = 0
    const workerCount = Math.min(preloadConcurrency, frameSrcs.length)

    const waitForBreath = () =>
      new Promise<void>((resolve) => {
        if (cancelled || typeof window === 'undefined') {
          resolve()
          return
        }

        const requestIdle = window.requestIdleCallback
        if (typeof requestIdle === 'function') {
          requestIdle(() => resolve(), { timeout: 80 })
          return
        }

        globalThis.setTimeout(resolve, 0)
      })

    const runWorker = async () => {
      while (!cancelled) {
        const index = cursor
        cursor += 1
        if (index >= frameSrcs.length) return

        await loadFrame(index)
        await waitForBreath()
      }
    }

    void Promise.all(Array.from({ length: workerCount }, runWorker))

    return () => {
      cancelled = true
    }
  }, [frameSrcs.length, loadFrame, preloadAll, preloadConcurrency])

  return { drawFrame, resizeCanvas }
}
