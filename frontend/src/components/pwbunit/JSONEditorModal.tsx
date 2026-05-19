import { useState, useEffect } from 'react';
import { AlertCircle, Info, FileJson } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { PWBUnit } from '../../types/api';
import type { PWBUnitFormData } from './PWBUnitForm';

// ─── Serialise ────────────────────────────────────────────────────────────────

function toJson(fd: PWBUnitFormData, unit: PWBUnit): string {
  return JSON.stringify(
    {
      first_name: fd.first_name,
      last_name: fd.last_name,
      headline: fd.headline,
      email: fd.email,
      phone: fd.phone || null,
      location: fd.location || null,
      about: fd.about || null,
      template: fd.template,
      skills: (fd.skills ?? []).map(s => ({
        name: s.name,
        category: s.category || null,
        level: s.level,
        order: s.order,
      })),
      links: fd.links ?? [],
      languages: fd.languages ?? [],
      experience_units: (fd.experience_units ?? []).map(e => ({
        title: e.title,
        organization: e.organization || null,
        location: e.location || null,
        description: e.description || null,
        from_date: e.from_date,
        to_date: e.to_date || null,
        order: e.order,
      })),
      education_units: (fd.education_units ?? []).map(e => ({
        institution: e.institution,
        degree: e.degree || null,
        field_of_study: e.field_of_study || null,
        location: e.location || null,
        from_date: e.from_date,
        to_date: e.to_date || null,
        description: e.description || null,
        order: e.order,
      })),
      portfolio_items: (fd.portfolio_items ?? []).map(p => ({
        title: p.title,
        category: p.category || null,
        description: p.description || null,
        date: p.date || null,
        order: p.order,
        links: p.links ?? [],
        image: p._image ?? null,
      })),
      certifications: (fd.certifications ?? []).map(c => ({
        name: c.name,
        issuing_organization: c.issuing_organization,
        issue_date: c.issue_date || null,
        expiry_date: c.expiry_date || null,
        credential_id: c.credential_id || null,
        credential_url: c.credential_url || null,
        order: c.order,
        image: c._image ?? null,
      })),
      awards: (fd.awards ?? []).map(a => ({
        title: a.title,
        issuer: a.issuer || null,
        date: a.date || null,
        description: a.description || null,
        order: a.order,
      })),
      custom_sections: (fd.custom_sections ?? []).map(cs => ({
        title: cs.title,
        order: cs.order,
        items: (cs.items ?? []).map(item => ({
          title: item.title,
          subtitle: item.subtitle || null,
          from_date: item.from_date || null,
          to_date: item.to_date || null,
          description: item.description || null,
          url: item.url || null,
          order: item.order,
        })),
      })),
      photos: unit.photos.map(p => ({ id: p.id, image: p.image, is_main: p.is_main })),
    },
    null,
    2,
  );
}

// ─── Deserialise ──────────────────────────────────────────────────────────────

