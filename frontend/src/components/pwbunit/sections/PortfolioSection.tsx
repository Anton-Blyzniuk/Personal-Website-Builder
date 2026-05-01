import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import type { PWBUnitFormData } from '../PWBUnitForm';

function PortfolioItem({
  index,
  form,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<PWBUnitFormData>;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const { register, control, watch } = form;
  const title = watch(`portfolio_items.${index}.title`);
  const { fields: linkFields, append: addLink, remove: removeLink } = useFieldArray({
    control,
    name: `portfolio_items.${index}.links`,
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{title || 'Untitled portfolio item'}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Title" placeholder="My App" {...register(`portfolio_items.${index}.title`)} />
            <Input label="Category" placeholder="Web, Mobile..." {...register(`portfolio_items.${index}.category`)} />
          </div>
          <Input label="Date" type="date" {...register(`portfolio_items.${index}.date`)} />
          <Textarea label="Description" rows={3} {...register(`portfolio_items.${index}.description`)} />
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Links</label>
            <div className="mt-2 space-y-2">
              {linkFields.map((lf, li) => (
                <div key={lf.id} className="flex gap-2">
                  <Input placeholder="Label" {...register(`portfolio_items.${index}.links.${li}.name`)} />
                  <Input placeholder="https://..." {...register(`portfolio_items.${index}.links.${li}.url`)} />
                  <button type="button" onClick={() => removeLink(li)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Plus className="h-3 w-3" />}
                onClick={() => addLink({ name: '', url: '' })}
              >
                Add link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PortfolioSection({ form }: { form: UseFormReturn<PWBUnitFormData> }) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'portfolio_items' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <PortfolioItem key={field.id} index={index} form={form} onRemove={() => remove(index)} />
        ))}
      </div>
      {fields.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">No portfolio items added yet</p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() =>
          append({ title: '', category: null, description: null, date: null, order: fields.length, links: [] })
        }
      >
        Add portfolio item
      </Button>
    </div>
  );
}
