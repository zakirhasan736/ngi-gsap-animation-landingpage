'use client'

import { NAV_ITEMS } from '@/constants'
import { Logo } from '@/icons'
import { useHeaderVariantFromScroll } from '@/providers/HeaderVariantProvider'
import { usePreloaderGate } from '@/providers/PreloaderGateContext'
import { cn } from '@/utils/cn'
import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'

const easeNav = 'cubic-bezier(0.22, 1, 0.36, 1)'
const transitionNavSurface = `border-color 0.65s ${easeNav}, background-color 0.65s ${easeNav}, box-shadow 0.65s ${easeNav}`
const SECTION_NAV_IDS = ['intro', 'technology', 'about', 'waitlist'] as const

type PillMetrics = { left: number; top: number; width: number; height: number; opacity: number }

const navLinkClass = (isActive: boolean, variant: 'light' | 'dark') =>
  cn(
    'relative z-10 block rounded-full px-3.5 py-[5px] text-[16px] leading-none',
    'transition-[color,font-weight] duration-650 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    isActive ? 'font-medium' : 'font-normal',
    variant === 'light' ? 'text-nav-accent' : 'text-white'
  )

const mobileNavLinkClass = (isActive: boolean, variant: 'light' | 'dark') =>
  cn(
    'block w-full rounded-full px-3.5 py-3 text-left text-[20px] leading-none',
    'transition-[color,font-weight] duration-650 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    isActive ? 'font-medium' : 'font-normal',
    variant === 'light' ? 'text-nav-accent' : 'text-white'
  )

const hashFromHref = (href: string) => {
  if (href.startsWith('/#')) return href.slice(2)
  if (href.startsWith('#')) return href.slice(1)
  return null
}

type Ripple = { id: number; x: number; y: number }

function MenuToggleButton({
  menuOpen,
  variant,
  onClick,
}: {
  menuOpen: boolean
  variant: 'light' | 'dark'
  onClick: () => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])

  const spawnRipple = useCallback((clientX: number, clientY: number) => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const id = performance.now()
    setRipples((curr) => [...curr, { id, x: clientX - r.left, y: clientY - r.top }])
    window.setTimeout(() => {
      setRipples((curr) => curr.filter((x) => x.id !== id))
    }, 760)
  }, [])

  return (
    <button
      ref={btnRef}
      type="button"
      className={cn(
        'relative isolate z-50 inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[0.5px] md:hidden',
        'transition-[border-color,background-color,color,box-shadow] duration-650 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
        variant === 'light'
          ? 'border-nav-accent-light bg-nav-surface-light text-nav-accent'
          : 'border-nav-accent bg-nav-surface text-white'
      )}
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={menuOpen}
      aria-controls="mobile-nav"
      onPointerDown={(e) => {
        if (e.button !== 0) return
        spawnRipple(e.clientX, e.clientY)
      }}
      onClick={onClick}
    >
      {ripples.map((rip) => (
        <span
          key={rip.id}
          className={cn(
            'header-water-ripple-ring pointer-events-none absolute rounded-full mix-blend-overlay',
            variant === 'light' ? 'bg-nav-accent/25' : 'bg-white/35'
          )}
          style={{
            left: rip.x,
            top: rip.y,
            width: 'min(280px, 220%)',
            height: 'min(280px, 220%)',
          }}
          aria-hidden
        />
      ))}
      <span className="relative z-10 inline-flex flex-col gap-1.5" aria-hidden>
        {[0, 1, 2].map((line) => (
          <span
            key={line}
            className={cn(
              'block h-[1.5px] w-5 origin-center rounded-full transition-all duration-300 ease-out',
              variant === 'light' ? 'bg-nav-accent' : 'bg-white',
              menuOpen && line === 0 && 'translate-y-[8px] rotate-45',
              menuOpen && line === 1 && 'opacity-0',
              menuOpen && line === 2 && '-translate-y-[8px] -rotate-45'
            )}
          />
        ))}
      </span>
    </button>
  )
}

