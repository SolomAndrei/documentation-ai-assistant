import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-indigo-400 text-slate-950 hover:bg-indigo-300 disabled:hover:bg-indigo-400',
  secondary: 'bg-white/10 text-slate-100 hover:bg-white/15 disabled:hover:bg-white/10',
  danger: 'bg-red-500/15 text-red-200 hover:bg-red-500/25 disabled:hover:bg-red-500/15',
  ghost: 'bg-transparent text-slate-300 hover:bg-white/10 disabled:hover:bg-transparent'
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={`rounded-xl px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
