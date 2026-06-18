import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { readEnv, EDITABLE_KEYS } from '@/lib/env';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const s = await getSession();
  if (!s) redirect('/login');

  const all = readEnv();
  const initial: Record<string, string> = {};
  for (const k of EDITABLE_KEYS) initial[k] = all[k] ?? '';

  return (
    <div className="min-h-screen">
      <SettingsForm initial={initial} />
    </div>
  );
}
