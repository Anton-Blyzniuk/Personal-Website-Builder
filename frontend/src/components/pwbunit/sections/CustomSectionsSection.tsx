import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import type { PWBUnitFormData } from '../PWBUnitForm';

function CustomItem({
  sectionIndex,
  itemIndex,
  form,
  onRemove,
}: {
  sectionIndex: number;
  itemIndex: number;
  form: UseFormReturn<PWBUnitFormData>;
  onRemove: () => void;
}) {
  const { register } = form;
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/40 p-3 space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Item {itemIndex + 1}</p>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input placeholder="Title" {...register(`custom_sections.${sectionIndex}.items.${itemIndex}.title`)} />
        <Input placeholder="Subtitle" {...register(`custom_sections.${sectionIndex}.items.${itemIndex}.subtitle`)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input label="From" type="date" {...register(`custom_sections.${sectionIndex}.items.${itemIndex}.from_date`)} />
        <Input label="To" type="date" {...register(`custom_sections.${sectionIndex}.items.${itemIndex}.to_date`)} />
      </div>
      <Input placeholder="URL" type="url" {...register(`custom_sections.${sectionIndex}.items.${itemIndex}.url`)} />
      <Textarea placeholder="Description" rows={2} {...register(`custom_sections.${sectionIndex}.items.${itemIndex}.description`)} />
    </div>
  );
}

function CustomSectionItem({
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
  const title = watch(`custom_sections.${index}.title`);
  const { fields: itemFields, append: addItem, remove: removeItem } = useFieldArray({
    control,
    name: `custom_sections.${index}.items`,
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{title || 'Untitled section'}</p>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-slate-400 hover:text-red-500 p-1">
          <Trash2 className="h-4 w-4" />
        </button>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-200 pt-3 space-y-3">
          <Input label="Section title" placeholder="Publications" {...register(`custom_sections.${index}.title`)} />
          <div className="space-y-2">
            {itemFields.map((item, ii) => (
              <CustomItem key={item.id} sectionIndex={index} itemIndex={ii} form={form} onRemove={() => removeItem(ii)} />
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Plus className="h-3 w-3" />}
            onClick={() => addItem({ title: '', subtitle: null, from_date: null, to_date: null, description: null, url: null, order: itemFields.length })}
          >
            Add item
          </Button>
        </div>
      )}
    </div>
  );
}

export function CustomSectionsSection({ form }: { form: UseFormReturn<PWBUnitFormData> }) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'custom_sections' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <CustomSectionItem key={field.id} index={index} form={form} onRemove={() => remove(index)} />
        ))}
      </div>
      {fields.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No custom sections added yet</p>}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => append({ title: '', order: fields.length, items: [] })}
      >
        Add custom section
      </Button>
    </div>
  );
}
