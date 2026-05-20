import { useRef, useState } from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { mediaApi } from '../../../api/media';
import { useToast } from '../../../hooks/useToast';
import { extractErrorMessage } from '../../../lib/api';
import type { PWBUnitFormData } from '../PWBUnitForm';

function CertItem({
  index,
  form,
  unitName,
  onRemove,
  onPendingFile,
}: {
  index: number;
  form: UseFormReturn<PWBUnitFormData>;
  unitName: string;
  onRemove: () => void;
  onPendingFile: (file: File | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, watch, setValue } = form;
  const { success, error: toastError } = useToast();
  const name = watch(`certifications.${index}.name`);
  const certId = watch(`certifications.${index}._id`);
  const imageUrl = watch(`certifications.${index}._image`);

  const handleUpload = async (file: File) => {
    if (!certId) return;
    setUploading(true);
    try {
      const res = await mediaApi.uploadCertificationImage(unitName, certId, file);
      setValue(`certifications.${index}._image`, res.image, { shouldDirty: false });
      success('Image uploaded');
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!certId) return;
    setUploading(true);
    try {
      await mediaApi.deleteCertificationImage(unitName, certId);
      setValue(`certifications.${index}._image`, null, { shouldDirty: false });
      success('Image removed');
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (certId) {
      handleUpload(file);
    } else {
      const url = URL.createObjectURL(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(file);
      setPreviewUrl(url);
      onPendingFile(file);
    }
  };

  const handleClearPending = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    onPendingFile(null);
  };

  const displayImage = imageUrl || previewUrl;

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

          {/* Image */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Badge / Logo</label>
            <div className="mt-2 flex items-center gap-3">
              {displayImage && (
                <div className="relative group w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                  <img src={displayImage} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={pendingFile ? handleClearPending : handleDelete}
                      disabled={uploading}
                      className="p-1 bg-white/90 rounded-full text-red-500 hover:bg-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Upload className="h-3 w-3" />}
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                >
                  {displayImage ? 'Replace' : 'Upload badge'}
                </Button>
                {pendingFile && !certId && (
                  <p className="text-xs text-amber-500 dark:text-amber-400">Will upload after saving</p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CertificationsSection({
  form,
  unitName,
  onPendingFile,
}: {
  form: UseFormReturn<PWBUnitFormData>;
  unitName: string;
  onPendingFile: (index: number, file: File | null) => void;
}) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'certifications' });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <CertItem
            key={field.id}
            index={index}
            form={form}
            unitName={unitName}
            onRemove={() => remove(index)}
            onPendingFile={(file) => onPendingFile(index, file)}
          />
        ))}
      </div>
      {fields.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No certifications added yet</p>}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => append({ _id: undefined, _image: null, name: '', issuing_organization: '', issue_date: '', expiry_date: '', credential_id: '', credential_url: '', order: fields.length })}
      >
        Add certification
      </Button>
    </div>
  );
}
