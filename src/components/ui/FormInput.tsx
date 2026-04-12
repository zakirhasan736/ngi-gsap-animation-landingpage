import { cn } from '@/utils/cn'
import type { InputHTMLAttributes } from 'react'
import { FormBottomAccent } from './FormBottomAccent'

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
}

const FormInput = ({ id, label, className, ...props }: FormInputProps) => {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="font-sf-pro text-[13px] leading-[130%] font-medium tracking-[2%] text-white uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={cn(
            'peer font-sf-pro w-full border-0 bg-transparent py-3.5 text-[16px] leading-[130%] font-light tracking-[0%] text-white/29 focus:outline-none',
            className
          )}
          {...props}
        />
        <FormBottomAccent />
      </div>
    </div>
  )
}

export default FormInput
