import { cn } from '@/utils/cn'
import type { TextareaHTMLAttributes } from 'react'
import { FormBottomAccent } from './FormBottomAccent'

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string
  label: string
}

const FormTextarea = ({ id, label, className, ...props }: FormTextareaProps) => {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="font-sf-pro text-[13px] leading-[130%] font-medium tracking-[2%] text-white uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <textarea
          id={id}
          className={cn(
            'peer font-sf-pro w-full resize-none border-0 bg-transparent py-3.5 text-[16px] leading-[130%] font-light tracking-[0%] text-white/29 focus:outline-none',
            className
          )}
          {...props}
        />
        <FormBottomAccent />
      </div>
    </div>
  )
}

export default FormTextarea
