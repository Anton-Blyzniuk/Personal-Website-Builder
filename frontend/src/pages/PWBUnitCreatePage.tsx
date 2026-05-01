import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, FileJson } from 'lucide-react';
import { pwbUnitsApi } from '../api/pwbunits';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

const schema = z.object({
  unit_name: z.string().min(1, 'Required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only').max(80),
  first_name: z.string().min(1, 'Required'),
  last_name:  z.string().min(1, 'Required'),
  headline:   z.string().min(1, 'Required').max(120),
  email:      z.string().email('Invalid email'),
  phone:    z.string().optional(),
  location: z.string().optional(),
  about:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function PWBUnitCreatePage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const create = useMutation({
    mutationFn: pwbUnitsApi.create,
    onSuccess: (unit) => { success('PWBUnit created'); navigate(`/dashboard/pwbunits/${unit.unit_name}/edit`); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

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
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create PWBUnit</h1>
          <Link
            to="/dashboard/pwbunits/import"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-150 shrink-0"
          >
            <FileJson className="h-4 w-4 text-primary-500" />
            Import from JSON
          </Link>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">Start with the basics — add more sections after creation.</p>

        <Card className="max-w-2xl">
          <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
          <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-5">
            <Input
              label="Unit name (slug)"
              placeholder="jane-doe"
              hint="Becomes the URL identifier — lowercase letters, numbers and hyphens, globally unique"
              error={errors.unit_name?.message}
              {...register('unit_name')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="First name" placeholder="Jane" error={errors.first_name?.message} {...register('first_name')} />
              <Input label="Last name"  placeholder="Doe"  error={errors.last_name?.message}  {...register('last_name')}  />
            </div>
            <Input label="Headline" placeholder="Senior Software Engineer" hint="Max 120 characters" error={errors.headline?.message} {...register('headline')} />
            <Input label="Contact email" type="email" placeholder="jane@example.com" error={errors.email?.message} {...register('email')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone (optional)"    placeholder="+1 234 567 8900" {...register('phone')}    />
              <Input label="Location (optional)" placeholder="New York, NY"    {...register('location')} />
            </div>
            <Textarea label="About (optional)" placeholder="A short bio about yourself..." rows={4} {...register('about')} />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" type="button" onClick={() => navigate('/dashboard')}>Cancel</Button>
              <Button type="submit" loading={create.isPending}>Create &amp; continue editing</Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
