'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminAuthGate } from '@/lib/use-admin-auth-gate';
import { adminFetch } from './api';
import AdminsPanel from './AdminsPanel';
import BroadcastPanel from './BroadcastPanel';
import PlayersPanel from './PlayersPanel';
import QuestsPanel from './QuestsPanel';
import SiteMessagesPanel from './SiteMessagesPanel';
import SupportPanel from './SupportPanel';

const TABS = [
  { id: 'players', label: 'Players' },
  { id: 'quests', label: 'Quest review' },
  { id: 'broadcast', label: 'Email broadcast' },
  { id: 'messages', label: 'Site messages' },
  { id: 'support', label: 'Support' },
  { id: 'admins', label: 'Admins' },
] as const;

type TabId = (typeof TABS)[number]['id'];

type Status = { email: string; database: boolean; email_sending: boolean };

export default function AdminClient() {
  const { authState, error, retry } = useAdminAuthGate();
  const params = useSearchParams();
  const router = useRouter();
  const initial = (TABS.find((t) => t.id === params.get('tab'))?.id || 'players') as TabId;
  const [tab, setTab] = useState<TabId>(initial);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (authState !== 'ok') return;
    adminFetch<Status>('/api/admin/me').then(setStatus).catch(() => {});
  }, [authState]);

  if (authState === 'loading') return <p className="muted">Checking access…</p>;
  if (authState === 'needs-sign-in' || authState === 'signing-in') {
    return (
      <div className="card stack-4" style={{ maxWidth: 480 }}>
        <h1 className="title">Admin sign in</h1>
        <p className="muted">Sign in with an allowlisted account.</p>
        {error ? <p className="notice notice--error small">{error}</p> : null}
        <div>
          <button type="button" className="cs-btn" disabled={authState === 'signing-in'} onClick={() => void retry()}>
            {authState === 'signing-in' ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    );
  }
  if (authState === 'forbidden') {
    return (
      <div className="card stack-4" style={{ maxWidth: 480 }}>
        <h1 className="title">No admin access</h1>
        <p className="muted">This account is not on the admin list. Ask an existing admin to add your email.</p>
      </div>
    );
  }

  function choose(id: TabId) {
    setTab(id);
    router.replace(`/admin?tab=${id}`, { scroll: false });
  }

  return (
    <div className="stack-6">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="headline">Admin</h1>
        {status ? (
          <p className="small muted">
            {status.email} · database {status.database ? 'connected' : 'not configured'} · email{' '}
            {status.email_sending ? 'ready' : 'not configured'}
          </p>
        ) : null}
      </div>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => choose(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'players' ? <PlayersPanel /> : null}
      {tab === 'quests' ? <QuestsPanel /> : null}
      {tab === 'broadcast' ? <BroadcastPanel /> : null}
      {tab === 'messages' ? <SiteMessagesPanel /> : null}
      {tab === 'support' ? <SupportPanel initialTicket={params.get('ticket')} /> : null}
      {tab === 'admins' ? <AdminsPanel self={status?.email || ''} /> : null}
    </div>
  );
}
