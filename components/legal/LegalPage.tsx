import { SUPPORT_EMAIL } from '@/lib/site'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article>
      <div className="mb-3.5 font-mono text-[11px] tracking-[0.1em] text-muted">LAST UPDATED {updated.toUpperCase()}</div>
      <h1 className="mb-8 font-display text-[44px] leading-[1.02] font-normal sm:text-[56px]">{title}</h1>
      <div className="flex flex-col gap-9 text-[15.5px] leading-[1.7] text-ink-soft">{children}</div>
    </article>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-[26px] leading-tight font-normal text-foreground">{title}</h2>
      <div className="flex flex-col gap-3 [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}

export function ContactLine() {
  return SUPPORT_EMAIL ? (
    <p>
      Questions or requests: email{' '}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-4">
        {SUPPORT_EMAIL}
      </a>
      .
    </p>
  ) : (
    <p>A contact email for questions and requests will be listed here.</p>
  )
}
