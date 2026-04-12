import { cn } from '@/utils/cn'

const Diamond = ({ className }: { className?: string }) => {
  return <div className={cn('bg-hero-accent h-[6.5px] w-[6.5px] rotate-45 rounded-[1px]', className)}></div>
}

export default Diamond
