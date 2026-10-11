'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Handshake, LayoutGrid, Package, Plus, Scissors } from 'lucide-react'
import type { AppCounts } from '@/lib/lots/queries'

// Phone replacement for the sidebar: the four app sections plus a raised "Post" button.
export default function MobileTabBar({ counts }: { counts: AppCounts }) {
  const pathname = usePathname()

  const tabs = [
    {
      href: '/feed',
      label: 'Browse',
      icon: LayoutGrid,
      active: pathname === '/feed' || (pathname.startsWith('/lots/') && pathname !== '/lots/new'),
      badge: 0,
    },
    { href: '/my/listings', label: 'Listings', icon: Package, active: pathname.startsWith('/my/listings'), badge: counts.awaitingYou },
    { href: '/lots/new', label: 'Post', icon: Plus, active: pathname === '/lots/new', badge: 0, primary: true },
    { href: '/my/claims', label: 'Claims', icon: Handshake, active: pathname.startsWith('/my/claims'), badge: counts.activeClaims },
    { href: '/my/swatches', label: 'Swatches', icon: Scissors, active: pathname.startsWith('/my/swatches'), badge: 0 },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, active, badge, primary }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] ${
              active ? 'font-semibold text-foreground' : 'text-muted'
            }`}
          >
            {primary ? (
              <span className="-mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
                <Icon size={19} strokeWidth={2} aria-hidden="true" />
              </span>
            ) : (
              <Icon size={21} strokeWidth={active ? 2 : 1.6} aria-hidden="true" />
            )}
            {label}
            {badge > 0 && (
              <span className="absolute left-1/2 top-1.5 ml-2 rounded-full bg-accent px-1.5 font-mono text-[10px] leading-4 text-accent-foreground">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
