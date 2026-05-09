import { useRef, useState } from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { mediaApi } from '../../../api/media';
import { useToast } from '../../../hooks/useToast';
import { extractErrorMessage } from '../../../lib/api';
import type { PWBUnitFormData } from '../PWBUnitForm';

function PortfolioItem({
  index,
  form,
  unitName,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<PWBUnitFormData>;
  unitName: string;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, control, watch, setValue } = form;
  const { success, error: toastError } = useToast();
  const title = watch(`portfolio_items.${index}.title`);
  const itemId = watch(`portfolio_items.${index}._id`);
  const imageUrl = watch(`portfolio_items.${index}._image`);
  const { fields: linkFields, append: addLink, remove: removeLink } = useFieldArray({
    control,
    name: `portfolio_items.${index}.links`,
  });

  const handleUpload = async (file: File) => {
    if (!itemId) return;
    setUploading(true);
    try {
      const res = await mediaApi.uploadPortfolioImage(unitName, itemId, file);
      setValue(`portfolio_items.${index}._image`, res.image, { shouldDirty: false });
      success('Image uploaded');
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemId) return;
    setUploading(true);
    try {
      await mediaApi.deletePortfolioImage(unitName, itemId);
      setValue(`portfolio_items.${index}._image`, null, { shouldDirty: false });
      success('Image removed');
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

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

          {/* Image */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Image</label>
            <div className="mt-2 flex items-center gap-3">
              {itemId ? (
                <>
                  {imageUrl && (
                    <div className="relative group w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={uploading}
                          className="p-1 bg-white/90 rounded-full text-red-500 hover:bg-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Upload className="h-3 w-3" />}
                    onClick={() => fileInputRef.current?.click()}
                    loading={uploading}
                  >
                    {imageUrl ? 'Replace' : 'Upload image'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                      e.target.value = '';
                    }}
                  />
                </>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">Save changes first to add an image</p>
              )}
            </div>
          </div>

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

export function PortfolioSection({ form, unitName }: { form: UseFormReturn<PWBUnitFormData>; unitName: string }) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'portfolio_items' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <PortfolioItem key={field.id} index={index} form={form} unitName={unitName} onRemove={() => remove(index)} />
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
          append({ _id: undefined, _image: null, title: '', category: null, description: null, date: null, order: fields.length, links: [] })
        }
      >
        Add portfolio item
      </Button>
    </div>
  );
}
