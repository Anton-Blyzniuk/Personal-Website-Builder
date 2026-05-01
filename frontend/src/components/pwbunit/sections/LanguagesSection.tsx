import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import type { PWBUnitFormData } from '../PWBUnitForm';

const levelOptions = [
  { value: 'A1 Begginer', label: 'A1 Beginner' },
  { value: 'A2 Elementary', label: 'A2 Elementary' },
  { value: 'B1 Intermediate', label: 'B1 Intermediate' },
  { value: 'B2 Upper-Intermediate', label: 'B2 Upper-Intermediate' },
  { value: 'C1 Advanced', label: 'C1 Advanced' },
  { value: 'C2 Advanced Proficy', label: 'C2 Advanced Proficiency' },
  { value: 'Native', label: 'Native' },
  { value: 'Bilingual', label: 'Bilingual' },
];

export function LanguagesSection({ form }: { form: UseFormReturn<PWBUnitFormData> }) {
  const { control, register } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'languages' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Language (e.g. English)" {...register(`languages.${index}.name`)} />
              <Select
                options={levelOptions}
                {...register(`languages.${index}.level`)}
              />
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
        <p className="text-sm text-slate-400 text-center py-6">No languages added yet</p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => append({ name: '', level: 'Native' })}
      >
        Add language
      </Button>
    </div>
  );
}
