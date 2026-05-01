import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Star, Trash2, FileText, X } from 'lucide-react';
import { mediaApi } from '../../../api/media';
import { useToast } from '../../../hooks/useToast';
import { extractErrorMessage } from '../../../lib/api';
import { Button } from '../../ui/Button';
import type { Photo } from '../../../types/api';

interface PhotosSectionProps {
  unitName: string;
  pdfResume: string | null;
}

export function PhotosSection({ unitName, pdfResume: initialPdf }: PhotosSectionProps) {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState(initialPdf);

  const { data: photos = [] } = useQuery({
    queryKey: ['photos', unitName],
    queryFn: () => mediaApi.listPhotos(unitName),
  });

  const uploadPhoto = useMutation({
    mutationFn: ({ file, isMain }: { file: File; isMain: boolean }) =>
      mediaApi.uploadPhoto(unitName, file, isMain),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['photos', unitName] }); success('Photo uploaded'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  const setMain = useMutation({
    mutationFn: (photoId: number) => mediaApi.setMainPhoto(unitName, photoId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['photos', unitName] }); success('Main photo updated'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  const deletePhoto = useMutation({
    mutationFn: (photoId: number) => mediaApi.deletePhoto(unitName, photoId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['photos', unitName] }); success('Photo deleted'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  const uploadPdf = useMutation({
    mutationFn: (file: File) => mediaApi.uploadPdfResume(unitName, file),
    onSuccess: (data) => { setPdf(data.pdf_resume); success('PDF resume uploaded'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  const deletePdf = useMutation({
    mutationFn: () => mediaApi.deletePdfResume(unitName),
    onSuccess: () => { setPdf(null); success('PDF resume removed'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  return (
    <div className="space-y-10">
      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Photos</h3>
          <Button
            type="button" variant="secondary" size="sm"
            icon={<Upload className="h-4 w-4" />}
            onClick={() => photoInputRef.current?.click()}
            loading={uploadPhoto.isPending}
          >
            Upload photo
          </Button>
          <input
            ref={photoInputRef} type="file" className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto.mutate({ file, isMain: photos.length === 0 });
              e.target.value = '';
            }}
          />
        </div>

        {photos.length === 0 ? (
          <div
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors duration-200"
            onClick={() => photoInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-500">Click to upload photos</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">JPEG, PNG, WebP, or GIF</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo: Photo) => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100 dark:bg-slate-800">
                <img src={photo.image} alt="" className="w-full h-full object-cover" />
                {photo.is_main && (
                  <div className="absolute top-2 left-2 bg-amber-400 text-white rounded-full p-1 shadow">
                    <Star className="h-3 w-3 fill-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  {!photo.is_main && (
                    <button
                      type="button" title="Set as main"
                      onClick={() => setMain.mutate(photo.id)}
                      className="p-2 bg-white/90 rounded-full text-amber-500 hover:bg-white transition-colors"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button" title="Delete"
                    onClick={() => deletePhoto.mutate(photo.id)}
                    className="p-2 bg-white/90 rounded-full text-red-500 hover:bg-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Resume */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">PDF Resume</h3>
        {pdf ? (
          <div className="flex items-center gap-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl p-4">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">PDF resume uploaded</p>
              <a href={pdf} target="_blank" rel="noreferrer" className="text-xs text-green-600 dark:text-green-500 hover:underline">
                View / download
              </a>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" icon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => pdfInputRef.current?.click()} loading={uploadPdf.isPending}>
                Replace
              </Button>
              <button type="button" onClick={() => deletePdf.mutate()}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors duration-200"
            onClick={() => pdfInputRef.current?.click()}
          >
            <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-500">Click to upload PDF resume</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">PDF files only</p>
          </div>
        )}
        <input ref={pdfInputRef} type="file" className="hidden" accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadPdf.mutate(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
