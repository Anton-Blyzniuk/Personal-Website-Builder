import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import type { PWBUnitFormData } from '../PWBUnitForm';

function CertItem({
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
  const name = watch(`certifications.${index}.name`);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{name || 'Untitled certification'}</p>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-slate-400 hover:text-red-500 p-1">
          <Trash2 className="h-4 w-4" />
        </button>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Certification name" placeholder="AWS Certified Solutions Architect" {...register(`certifications.${index}.name`)} />
            <Input label="Issuing organization" placeholder="Amazon Web Services" {...register(`certifications.${index}.issuing_organization`)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Issue date" type="date" {...register(`certifications.${index}.issue_date`)} />
            <Input label="Expiry date" type="date" {...register(`certifications.${index}.expiry_date`)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Credential ID" placeholder="ABC123" {...register(`certifications.${index}.credential_id`)} />
            <Input label="Credential URL" type="url" placeholder="https://..." {...register(`certifications.${index}.credential_url`)} />
          </div>
        </div>
      )}
    </div>
  );
}

export function CertificationsSection({ form }: { form: UseFormReturn<PWBUnitFormData> }) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'certifications' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <CertItem key={field.id} index={index} form={form} onRemove={() => remove(index)} />
        ))}
      </div>
      {fields.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No certifications added yet</p>}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => append({ name: '', issuing_organization: '', issue_date: null, expiry_date: null, credential_id: null, credential_url: null, order: fields.length })}
      >
        Add certification
      </Button>
    </div>
  );
}
