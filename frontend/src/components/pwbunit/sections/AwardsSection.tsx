import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import type { PWBUnitFormData } from '../PWBUnitForm';

export function AwardsSection({ form }: { form: UseFormReturn<PWBUnitFormData> }) {
  const { control, register } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'awards' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Award {index + 1}</p>
              <button type="button" onClick={() => remove(index)} className="text-slate-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Title" placeholder="Best Developer Award" {...register(`awards.${index}.title`)} />
              <Input label="Issuer" placeholder="DevConf 2024" {...register(`awards.${index}.issuer`)} />
            </div>
            <Input label="Date" type="date" {...register(`awards.${index}.date`)} />
            <Textarea label="Description" rows={2} {...register(`awards.${index}.description`)} />
          </div>
        ))}
      </div>
      {fields.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No awards added yet</p>}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => append({ title: '', issuer: null, date: null, description: null, order: fields.length })}
      >
        Add award
      </Button>
    </div>
  );
}
