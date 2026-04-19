'use client'

import BlurSlideReveal, { type BlurSlideRevealHandle } from '@/components/ui/BlurSlideReveal'
import { CopyWordsScrub, type CopyWordsScrubHandle } from '@/components/ui/Copy'
import { segment01 } from '@/lib/blur-slide'
import { cn } from '@/utils/cn'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Image from 'next/image'
import { useRef } from 'react'

const MOVE_START = 0
const MOVE_END = 0.42
const CENTER_HOLD_DURATION = 0.2
const DEVICE_SIZE_IMAGE_SRC = '/images/device-size-img-1.png'

const H2_WORDS_START = 0.08
const H2_WORDS_END = 0.38

const BLUR_FLEX_START = 0.26
const BLUR_FLEX_END = 0.58
const BLUR_CARD8_START = 0.44
const BLUR_CARD8_END = 0.78
const BLUR_CARD32_START = 0.62
const BLUR_CARD32_END = 0.96

const LEFT_BLUR_SEGMENTS = [
  { start: BLUR_FLEX_START, end: BLUR_FLEX_END, y: 36, blurPx: 14 },
  { start: BLUR_CARD8_START, end: BLUR_CARD8_END, y: 28, blurPx: 12 },
  { start: BLUR_CARD32_START, end: BLUR_CARD32_END, y: 28, blurPx: 12 },
] as const

const ConnectorLine = ({ staggered, className }: { staggered?: boolean; className?: string }) => (
  <div
    className={cn(
      'pointer-events-none absolute top-1/2 left-full z-10 hidden h-px w-[92px] -translate-y-1/2 lg:block xl:w-[220px]',
      className
    )}
  >
    <div className="absolute inset-0 bg-white/15" />
    <div
      className={cn(
        'connector-shimmer-mask animate-connector-shimmer absolute inset-0 bg-white',
        staggered && 'connector-shimmer-stagger'
      )}
    />
    <div
      className={cn(
        'connector-shimmer-mask animate-connector-shimmer absolute inset-0 bg-white',
        staggered ? 'connector-shimmer-stagger-echo' : 'connector-shimmer-echo'
      )}
    />
  </div>
)

