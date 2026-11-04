'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

type Message = {
  id: string;
  title: string;
  body: string;
  variant: 'info' | 'live' | 'gathering';
  linkUrl: string | null;
  linkLabel: string | null;
  updatedAt: string;
};

const DISMISSED = 'tf_dismissed_messages';

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED) || '[]');
  } catch {
    return [];
  }
}

/** Site-wide broadcast: live messages set in the admin console, dismissible per version. */
export default function SiteBanner() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
    let cancelled = false;
    fetch('/api/site-messages/active', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setMessages(Array.isArray(d.messages) ? d.messages : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const visible = messages.filter((m) => !dismissed.includes(`${m.id}:${m.updatedAt}`));
  if (!visible.length) return null;

  function dismiss(m: Message) {
    const next = [...dismissed, `${m.id}:${m.updatedAt}`].slice(-50);
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  }

  return (
    <>
      {visible.map((m) => (
        <div key={m.id} className={`banner banner--${m.variant}`} role="status">
          <div className="wrap small">
            {m.variant === 'live' ? <span className="cs-live">Live</span> : null}
            <strong>{m.title}</strong>
            {m.body ? <span>{m.body}</span> : null}
            {m.linkUrl ? (
              m.linkUrl.startsWith('/') ? (
                <Link href={m.linkUrl}>{m.linkLabel || 'Learn more'}</Link>
              ) : (
                <a href={m.linkUrl}>{m.linkLabel || 'Learn more'}</a>
              )
            ) : null}
            <button type="button" className="dismiss" onClick={() => dismiss(m)}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