const REQUIRED = ['first_name', 'last_name', 'headline', 'email'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromJson(raw: any, ex: PWBUnitFormData): PWBUnitFormData {
  for (const f of REQUIRED) {
    if (!raw[f]) throw new Error(`Missing required field: "${f}"`);
  }
  return {
    first_name: String(raw.first_name),
    last_name: String(raw.last_name),
    headline: String(raw.headline),
    email: String(raw.email),
    phone: raw.phone ? String(raw.phone) : '',
    location: raw.location ? String(raw.location) : '',
    about: raw.about ? String(raw.about) : '',
    template: raw.template ?? ex.template,
    skills: Array.isArray(raw.skills)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.skills.map((s: any, i: number) => ({
          name: String(s.name ?? ''),
          category: s.category ? String(s.category) : '',
          level: s.level ?? null,
          order: s.order ?? i,
        }))
      : ex.skills,
    links: Array.isArray(raw.links)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.links.map((l: any) => ({ name: String(l.name ?? ''), url: String(l.url ?? '') }))
      : ex.links,
    languages: Array.isArray(raw.languages)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.languages.map((l: any) => ({ name: String(l.name ?? ''), level: l.level ?? 'Native' }))
      : ex.languages,
    experience_units: Array.isArray(raw.experience_units)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.experience_units.map((e: any, i: number) => ({
          title: String(e.title ?? ''),
          organization: e.organization ? String(e.organization) : '',
          location: e.location ? String(e.location) : '',
          description: e.description ? String(e.description) : '',
          from_date: String(e.from_date ?? ''),
          to_date: e.to_date ? String(e.to_date) : '',
          order: e.order ?? i,
        }))
      : ex.experience_units,
    education_units: Array.isArray(raw.education_units)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.education_units.map((e: any, i: number) => ({
          institution: String(e.institution ?? ''),
          degree: e.degree ? String(e.degree) : '',
          field_of_study: e.field_of_study ? String(e.field_of_study) : '',
          location: e.location ? String(e.location) : '',
          from_date: String(e.from_date ?? ''),
          to_date: e.to_date ? String(e.to_date) : '',
          description: e.description ? String(e.description) : '',
          order: e.order ?? i,
        }))
      : ex.education_units,
    portfolio_items: Array.isArray(raw.portfolio_items)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.portfolio_items.map((p: any, i: number) => {
          const existing = ex.portfolio_items?.[i];
          return {
            _id: existing?._id,
            _image: existing?._image ?? null,
            title: String(p.title ?? ''),
            category: p.category ? String(p.category) : '',
            description: p.description ? String(p.description) : '',
            date: p.date ? String(p.date) : '',
            order: p.order ?? i,
            links: Array.isArray(p.links)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? p.links.map((l: any) => ({ name: String(l.name ?? ''), url: String(l.url ?? '') }))
              : [],
          };
        })
      : ex.portfolio_items,
    certifications: Array.isArray(raw.certifications)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.certifications.map((c: any, i: number) => {
          const existing = ex.certifications?.[i];
          return {
            _id: existing?._id,
            _image: existing?._image ?? null,
            name: String(c.name ?? ''),
            issuing_organization: String(c.issuing_organization ?? ''),
            issue_date: c.issue_date ? String(c.issue_date) : '',
            expiry_date: c.expiry_date ? String(c.expiry_date) : '',
            credential_id: c.credential_id ? String(c.credential_id) : '',
            credential_url: c.credential_url ? String(c.credential_url) : '',
            order: c.order ?? i,
          };
        })
      : ex.certifications,
    awards: Array.isArray(raw.awards)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.awards.map((a: any, i: number) => ({
          title: String(a.title ?? ''),
          issuer: a.issuer ? String(a.issuer) : '',
          date: a.date ? String(a.date) : '',
          description: a.description ? String(a.description) : '',
          order: a.order ?? i,
        }))
      : ex.awards,
    custom_sections: Array.isArray(raw.custom_sections)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.custom_sections.map((cs: any, i: number) => ({
          title: String(cs.title ?? ''),
          order: cs.order ?? i,
          items: Array.isArray(cs.items)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? cs.items.map((item: any, ii: number) => ({
                title: String(item.title ?? ''),
                subtitle: item.subtitle ? String(item.subtitle) : '',
                from_date: item.from_date ? String(item.from_date) : '',
                to_date: item.to_date ? String(item.to_date) : '',
                description: item.description ? String(item.description) : '',
                url: item.url ? String(item.url) : '',
                order: item.order ?? ii,
              }))
            : [],
        }))
      : ex.custom_sections,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface JSONEditorModalProps {
  open: boolean;
  onClose: () => void;
  unit: PWBUnit;
  formData: PWBUnitFormData;
  onApply: (data: PWBUnitFormData) => void;
}

export function JSONEditorModal({ open, onClose, unit, formData, onApply }: JSONEditorModalProps) {
  const [json, setJson] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<PWBUnitFormData | null>(null);

  useEffect(() => {
    if (open) {
      setJson(toJson(formData, unit));
      setParsed(formData);
      setParseError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const validate = (text: string) => {
    setJson(text);
    if (!text.trim()) {
      setParsed(null);
      setParseError('JSON cannot be empty');
      return;
    }
    try {
      const raw = JSON.parse(text);
      setParsed(fromJson(raw, formData));
      setParseError(null);
    } catch (err) {
      setParsed(null);
      setParseError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleApply = () => {
    if (!parsed) return;
    onApply(parsed);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit JSON" size="lg">
      <div className="p-5 space-y-4">
        {/* Read-only images notice */}
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
          <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Photo and image fields are read-only</strong> — shown for reference but changes to those fields will be ignored.
            Use the <strong>Photos & Media</strong> tab to manage images.
          </p>
        </div>

        {/* Editor */}
        <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">JSON</span>
          </div>
          <textarea
            value={json}
            onChange={e => validate(e.target.value)}
            spellCheck={false}
            className="w-full h-52 sm:h-72 p-4 text-xs font-mono bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
          />
        </div>

        {/* Error */}
        {parseError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg animate-scale-in">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{parseError}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!parsed || !!parseError}
            icon={<FileJson className="h-4 w-4" />}
            onClick={handleApply}
          >
            Apply changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