const DeviceSize = () => {
  const rootRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const rightSlotRef = useRef<HTMLDivElement>(null)
  const videoShellRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const blurRevealRef = useRef<BlurSlideRevealHandle>(null)
  const wordsRef = useRef<CopyWordsScrubHandle>(null)

  const hasPlayedInViewRef = useRef(false)
  const isRunningSequenceRef = useRef(false)
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const pin = pinRef.current
      const slot = rightSlotRef.current
      const shell = videoShellRef.current
      const video = videoRef.current
      const image = imageRef.current

      if (!root || !pin || !slot || !shell || !video || !image) return

      const mm = gsap.matchMedia()
      let sequenceTl: gsap.core.Timeline | null = null
      let holdCall: gsap.core.Tween | null = null

      const resetContent = () => {
        wordsRef.current?.setProgress(0)
        blurRevealRef.current?.setProgress(0)

        gsap.set('.content-box-wrapper-size-matter', {
          opacity: 0,
          display: 'none',
          pointerEvents: 'none',
        })
      }

      const showContent = () => {
        gsap.set('.content-box-wrapper-size-matter', {
          opacity: 1,
          display: 'block',
          pointerEvents: 'auto',
        })
      }

      const buildMetrics = (isMobile: boolean) => {
        const pr = pin.getBoundingClientRect()
        const sr = slot.getBoundingClientRect()

        if (pr.width < 1 || pr.height < 1 || sr.width < 1 || sr.height < 1) return null

        const startW = Math.min(pr.width * 0.92, 1408)
        const startH = startW * (sr.height / Math.max(745, 1))

        const startLeft = (pr.width - startW) / 2
        const startTop = (pr.height - startH) / 2

        const targetW = 745
        const targetH = sr.height
        const targetLeft = sr.left - pr.left
        const targetTop = sr.top - pr.top

        const startCenterX = startLeft + startW / 2
        const startCenterY = startTop + startH / 2
        const targetCenterX = targetLeft + targetW / 2
        const targetCenterY = targetTop + targetH / 2

        return {
          startLeft,
          startTop,
          startW,
          startH,
          targetLeft,
          targetTop,
          targetW,
          targetH,
          deltaX: targetCenterX - startCenterX,
          deltaY: targetCenterY - startCenterY,
          scaleX: targetW / startW,
          scaleY: targetH / startH,
        }
      }

      const setupVariant = (isMobile: boolean) => {
        const metrics = buildMetrics(isMobile)
        if (!metrics) return

        resetContent()
        hasPlayedInViewRef.current = false
        isRunningSequenceRef.current = false

        video.pause()
        video.currentTime = 0
        video.playbackRate = 1
        video.preload = 'auto'
        video.load()

        gsap.set(video, {
          opacity: 1,
          autoAlpha: 1,
        })

        gsap.set(image, {
          autoAlpha: 0,
        })

        if (isMobile) {
          gsap.set(shell, {
            position: 'relative',
            left: 0,
            top: 0,
            width: '100%',
            height: 'auto',
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotate: 0,
            filter: 'blur(0px)',
            force3D: true,
            transformOrigin: '50% 50%',
            willChange: 'transform,opacity',
          })
        } else {
          gsap.set(shell, {
            position: 'absolute',
            left: metrics.startLeft,
            top: metrics.startTop,
            width: metrics.startW,
            height: metrics.startH,
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotate: 0,
            filter: 'blur(0px)',
            force3D: true,
            transformOrigin: '50% 50%',
            willChange: 'transform,opacity',
          })
        }

        const applyRevealProgress = (p: number) => {
          const next = gsap.utils.clamp(0, 1, p)
          wordsRef.current?.setProgress(next)
          blurRevealRef.current?.setProgress(next)
        }

        const runPostVideoAnimation = () => {
          if (isRunningSequenceRef.current) return
          isRunningSequenceRef.current = true

          video.pause()

          holdCall?.kill()
          sequenceTl?.kill()

          holdCall = gsap.delayedCall(CENTER_HOLD_DURATION, () => {
            if (isMobile) {
              sequenceTl = gsap.timeline({
                defaults: { ease: 'power3.out' },
              })

              sequenceTl.to(shell, {
                y: 0,
                scale: 0.98,
                duration: 0.7,
                force3D: true,
              })

              sequenceTl.to(
                video,
                {
                  autoAlpha: 0,
                  duration: 0.5,
                },
                0.08
              )

              sequenceTl.to(
                image,
                {
                  autoAlpha: 1,
                  duration: 0.65,
                },
                0.08
              )

              sequenceTl.to(
                '.content-box-wrapper-size-matter',
                {
                  opacity: 1,
                  display: 'block',
                  pointerEvents: 'auto',
                  duration: 0.45,
                },
                0.28
              )

              sequenceTl.to(
                { progress: 0 },
                {
                  progress: 1,
                  duration: 1.05,
                  ease: 'power3.out',
                  onUpdate() {
                    applyRevealProgress(this.targets()[0].progress)
                  },
                },
                0.3
              )
            } else {
              sequenceTl = gsap.timeline({
                defaults: { ease: 'power3.out' },
              })

              sequenceTl.to(shell, {
                x: metrics.deltaX,
                y: metrics.deltaY,
                scaleX: metrics.scaleX,
                scaleY: metrics.scaleY,
                duration: 0.92,
                ease: 'expo.inOut',
                force3D: true,
              })

              sequenceTl.to(
                shell,
                {
                  y: metrics.deltaY,
                  duration: 0.18,
                  ease: 'back.out(1.04)',
                  force3D: true,
                },
                0.92
              )

              sequenceTl.to(
                video,
                {
                  autoAlpha: 0,
                  duration: 0.5,
                },
                0.34
              )

              sequenceTl.to(
                image,
                {
                  autoAlpha: 1,
                  duration: 0.65,
                },
                0.34
              )

              sequenceTl.to(
                '.content-box-wrapper-size-matter',
                {
                  opacity: 1,
                  display: 'block',
                  pointerEvents: 'auto',
                  duration: 0.45,
                },
                0.46
              )

              sequenceTl.to(
                { progress: 0 },
                {
                  progress: 1,
                  duration: 1.15,
                  ease: 'power3.out',
                  onUpdate() {
                    applyRevealProgress(this.targets()[0].progress)
                  },
                },
                0.46
              )
            }
          })
        }

        const playSequence = () => {
          if (hasPlayedInViewRef.current) return
          hasPlayedInViewRef.current = true

          sequenceTl?.kill()
          holdCall?.kill()
          isRunningSequenceRef.current = false

          resetContent()

          gsap.set(video, { autoAlpha: 1 })
          gsap.set(image, { autoAlpha: 0 })

          if (!isMobile) {
            gsap.set(shell, {
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
              rotate: 0,
              filter: 'blur(0px)',
            })
          }

          const startPlayback = () => {
            video.play().catch(() => runPostVideoAnimation())
          }

          if (video.readyState >= 3) {
            startPlayback()
          } else {
            const onCanPlay = () => {
              video.removeEventListener('canplay', onCanPlay)
              startPlayback()
            }
            video.addEventListener('canplay', onCanPlay)
          }

          const onEnded = () => runPostVideoAnimation()
          video.addEventListener('ended', onEnded, { once: true })
        }

        intersectionObserverRef.current?.disconnect()

        intersectionObserverRef.current = new IntersectionObserver(
          (entries) => {
            const entry = entries[0]
            if (!entry) return

            if (entry.isIntersecting) {
              if (!hasPlayedInViewRef.current) {
                playSequence()
              } else {
                showContent()
                applyRevealProgress(1)
                gsap.set(video, { autoAlpha: 0 })
                gsap.set(image, { autoAlpha: 1 })
              }
            }
          },
          {
            rootMargin: '0px 0px -25% 0px',
            threshold: 0.12,
          }
        )

        intersectionObserverRef.current.observe(root)

        const onResize = () => {
          const nextMetrics = buildMetrics(isMobile)
          if (!nextMetrics || isMobile) return

          if (hasPlayedInViewRef.current) {
            gsap.set(shell, {
              left: nextMetrics.startLeft,
              top: nextMetrics.startTop,
              width: nextMetrics.startW,
              height: nextMetrics.startH,
              x: nextMetrics.deltaX,
              y: nextMetrics.deltaY,
              scaleX: nextMetrics.scaleX,
              scaleY: nextMetrics.scaleY,
            })
          } else {
            gsap.set(shell, {
              left: nextMetrics.startLeft,
              top: nextMetrics.startTop,
              width: nextMetrics.startW,
              height: nextMetrics.startH,
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
            })
          }
        }

        window.addEventListener('resize', onResize)

        return () => {
          window.removeEventListener('resize', onResize)
          intersectionObserverRef.current?.disconnect()
          sequenceTl?.kill()
          holdCall?.kill()
          video.pause()
        }
      }

      mm.add('(max-width: 991px)', () => setupVariant(true))
      mm.add('(min-width: 992px)', () => setupVariant(false))

      return () => {
        mm.revert()
        intersectionObserverRef.current?.disconnect()
        sequenceTl?.kill()
        holdCall?.kill()
        video.pause()
      }
    },
    { scope: rootRef }
  )

  return (
    <section ref={rootRef} className="relative">
      <div ref={pinRef} className="wrapper relative flex min-h-svh flex-col-reverse justify-center py-10">
        <div>
          <div className="content-box-wrapper-size-matter relative z-10 order-2 mb-4 hidden opacity-0 sm:mb-6 lg:order-1 lg:mb-0 xl:mb-[43px]">
            <CopyWordsScrub ref={wordsRef} segment={{ start: H2_WORDS_START, end: H2_WORDS_END }}>
              <h2 className="font-sf-pro text-[28px] leading-[128%] font-medium tracking-[-2%] text-white sm:text-[48px] xl:text-[72px]">
                Because size matters
              </h2>
            </CopyWordsScrub>
          </div>

          <div className="content-box-wrapper-size-matter contents hidden opacity-0 lg:relative lg:order-2 lg:grid lg:grid-cols-[350px_1fr] lg:items-center xl:grid-cols-[428px_1fr] xl:gap-20">
            <BlurSlideReveal
              ref={blurRevealRef}
              mode="controlled"
              segments={[...LEFT_BLUR_SEGMENTS]}
              y={36}
              blurPx={12}
              className="relative z-10 order-3 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-1.5 lg:order-1 lg:grid-cols-1 lg:gap-4"
            >
              <p className="font-sf-pro mb-4 text-[20px] leading-[140%] font-medium tracking-[-0.5px] text-white will-change-[transform,opacity,filter] sm:col-span-2 sm:text-[32px] lg:col-span-1 lg:mb-0 xl:mb-6">
                Flexibility for your needs
              </p>

              <div className="relative rounded-[8px] bg-[linear-gradient(112.82deg,#3C98EE_-5.87%,#0D3459_7.76%)] p-px will-change-[transform,opacity,filter]">
                <div className="h-full rounded-[8px] bg-black p-px">
                  <div className="h-full bg-white/8 p-6">
                    <h3 className="text-size-primary mb-[11px] text-[36px] leading-[128%] font-normal tracking-[-2%]">
                      8
                    </h3>
                    <p className="font-sf-pro text-[18px] leading-[140%] tracking-[-0.5px] text-white">
                      Lorem ipsum in nunc pulvinar pellentesque vel semper aenean sed id pharetra ultrices felis lectus
                      eget felis feugiat nibh vestibulum mi at diam dolor
                    </p>
                  </div>
                </div>

                <ConnectorLine className="desktop:w-[220px] top-[200px] xl:top-1/2 xl:w-[138px]" />
              </div>

              <div className="relative rounded-[8px] bg-[linear-gradient(112.82deg,#3C98EE_-5.87%,#0D3459_7.76%)] p-px will-change-[transform,opacity,filter]">
                <div className="h-full rounded-[8px] bg-black p-px">
                  <div className="h-full bg-white/8 p-6">
                    <h3 className="text-size-primary mb-[11px] text-[64px] leading-[128%] font-normal tracking-[-2%]">
                      32
                    </h3>
                    <p className="font-sf-pro text-[18px] leading-[140%] tracking-[-0.5px] text-white">
                      Lorem ipsum in nunc pulvinar pellentesque vel semper aenean sed id pharetra ultrices felis lectus
                      eget felis feugiat nibh vestibulum mi at diam dolor
                    </p>
                  </div>
                </div>

                <ConnectorLine staggered className="top-[50px] xl:top-1/2 xl:w-[290px]" />
              </div>
            </BlurSlideReveal>

            <div className="relative order-1 mb-6 hidden justify-center lg:order-2 lg:mt-14 lg:mb-0 lg:flex lg:justify-end xl:mt-0">
              <div
                ref={rightSlotRef}
                className="h-[260px] w-full max-w-[330px] sm:h-[350px] sm:max-w-[600px] xl:h-[415px] xl:max-w-[845px]"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <div
          ref={videoShellRef}
          className="pointer-events-none relative order-1 mx-auto mb-6 w-full overflow-hidden rounded-sm will-change-transform lg:absolute lg:left-0 lg:top-0"
          aria-hidden
        >
          <video
            ref={videoRef}
            className="block h-full w-full object-contain"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            poster="./videos/size-video.jpg"
          >
            <source src="./videos/size-video-1-mobo.mp4" media="(max-width: 990px)" type="video/mp4" />
            <source src="./videos/size-video.webm" media="(min-width: 991px)" type="video/webm" />
          </video>

          <div ref={imageRef} className="absolute inset-0 md:top-10">
            <Image
              src={DEVICE_SIZE_IMAGE_SRC}
              alt=""
              fill
              className="h-full w-full max-w-[845px] object-cover"
              sizes="(min-width: 1280px) 845px, 78vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default DeviceSize