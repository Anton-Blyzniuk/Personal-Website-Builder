import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import type { PWBUnitFormData } from '../PWBUnitForm';

const levelOptions = [
  { value: '', label: 'None' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' },
];

export function SkillsSection({ form }: { form: UseFormReturn<PWBUnitFormData> }) {
  const { control, register } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'skills' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
            <GripVertical className="h-5 w-5 text-slate-300 mt-2 shrink-0" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder="Skill name" {...register(`skills.${index}.name`)} />
              <Input placeholder="Category (e.g. Backend)" {...register(`skills.${index}.category`)} />
              <Select
                options={levelOptions}
                {...register(`skills.${index}.level`)}
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
        <p className="text-sm text-slate-400 text-center py-6">No skills added yet</p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => append({ name: '', category: null, level: null, order: fields.length })}
      >
        Add skill
      </Button>
    </div>
  );
}
