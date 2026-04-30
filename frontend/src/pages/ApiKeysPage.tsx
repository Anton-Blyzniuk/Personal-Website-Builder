import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Copy, RotateCcw, Trash2, AlertTriangle, Check, Plus, ShieldCheck } from 'lucide-react';
import { usersApi } from '../api/users';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Copy"
      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all duration-150 active:scale-90"
    >
      {copied ? <Check className="h-4 w-4 text-green-400 animate-scale-in" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function SecretBanner({ secret, onDismiss }: { secret: string; onDismiss: () => void }) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 animate-scale-in">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-300">Save your secret — shown only once</p>
          <p className="text-xs text-amber-400/80 mt-1">
            Copy it now and store securely. You cannot retrieve it again.
          </p>
          <div className="mt-3 font-mono text-sm bg-slate-900/80 border border-amber-500/20 rounded-lg px-4 py-3 flex items-center justify-between gap-2 break-all">
            <span className="text-amber-200 select-all">{secret}</span>
            <CopyButton text={secret} />
          </div>
          <button onClick={onDismiss} className="mt-3 text-xs text-amber-500/70 hover:text-amber-400 transition-colors">
            I've saved it — dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApiKeysPage() {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  const { data: credential, isLoading, isError } = useQuery({
    queryKey: ['api-key'],
    queryFn: usersApi.getApiKey,
    retry: (count, err) => {
      if ((err as { response?: { status?: number } })?.response?.status === 404) return false;
      return count < 2;
    },
  });

  const createKey = useMutation({
    mutationFn: usersApi.createApiKey,
    onSuccess: (d) => { queryClient.invalidateQueries({ queryKey: ['api-key'] }); setNewSecret(d.secret); success('API key generated'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });
  const rotateKey = useMutation({
    mutationFn: usersApi.rotateApiKey,
    onSuccess: (d) => { queryClient.invalidateQueries({ queryKey: ['api-key'] }); setNewSecret(d.secret); setConfirmRotate(false); success('Secret rotated'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });
  const deleteKey = useMutation({
    mutationFn: usersApi.deleteApiKey,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['api-key'] }); setConfirmDelete(false); setNewSecret(null); success('Credentials revoked'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  const hasKey = !isError && !!credential;

  return (
    <DashboardLayout>
      <div className="page-enter">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Credentials</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Manage your API key and secret for programmatic access</p>
        </div>

        <div className="space-y-5 max-w-2xl stagger-children">
          {/* How it works */}
          <Card className="bg-slate-50/80 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/30">
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 text-primary-500 mt-0.5 shrink-0" />
              <div className="text-sm space-y-2">
                <p className="font-medium text-slate-700 dark:text-slate-300">Using API credentials</p>
                <p className="text-slate-500 dark:text-slate-500">Include both headers on every request to authenticate without a JWT:</p>
                <div className="font-mono text-xs bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-700/50 p-3 space-y-1">
                  <p><span className="text-slate-500">X-Api-Key:</span> <span className="text-primary-400">&lt;your key&gt;</span></p>
                  <p><span className="text-slate-500">X-Api-Secret:</span> <span className="text-primary-400">&lt;your secret&gt;</span></p>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-600">Both headers must be present — providing only one returns 401.</p>
              </div>
            </div>
          </Card>

          {/* Secret reveal */}
          {newSecret && <SecretBanner secret={newSecret} onDismiss={() => setNewSecret(null)} />}

          {/* Credential card */}
          <Card>
            <CardHeader>
              <CardTitle>API Key</CardTitle>
              {hasKey ? <Badge color="green">Active</Badge> : <Badge color="gray">None</Badge>}
            </CardHeader>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
              </div>
            ) : hasKey ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wide">API Key</label>
                  <div className="mt-1.5 flex items-center gap-2 font-mono text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2.5">
                    <span className="flex-1 text-slate-800 dark:text-slate-200 break-all select-all">{credential.key}</span>
                    <CopyButton text={credential.key} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wide">Secret</label>
                  <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-600 italic">
                    Hidden — use "Rotate secret" to generate a new one
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wide">Created</label>
                  <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">{new Date(credential.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirmRotate(true)}>Rotate secret</Button>
                  <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>Revoke</Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center animate-scale-in">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 animate-float">
                  <Key className="h-6 w-6 text-slate-400 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">No credentials yet.</p>
                <Button icon={<Plus className="h-4 w-4" />} loading={createKey.isPending} onClick={() => createKey.mutate()}>
                  Generate API key
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={confirmRotate} onClose={() => setConfirmRotate(false)} title="Rotate secret" size="sm">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This immediately invalidates your current secret. Integrations using it will break until updated.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setConfirmRotate(false)}>Cancel</Button>
            <Button loading={rotateKey.isPending} onClick={() => rotateKey.mutate()}>Rotate</Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Revoke credentials" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This permanently revokes your API key and secret. Existing integrations will break immediately.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" loading={deleteKey.isPending} onClick={() => deleteKey.mutate()}>Revoke</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
