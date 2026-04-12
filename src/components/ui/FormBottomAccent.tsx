import { cn } from '@/utils/cn'

/** Base rule + white focus line; L→R draw matches preorder submit hover. Input/textarea must use `peer` and sit before this in DOM. */
export function FormBottomAccent() {
  return (
    <>
      <span aria-hidden className="bg-input-border pointer-events-none absolute inset-x-0 bottom-0 h-px" />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-white',
          'transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] peer-focus:scale-x-100',
          'motion-reduce:transition-none motion-reduce:peer-focus:scale-x-100'
        )}
      />
    </>
  )
}
