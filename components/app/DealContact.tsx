'use client'

import { useState } from 'react'

// Shown to both sides once a request is accepted. WhatsApp has no API for creating a group or
// adding members, so SurplusX opens a direct chat and hands over a summary to paste -- into that
// chat, or into a group they make themselves.
export default function DealContact({
  chatLink,
  chatLabel,
  summary,
  groupHowTo,
}: {
  chatLink: string | null
  chatLabel: string
  summary: string
  groupHowTo: string
}) {
  const [copied, setCopied] = useState(false)

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {chatLink ? (
          <a
            href={chatLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-85"
          >
            {chatLabel}
          </a>
        ) : (
          <span className="text-[13px] text-muted">No WhatsApp number on file for the other side.</span>
        )}
        <button
          type="button"
          onClick={copySummary}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] transition-colors hover:border-muted-light"
        >
          {copied ? 'Summary copied' : 'Copy deal summary'}
        </button>
      </div>
      <details className="text-[13px] text-muted">
        <summary className="cursor-pointer list-none underline-offset-4 hover:underline">
          Want a group chat with both of you?
        </summary>
        <p className="mt-2 leading-relaxed">{groupHowTo}</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-sand p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-ink-soft">
          {summary}
        </pre>
      </details>
    </div>
  )
}
