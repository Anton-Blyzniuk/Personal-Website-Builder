import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { pwbUnitsApi } from '../api/pwbunits';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PWBUnitForm } from '../components/pwbunit/PWBUnitForm';
import { PageSpinner } from '../components/ui/Spinner';
import type { PWBUnitUpdatePayload } from '../types/api';

export function PWBUnitEditPage() {
  const { unit_name } = useParams<{ unit_name: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const { data: unit, isLoading, isError } = useQuery({
    queryKey: ['pwbunit', unit_name],
    queryFn: () => pwbUnitsApi.get(unit_name!),
    enabled: !!unit_name,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: PWBUnitUpdatePayload) => pwbUnitsApi.update(unit_name!, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['pwbunit', unit_name], updated);
      queryClient.invalidateQueries({ queryKey: ['pwbunits'] });
      success('Changes saved');
    },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  const handleSave = async (payload: PWBUnitUpdatePayload): Promise<void> => {
    await updateMutation.mutateAsync(payload);
  };

  return (
    <DashboardLayout>
      <div className="page-enter">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back to dashboard
        </button>

        {isLoading && <PageSpinner />}

        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-scale-in">
            <p className="text-slate-500 dark:text-slate-500">PWBUnit not found or you don't have access.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 text-sm text-primary-500 hover:underline">
              Go back
            </button>
          </div>
        )}

        {unit && (
          <PWBUnitForm
            unit={unit}
            onSave={handleSave}
            saving={updateMutation.isPending}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
