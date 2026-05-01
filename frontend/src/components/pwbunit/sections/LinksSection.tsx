import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import type { PWBUnitFormData } from '../PWBUnitForm';

export function LinksSection({ form }: { form: UseFormReturn<PWBUnitFormData> }) {
  const { control, register } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'links' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Label (e.g. GitHub)" {...register(`links.${index}.name`)} />
              <Input placeholder="https://..." type="url" {...register(`links.${index}.url`)} />
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {fields.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">No links added yet</p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => append({ name: '', url: '' })}
      >
        Add link
      </Button>
    </div>
  );
}
