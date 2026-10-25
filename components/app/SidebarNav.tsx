'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AppCounts } from '@/lib/lots/queries'

type NavItem = {
  href: string
  label: string
  active: boolean
  count?: number
  // Worth the seller's attention: shown as a terracotta pill rather than a plain number.
  alert?: boolean
  title?: string
}

export function navItems(pathname: string, counts: AppCounts, isAdmin = false): NavItem[] {
  const items: NavItem[] = [
    {
      href: '/feed',
      label: 'Browse stock',
      active: pathname === '/feed' || (pathname.startsWith('/lots/') && pathname !== '/lots/new'),
      count: counts.availableLots,
    },
    {
      href: '/my/listings',
      label: 'My listings',
      active: pathname.startsWith('/my/listings'),
      count: counts.interest || counts.activeListings,
      alert: counts.interest > 0,
      title: counts.interest > 0 ? `${counts.interest} buyer(s) took your contact` : undefined,
    },
    { href: '/my/saved', label: 'Saved searches', active: pathname.startsWith('/my/saved') },
  ]

  if (isAdmin) {
    items.push({
      href: '/admin/verification',
      label: 'Verification',
      active: pathname.startsWith('/admin'),
    })
  }

  return items
}

export default function SidebarNav({ counts, isAdmin }: { counts: AppCounts; isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-[3px]">
      {navItems(pathname, counts, isAdmin).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          title={item.title}
          aria-current={item.active ? 'page' : undefined}
          className={`flex items-center justify-between gap-2.5 rounded-[9px] px-3 py-[11px] text-[15px] transition-colors ${
            item.active
              ? 'bg-[rgba(247,244,238,0.1)] font-semibold text-background'
              : 'text-[rgba(247,244,238,0.72)] hover:bg-[rgba(247,244,238,0.06)] hover:text-background'
          }`}
        >
          {item.label}
          {item.count !== undefined &&
            (item.alert ? (
              <span className="rounded-full bg-accent-bright px-[7px] py-0.5 font-mono text-[11px] font-normal text-foreground">
                {item.count}
              </span>
            ) : (
              <span className="font-mono text-[11px] font-normal text-[rgba(247,244,238,0.5)]">{item.count}</span>
            ))}
        </Link>
      ))}
    </nav>
  )
}
