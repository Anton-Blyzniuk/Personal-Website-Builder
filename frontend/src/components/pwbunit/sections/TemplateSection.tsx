import { UseFormReturn } from 'react-hook-form';
import type { PWBUnitFormData } from '../PWBUnitForm';

const TEMPLATES = [
  {
    id: 'classic' as const,
    name: 'Classic',
    description: 'Traditional two-column layout. Sidebar for skills and education, main column for experience.',
  },
  {
    id: 'modern' as const,
    name: 'Modern',
    description: 'Bold header with accent color. Card-based sections. Visual hierarchy.',
  },
  {
    id: 'minimal' as const,
    name: 'Minimal',
    description: 'Typography-first, monochrome. Maximum readability, zero decoration.',
  },
];

interface Props {
  form: UseFormReturn<PWBUnitFormData>;
}

export function TemplateSection({ form }: Props) {
  const { watch, setValue } = form;
  const current = watch('template') ?? 'classic';

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Choose how your public CV page looks. The selected template applies immediately when someone opens your CV link.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setValue('template', t.id, { shouldDirty: true })}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              current === t.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
            }`}
          >
            <div className="font-semibold text-slate-900 dark:text-white mb-1">{t.name}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{t.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
