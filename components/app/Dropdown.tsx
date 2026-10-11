'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

// Filter / sort menu built on <details> (works before hydration). Closes when an option is picked
// or when clicking elsewhere -- <details> keeps its open state across client navigations otherwise.
export default function Dropdown({
  label,
  value,
  active = false,
  align = 'left',
  children,
}: {
  label: string
  value?: string
  active?: boolean
  align?: 'left' | 'right'
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (ref.current?.open && !ref.current.contains(event.target as Node)) ref.current.open = false
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  return (
    <details
      ref={ref}
      className="group relative"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a') && ref.current) ref.current.open = false
      }}
    >
      <summary
        className={`flex cursor-pointer list-none items-center gap-[7px] whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] [&::-webkit-details-marker]:hidden ${
          active ? 'border-foreground bg-sand font-semibold' : 'border-line text-ink-soft hover:border-muted-light'
        }`}
      >
        {label}
        {value && <span className={active ? 'font-normal text-foreground' : 'text-muted'}>{value}</span>}
        <span aria-hidden="true" className="text-[10px] text-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div
        className={`absolute top-full z-20 mt-2 min-w-44 rounded-[10px] border border-border bg-surface p-1.5 shadow-[0_16px_40px_-20px_rgba(30,27,22,0.35)] ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        {children}
      </div>
    </details>
  )
}

export function MenuLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={`flex items-center justify-between gap-4 whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-sand ${
        active ? 'font-semibold text-foreground' : 'text-ink-soft'
      }`}
    >
      {children}
      {active && <span aria-hidden="true">✓</span>}
    </Link>
  )
}