const Header = () => {
  const variant = useHeaderVariantFromScroll()
  const { isPreloaderActive } = usePreloaderGate()
  const [activeSection, setActiveSection] = useState<(typeof SECTION_NAV_IDS)[number]>('intro')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobilePanelVisible, setMobilePanelVisible] = useState(false)
  const [mobilePanelExiting, setMobilePanelExiting] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const mobilePanelCloseTimerRef = useRef<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [pill, setPill] = useState<PillMetrics>({ left: 0, top: 0, width: 0, height: 0, opacity: 0 })

  const activeIndex = NAV_ITEMS.findIndex((item) => hashFromHref(item.href) === activeSection)

  const displayIndex = hoveredIndex !== null ? hoveredIndex : activeIndex >= 0 ? activeIndex : null

  const syncPill = useCallback(() => {
    const ul = listRef.current
    const idx = displayIndex
    if (idx === null || idx < 0) {
      setPill((p) => ({ ...p, opacity: 0 }))
      return
    }
    const li = itemRefs.current[idx]
    if (!ul || !li) {
      setPill((p) => ({ ...p, opacity: 0 }))
      return
    }
    const ulRect = ul.getBoundingClientRect()
    const liRect = li.getBoundingClientRect()
    setPill({
      left: liRect.left - ulRect.left + ul.scrollLeft,
      top: liRect.top - ulRect.top + ul.scrollTop,
      width: liRect.width,
      height: liRect.height,
      opacity: 1,
    })
  }, [displayIndex])

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      syncPill()
    })
    return () => cancelAnimationFrame(frame)
  }, [syncPill, variant, menuOpen])

  useEffect(() => {
    window.addEventListener('resize', syncPill, { passive: true })
    return () => window.removeEventListener('resize', syncPill)
  }, [syncPill])

  useEffect(() => {
    const sectionIds = new Set<string>(SECTION_NAV_IDS)

    const updateActiveSection = () => {
      const marker = window.scrollY + window.innerHeight * 0.35
      let nextSection: (typeof SECTION_NAV_IDS)[number] = SECTION_NAV_IDS[0]

      for (const sectionId of SECTION_NAV_IDS) {
        const el = document.getElementById(sectionId)
        if (!el) continue
        const top = el.getBoundingClientRect().top + window.scrollY
        if (top <= marker) nextSection = sectionId
      }

      setActiveSection((curr) => (curr === nextSection ? curr : nextSection))
    }

    const updateFromHash = () => {
      const currentHash = window.location.hash.replace(/^#/, '')
      if (sectionIds.has(currentHash)) {
        setActiveSection(currentHash as (typeof SECTION_NAV_IDS)[number])
      } else {
        updateActiveSection()
      }
    }

    updateFromHash()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    window.addEventListener('hashchange', updateFromHash)
    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
      window.removeEventListener('hashchange', updateFromHash)
    }
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMenuOpen(false)
    setMobilePanelExiting(true)
    if (mobilePanelCloseTimerRef.current !== null) {
      clearTimeout(mobilePanelCloseTimerRef.current)
    }
    mobilePanelCloseTimerRef.current = window.setTimeout(() => {
      setMobilePanelVisible(false)
      setMobilePanelExiting(false)
      mobilePanelCloseTimerRef.current = null
    }, 700)
  }, [])

  const openMobileMenu = useCallback(() => {
    if (mobilePanelCloseTimerRef.current !== null) {
      clearTimeout(mobilePanelCloseTimerRef.current)
      mobilePanelCloseTimerRef.current = null
    }
    setMobilePanelVisible(true)
    setMobilePanelExiting(false)
    setMenuOpen(true)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    if (menuOpen) {
      closeMobileMenu()
      return
    }
    openMobileMenu()
  }, [closeMobileMenu, menuOpen, openMobileMenu])

  useEffect(
    () => () => {
      if (mobilePanelCloseTimerRef.current !== null) {
        clearTimeout(mobilePanelCloseTimerRef.current)
      }
    },
    []
  )

  useEffect(() => {
    if (!menuOpen) return

    const closeIfOutside = (event: MouseEvent | TouchEvent) => {
      const el = navRef.current
      if (el && !el.contains(event.target as Node)) {
        closeMobileMenu()
      }
    }

    document.addEventListener('mousedown', closeIfOutside)
    document.addEventListener('touchstart', closeIfOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', closeIfOutside)
      document.removeEventListener('touchstart', closeIfOutside)
    }
  }, [closeMobileMenu, menuOpen])

  const handleNavClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
      const hash = hashFromHref(href)
      if (!hash || !SECTION_NAV_IDS.includes(hash as (typeof SECTION_NAV_IDS)[number])) return

      const target = document.getElementById(hash)
      if (!target) return

      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `/#${hash}`)
      setActiveSection(hash as (typeof SECTION_NAV_IDS)[number])
      if (menuOpen) closeMobileMenu()
    },
    [closeMobileMenu, menuOpen]
  )

  return (
    <header
      className={cn(
        'wrapper fixed top-0 right-0 left-0 z-50 py-6',
        'ease-out will-change-[opacity,transform]',
        isPreloaderActive
          ? 'pointer-events-none translate-y-[-10px] opacity-0 transition-[opacity,transform] duration-200'
          : 'translate-y-0 opacity-100 transition-[opacity,transform] delay-150 duration-650'
      )}
      aria-hidden={isPreloaderActive}
    >
      <nav ref={navRef} className="relative flex w-full items-center justify-between" aria-label="Main">
        <span
          className={cn(
            'inline-flex shrink-0 transition-colors duration-650 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
            variant === 'light' ? 'text-[#021D36]' : 'text-white'
          )}
        >
          <Logo className="h-[31px] w-[35px]" />
        </span>

        <MenuToggleButton menuOpen={menuOpen} variant={variant} onClick={toggleMobileMenu} />

        <ul
          ref={listRef}
          className={cn(
            'relative hidden items-center rounded-full border-[0.5px] pt-1 pr-3 pb-[6px] pl-2.5 md:flex',
            variant === 'light' ? 'border-nav-accent-light bg-nav-surface-light' : 'border-nav-accent bg-nav-surface'
          )}
          style={{ transition: transitionNavSurface }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute z-0 rounded-full backdrop-blur-xl backdrop-saturate-150',
              'transition-[left,top,width,height,opacity] duration-550 ease-[cubic-bezier(0.22,1,0.36,1)]',
              variant === 'light'
                ? 'border border-white/70 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_28px_rgba(2,29,54,0.07)]'
                : 'border border-white/20 bg-white/11 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_28px_rgba(133,196,255,0.06)]'
            )}
            style={{
              left: pill.left,
              top: pill.top,
              width: pill.width,
              height: pill.height,
              opacity: pill.opacity,
            }}
          >
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <span
                className={cn(
                  'header-nav-glass-sheen absolute h-full w-[180%] translate-x-[-18%] bg-linear-to-r from-transparent via-white/50 to-transparent opacity-50',
                  variant === 'light' && 'via-hero-accent/35'
                )}
              />
            </span>
          </span>

          {NAV_ITEMS.map((item, i) => (
            <li
              key={item.href}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className="relative z-10"
              onMouseEnter={() => setHoveredIndex(i)}
            >
              <Link
                href={item.href}
                className={cn(navLinkClass(i === activeIndex, variant), 'inline-block')}
                onClick={(event) => handleNavClick(event, item.href)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {mobilePanelVisible ? (
          <div
            id="mobile-nav"
            className={cn(
              'fixed inset-0 z-40 flex min-h-screen justify-end md:hidden',
              mobilePanelExiting ? 'header-mobile-panel-exit' : 'header-mobile-panel-enter',
              variant === 'light' ? 'bg-[#021D36]/35' : 'bg-[#021D36]/45'
            )}
            style={{ transition: 'background-color 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeMobileMenu()
            }}
          >
            <div
              className={cn(
                'h-full w-full max-w-sm border-[0.5px] border-l p-6 pt-24',
                variant === 'light'
                  ? 'border-nav-accent-light bg-nav-surface-light'
                  : 'border-nav-accent bg-nav-surface'
              )}
            >
              <ul className="flex flex-col gap-2">
                {NAV_ITEMS.map((item, i) => (
                  <li
                    key={item.href}
                    className={cn(mobilePanelExiting ? 'header-mobile-nav-item-exit' : 'header-mobile-nav-item-enter')}
                    style={
                      {
                        animationDelay: mobilePanelExiting
                          ? `${(NAV_ITEMS.length - 1 - i) * 38}ms`
                          : `calc(0.28s + ${i} * 45ms)`,
                      } as CSSProperties
                    }
                  >
                    <Link
                      href={item.href}
                      className={mobileNavLinkClass(i === activeIndex, variant)}
                      onClick={(event) => handleNavClick(event, item.href)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  )
}

export default Header
