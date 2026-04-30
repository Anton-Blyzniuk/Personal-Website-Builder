import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import type { PWBUnitFormData } from '../PWBUnitForm';

function EducationItem({
  index,
  form,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<PWBUnitFormData>;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const { register, watch } = form;
  const institution = watch(`education_units.${index}.institution`);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{institution || 'Untitled education'}</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200 pt-3">
          <Input label="Institution" placeholder="MIT" {...register(`education_units.${index}.institution`)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Degree" placeholder="BSc" {...register(`education_units.${index}.degree`)} />
            <Input label="Field of study" placeholder="Computer Science" {...register(`education_units.${index}.field_of_study`)} />
          </div>
          <Input label="Location" placeholder="Cambridge, MA" {...register(`education_units.${index}.location`)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="From date" type="date" {...register(`education_units.${index}.from_date`)} />
            <Input label="To date" type="date" {...register(`education_units.${index}.to_date`)} />
          </div>
          <Textarea label="Description" rows={3} {...register(`education_units.${index}.description`)} />
        </div>
      )}
    </div>
  );
}

export function EducationSection({ form }: { form: UseFormReturn<PWBUnitFormData> }) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'education_units' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <EducationItem key={field.id} index={index} form={form} onRemove={() => remove(index)} />
        ))}
      </div>
      {fields.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">No education added yet</p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() =>
          append({ institution: '', degree: null, field_of_study: null, location: null, from_date: '', to_date: null, description: null, order: fields.length })
        }
      >
        Add education
      </Button>
    </div>
  );
}
