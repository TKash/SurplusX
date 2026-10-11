// Small shared pieces of the app's design language (Claude Design "App home" screen).

// tone="light": on dark grounds (sign-in, app sidebar), where the brighter terracotta dot reads better.
export function Logo({ size = 'md', tone = 'dark' }: { size?: 'md' | 'lg'; tone?: 'dark' | 'light' }) {
  const bright = size === 'lg' || tone === 'light'
  return (
    <span className="inline-flex items-center gap-[9px]">
      <span
        className={`rounded-full ${bright ? 'bg-accent-bright' : 'bg-accent'} ${
          size === 'lg' ? 'h-6 w-6' : 'h-[22px] w-[22px]'
        }`}
      />
      <span className={`font-display leading-none ${size === 'lg' ? 'text-[25px]' : 'text-[22px]'}`}>
        SurplusX
      </span>
    </span>
  )
}

export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10px] tracking-[0.1em] text-muted uppercase ${className}`}>{children}</div>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-4 pb-5 pt-6 sm:px-7 sm:pt-8">
      <div className="min-w-0">
        <h1 className="font-display text-[32px] leading-none font-normal sm:text-[38px]">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Pill({
  children,
  tone = 'plain',
}: {
  children: React.ReactNode
  tone?: 'plain' | 'accent' | 'dark' | 'ok' | 'quiet'
}) {
  const tones = {
    plain: 'border border-line bg-surface text-foreground',
    accent: 'bg-accent text-accent-foreground',
    dark: 'bg-foreground text-background',
    ok: 'bg-[oklch(0.94_0.04_145)] text-ok',
    quiet: 'bg-sand text-muted',
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-[5px] font-mono text-[10.5px] tracking-[0.04em] uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
      <p className="font-display text-2xl">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{children}</div>}
    </div>
  )
}

export function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div role="img" aria-label={label} className="flex h-full w-full items-center justify-center bg-sand">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-light">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  )
}
