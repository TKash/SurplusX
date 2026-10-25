'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BadgeCheck, Bookmark, LayoutGrid, Package, Plus } from 'lucide-react'
import type { AppCounts } from '@/lib/lots/queries'

// Phone replacement for the sidebar: the app's sections plus a raised "Post" button.
export default function MobileTabBar({ counts, isAdmin }: { counts: AppCounts; isAdmin: boolean }) {
  const pathname = usePathname()

  const tabs = [
    {
      href: '/feed',
      label: 'Browse',
      icon: LayoutGrid,
      active: pathname === '/feed' || (pathname.startsWith('/lots/') && pathname !== '/lots/new'),
      badge: 0,
    },
    {
      href: '/my/listings',
      label: 'Listings',
      icon: Package,
      active: pathname.startsWith('/my/listings'),
      badge: counts.interest,
    },
    { href: '/lots/new', label: 'Post', icon: Plus, active: pathname === '/lots/new', badge: 0, primary: true },
    { href: '/my/saved', label: 'Saved', icon: Bookmark, active: pathname.startsWith('/my/saved'), badge: 0 },
    isAdmin
      ? {
          href: '/admin/verification',
          label: 'Verify',
          icon: BadgeCheck,
          active: pathname.startsWith('/admin'),
          badge: 0,
        }
      : null,
  ].filter((tab): tab is NonNullable<typeof tab> => tab !== null)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div
        className="mx-auto grid max-w-md"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
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
