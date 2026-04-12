import { cn } from '@/utils/cn'

const ARROW_PATH = 'M0 0H14.6571V12M14.6571 12L10.3143 7.4286M14.6571 12L19 7.4286'

const variantStyles = {
  dark: {
    base: 'text-white/20',
    streak: 'text-white',
  },
  light: {
    base: 'text-scroll-down-light/30',
    streak: 'text-scroll-down-light',
  },
}

const Arrow = ({ className }: { className?: string }) => (
  <svg
    width="19"
    height="12"
    viewBox="0 0 19 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('shrink-0', className)}
  >
    <path d={ARROW_PATH} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

interface ScrollDownProps {
  className?: string
  label?: string
  variant?: keyof typeof variantStyles
}

const ScrollDown = ({ className, label = 'Scroll down', variant = 'dark' }: ScrollDownProps) => {
  const { base, streak } = variantStyles[variant]

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative inline-flex items-center gap-3 select-none">
        {/* dim base layer — always visible at rest */}
        <span className={cn('text-[14px] font-light', base)}>{label}</span>
        <Arrow className={base} />

        {/* streak 1 — leads */}
        <div className={cn('shimmer-mask animate-shimmer absolute inset-0 flex items-center gap-3', streak)}>
          <span className="text-[14px] font-light">{label}</span>
          <Arrow />
        </div>

        {/* streak 2 — 0.4 s behind streak 1 */}
        <div
          className={cn(
            'shimmer-mask animate-shimmer absolute inset-0 flex items-center gap-3 [animation-delay:0.4s]',
            streak
          )}
        >
          <span className="text-[14px] font-light">{label}</span>
          <Arrow />
        </div>

        {/* streak 3 — 0.8 s behind streak 1 */}
        <div
          className={cn(
            'shimmer-mask animate-shimmer absolute inset-0 flex items-center gap-3 [animation-delay:0.8s]',
            streak
          )}
        >
          <span className="text-[14px] font-light">{label}</span>
          <Arrow />
        </div>
      </div>
    </div>
  )
}

export default ScrollDown
