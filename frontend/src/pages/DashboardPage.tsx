import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ExternalLink, LayoutGrid, Share2 } from 'lucide-react';
import { pwbUnitsApi } from '../api/pwbunits';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PageSpinner } from '../components/ui/Spinner';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../lib/api';
import { API_BASE_URL } from '../lib/env';
import type { PWBUnitListItem } from '../types/api';

export function DashboardPage() {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<PWBUnitListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pwbunits'],
    queryFn: () => pwbUnitsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (unitName: string) => pwbUnitsApi.delete(unitName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pwbunits'] });
      success('PWBUnit deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  return (
    <DashboardLayout>
      <div className="page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My PWBUnits</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Manage your personal website profiles</p>
          </div>
          <Link to="/dashboard/pwbunits/new">
            <Button icon={<Plus className="h-4 w-4" />}>New PWBUnit</Button>
          </Link>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : data?.results.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center animate-scale-in">
            <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-5 animate-float">
              <LayoutGrid className="h-9 w-9 text-slate-400 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No PWBUnits yet</h3>
            <p className="text-slate-500 dark:text-slate-500 text-sm mb-6 max-w-xs">
              Create your first PWBUnit to start building your professional profile.
            </p>
            <Link to="/dashboard/pwbunits/new">
              <Button icon={<Plus className="h-4 w-4" />}>Create PWBUnit</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {data?.results.map((unit) => (
              <div
                key={unit.unit_name}
                className="group flex items-center gap-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-700/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-[0_4px_20px_rgba(0,0,0,.35)] hover:border-slate-300 dark:hover:border-slate-600"
              >
                {/* Avatar */}
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0 shadow-glow-sm">
                  <span className="text-white text-base font-bold">
                    {unit.first_name[0]?.toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {unit.first_name} {unit.last_name}
                    </h3>
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-600 shrink-0">
                      /{unit.unit_name}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-500 truncate">{unit.headline}</p>
                  {unit.location && (
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">{unit.location}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/cv/${unit.unit_name}`);
                      success('Link copied!');
                    }}
                    title="Copy CV link"
                    className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition-all duration-150"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <a
                    href={`${API_BASE_URL}/api/v1/pwbunits/${unit.unit_name}/`}
                    target="_blank"
                    rel="noreferrer"
                    title="View public JSON"
                    className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition-all duration-150"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link
                    to={`/dashboard/pwbunits/${unit.unit_name}/edit`}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-150"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(unit)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all duration-150"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Always-visible edit link */}
                <Link
                  to={`/dashboard/pwbunits/${unit.unit_name}/edit`}
                  className="shrink-0 text-xs font-medium text-primary-500 hover:text-primary-400 transition-colors"
                >
                  Edit →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete PWBUnit" size="sm">
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Are you sure you want to delete{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-mono">{deleteTarget?.unit_name}</strong>?{' '}
            This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.unit_name)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
