'use client'

import BlurSlideReveal from '@/components/ui/BlurSlideReveal'
import { cn } from '@/utils/cn'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import FormInput from './ui/FormInput'
import FormTextarea from './ui/FormTextarea'

gsap.registerPlugin(ScrollTrigger)

const PreOrderContact = () => {
  const formRef = useRef<HTMLFormElement>(null)

  useGSAP(
    () => {
      const form = formRef.current
      if (!form) return

      const rows = gsap.utils.toArray<HTMLElement>(form.querySelectorAll('[data-form-reveal]'))
      if (rows.length === 0) return

      gsap.set(form, { opacity: 0, y: 36 })
      gsap.set(rows, { opacity: 0, y: 22 })

      const tl = gsap.timeline({ paused: true })
      tl.to(form, {
        opacity: 1,
        y: 0,
        duration: 0.72,
        ease: 'power2.out',
      })
      tl.to(
        rows,
        {
          opacity: 1,
          y: 0,
          duration: 0.52,
          stagger: 0.11,
          ease: 'power2.out',
        },
        '-=0.38'
      )

      const st = ScrollTrigger.create({
        trigger: form,
        start: 'top 82%',
        once: true,
        animation: tl,
        invalidateOnRefresh: true,
      })

      return () => {
        st.kill()
      }
    },
    { scope: formRef }
  )

  return (
    <section
      id="waitlist"
      className="wrapper flex min-h-svh scroll-mt-24 flex-col items-center justify-center gap-8 pt-[20px] sm:pt-[28px]"
    >
      <BlurSlideReveal className="flex w-full justify-center">
        <h2 className="font-sf-pro text-center text-[32px] leading-[128%] font-medium tracking-[-2%] text-white sm:text-[40px] md:text-[56px] xl:text-[72px]">
          Preorder & Contact
        </h2>
      </BlurSlideReveal>

      <form
        ref={formRef}
        className="border-form-border w-full max-w-[685px] space-y-6 rounded-xl border bg-white/7 p-5 sm:p-8"
      >
        <div className="flex flex-col gap-4">
          <div data-form-reveal="">
            <FormInput id="name" name="name" label="Name" placeholder="Enter your name" />
          </div>
          <div data-form-reveal="">
            <FormInput id="email" name="email" label="Email" type="email" placeholder="Enter your email address" />
          </div>
          <div data-form-reveal="">
            <FormInput id="phone" name="phone" label="Phone Number" type="tel" placeholder="Enter your phone number" />
          </div>
          <div data-form-reveal="">
            <FormTextarea
              id="message"
              name="message"
              label="Message"
              placeholder="Start typing your message..."
              className="h-[110px]"
            />
          </div>
        </div>

        <div data-form-reveal="" className="flex justify-center">
          <button
            type="submit"
            className={cn(
              'font-sf-pro bg-preorder-submit rounded-sm px-6 py-2.5 text-center text-[16px] font-medium text-white sm:py-3.5',
              'transform-[translateZ(0)] transition-[border-radius] duration-450 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:rounded-full',
              'motion-reduce:transition-none motion-reduce:hover:rounded-sm',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35'
            )}
          >
            Submit
          </button>
        </div>
      </form>
    </section>
  )
}

export default PreOrderContact
