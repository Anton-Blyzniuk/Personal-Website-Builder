import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, AlertCircle, CheckCircle2, Info, FileJson,
  Copy, RefreshCcw, Braces, Check, Camera, ChevronDown, ChevronUp,
  ClipboardCopy, Upload,
} from 'lucide-react';
import { pwbUnitsApi } from '../api/pwbunits';
import { mediaApi } from '../api/media';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { JsonCodeEditor } from '../components/ui/JsonCodeEditor';
import { PageSpinner } from '../components/ui/Spinner';
import { buildDefaultValues } from '../components/pwbunit/PWBUnitForm';
import type { PWBUnit } from '../types/api';
import type { PWBUnitFormData } from '../components/pwbunit/PWBUnitForm';

// ─── JSON Serialise ───────────────────────────────────────────────────────────

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

// ─── JSON Deserialise ────────────────────────────────────────────────────────

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
            // Prefer existing _image; fall back to URL in JSON (set after upload)
            _image: existing?._image ?? (typeof p.image === 'string' && p.image.startsWith('https://') ? p.image : null),
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
            _image: existing?._image ?? (typeof c.image === 'string' && c.image.startsWith('https://') ? c.image : null),
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

// ─── Summary ─────────────────────────────────────────────────────────────────

function getSummary(data: PWBUnitFormData): string[] {
  const n = (arr?: unknown[]) => arr?.length ?? 0;
  const p = (count: number, s: string, pl: string) => `${count} ${count === 1 ? s : pl}`;
  const parts: string[] = [];
  if (n(data.skills))           parts.push(p(n(data.skills), 'skill', 'skills'));
  if (n(data.experience_units)) parts.push(p(n(data.experience_units), 'experience', 'experiences'));
  if (n(data.education_units))  parts.push(p(n(data.education_units), 'education', 'educations'));
  if (n(data.portfolio_items))  parts.push(p(n(data.portfolio_items), 'portfolio item', 'portfolio items'));
  if (n(data.certifications))   parts.push(p(n(data.certifications), 'cert', 'certs'));
  if (n(data.awards))           parts.push(p(n(data.awards), 'award', 'awards'));
  if (n(data.languages))        parts.push(p(n(data.languages), 'language', 'languages'));
  if (n(data.links))            parts.push(p(n(data.links), 'link', 'links'));
  if (n(data.custom_sections))  parts.push(p(n(data.custom_sections), 'custom section', 'custom sections'));
  return parts;
}

// ─── Template JSON ────────────────────────────────────────────────────────────

const TEMPLATE_JSON = JSON.stringify(
  {
    first_name: 'Jane',
    last_name: 'Doe',
    headline: 'Senior Software Engineer',
    email: 'jane@example.com',
    phone: '+1 234 567 8900',
    location: 'New York, NY',
    about: 'Experienced engineer with 10 years in backend systems.',
    template: 'classic',
    skills: [
      { name: 'Python', category: 'Backend', level: 'Expert', order: 0 },
      { name: 'TypeScript', category: 'Frontend', level: 'Advanced', order: 1 },
    ],
    links: [
      { name: 'GitHub', url: 'https://github.com/janedoe' },
      { name: 'LinkedIn', url: 'https://linkedin.com/in/janedoe' },
    ],
    languages: [
      { name: 'English', level: 'Native' },
      { name: 'French', level: 'B2 Upper-Intermediate' },
    ],
    experience_units: [
      {
        title: 'Senior Software Engineer',
        organization: 'Acme Corp',
        location: 'New York, NY',
        description: 'Led the backend team and built scalable distributed systems.',
        from_date: '2020-01-01',
        to_date: null,
        order: 0,
      },
    ],
    education_units: [
      {
        institution: 'MIT',
        degree: 'BSc',
        field_of_study: 'Computer Science',
        location: 'Cambridge, MA',
        from_date: '2015-09-01',
        to_date: '2019-06-01',
        description: null,
        order: 0,
      },
    ],
    portfolio_items: [
      {
        title: 'My Portfolio Project',
        category: 'Web',
        description: 'A full-stack web application.',
        date: '2023-01-01',
        order: 0,
        links: [{ name: 'Live demo', url: 'https://myproject.example.com' }],
        image: null,
      },
    ],
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuing_organization: 'Amazon Web Services',
        issue_date: '2023-01-01',
        expiry_date: '2026-01-01',
        credential_id: 'ABC123',
        credential_url: 'https://aws.amazon.com/verify/ABC123',
        order: 0,
        image: null,
      },
    ],
    awards: [
      {
        title: 'Best Developer Award',
        issuer: 'Acme Corp',
        date: '2022-06-01',
        description: 'Awarded for exceptional contributions.',
        order: 0,
      },
    ],
    custom_sections: [
      {
        title: 'Volunteering',
        order: 0,
        items: [
          {
            title: 'Open Source Contributor',
            subtitle: 'Various projects',
            from_date: '2019-01-01',
            to_date: null,
            description: 'Contributing to open source libraries.',
            url: 'https://github.com/janedoe',
            order: 0,
          },
        ],
      },
    ],
  },
  null,
  2,
);

// ─── Image upload row ─────────────────────────────────────────────────────────

interface ImageRowProps {
  label: string;
  imageUrl: string | null;
  isNew: boolean;
  uploading: boolean;
  onUpload: (file: File) => void;
}

function ImageRow({ label, imageUrl, isNew, uploading, onUpload }: ImageRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-5 w-5 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{label}</p>
        {isNew ? (
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">Apply changes first to upload image</p>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 mt-0.5 text-xs font-medium text-primary-500 hover:text-primary-400 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-3 w-3" />
            {uploading ? 'Uploading…' : imageUrl ? 'Replace image' : 'Upload image'}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PWBUnitJsonEditPage() {
  const { unit_name } = useParams<{ unit_name: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { error: toastError, success: toastSuccess } = useToast();

  const state = location.state as { formData?: PWBUnitFormData; unit?: PWBUnit } | null;

  const { data: fetchedUnit, isLoading: unitLoading } = useQuery({
    queryKey: ['pwbunit', unit_name],
    queryFn: () => pwbUnitsApi.get(unit_name!),
    enabled: !!unit_name,
    staleTime: 30_000,
  });

  const unit = state?.unit ?? fetchedUnit;
  const initialFormData = state?.formData ?? (unit ? buildDefaultValues(unit) : null);

  // existingRef tracks the latest "existing" data used by fromJson,
  // so image uploads are preserved across subsequent JSON edits.
  const existingRef = useRef<PWBUnitFormData | null>(null);
  if (existingRef.current === null && initialFormData) {
    existingRef.current = initialFormData;
  }

  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<PWBUnitFormData | null>(null);
  const [copied, setCopied] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<string | null>(null);

  // Initialize editor when unit/formData is ready
  useEffect(() => {
    if (!initialFormData || !unit || text) return;
    const initial = toJson(initialFormData, unit);
    setText(initial);
    setParsed(initialFormData);
  // Run only once when data becomes available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!initialFormData, !!unit]);

  const validate = useCallback((value: string) => {
    if (!value.trim()) {
      setParsed(null);
      setParseError('JSON cannot be empty');
      return;
    }
    try {
      const raw = JSON.parse(value);
      const result = fromJson(raw, existingRef.current ?? ({} as PWBUnitFormData));
      setParsed(result);
      setParseError(null);
    } catch (err) {
      setParsed(null);
      setParseError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, []);

  const handleChange = useCallback((value: string) => {
    setText(value);
    validate(value);
  }, [validate]);

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(text), null, 2);
      setText(formatted);
      validate(formatted);
    } catch { /* already showing error */ }
  };

  const handleReset = () => {
    if (!initialFormData || !unit) return;
    existingRef.current = initialFormData;
    const initial = toJson(initialFormData, unit);
    setText(initial);
    validate(initial);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(TEMPLATE_JSON);
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const handleApply = () => {
    if (!parsed || !!parseError) return;
    navigate(`/dashboard/pwbunits/${unit_name}/edit`, {
      state: { jsonApplied: parsed },
    });
  };

  const handleBack = () => {
    navigate(`/dashboard/pwbunits/${unit_name}/edit`);
  };

  // ── Image upload ──────────────────────────────────────────────────────────

  const applyImageUpdate = (
    type: 'portfolio' | 'cert',
    index: number,
    imageUrl: string,
  ) => {
    if (!existingRef.current || !unit) return;

    // Update existingRef so future validates preserve the new image
    const ex = { ...existingRef.current };
    if (type === 'portfolio') {
      const items = [...(ex.portfolio_items ?? [])];
      items[index] = { ...items[index], _image: imageUrl };
      ex.portfolio_items = items;
    } else {
      const items = [...(ex.certifications ?? [])];
      items[index] = { ...items[index], _image: imageUrl };
      ex.certifications = items;
    }
    existingRef.current = ex;

    // Update parsed state and re-serialize text
    setParsed(prev => {
      if (!prev) return prev;
      let updated = prev;
      if (type === 'portfolio') {
        const items = [...(updated.portfolio_items ?? [])];
        items[index] = { ...items[index], _image: imageUrl };
        updated = { ...updated, portfolio_items: items };
      } else {
        const items = [...(updated.certifications ?? [])];
        items[index] = { ...items[index], _image: imageUrl };
        updated = { ...updated, certifications: items };
      }
      setText(toJson(updated, unit));
      return updated;
    });
  };

  const handlePortfolioUpload = async (index: number, itemId: number, file: File) => {
    if (!unit_name) return;
    const key = `portfolio:${index}`;
    setUploadingIdx(key);
    try {
      const res = await mediaApi.uploadPortfolioImage(unit_name, itemId, file);
      applyImageUpdate('portfolio', index, res.image);
      toastSuccess('Image uploaded');
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleCertUpload = async (index: number, certId: number, file: File) => {
    if (!unit_name) return;
    const key = `cert:${index}`;
    setUploadingIdx(key);
    try {
      const res = await mediaApi.uploadCertificationImage(unit_name, certId, file);
      applyImageUpdate('cert', index, res.image);
      toastSuccess('Image uploaded');
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setUploadingIdx(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const summary = parsed && !parseError ? getSummary(parsed) : null;

  const portfolioItems = parsed?.portfolio_items ?? [];
  const certItems = parsed?.certifications ?? [];
  const hasImageItems = portfolioItems.length > 0 || certItems.length > 0;
  const existingPortfolio = portfolioItems.filter(p => p._id);
  const existingCerts = certItems.filter(c => c._id);
  const newItemsCount =
    (portfolioItems.length - existingPortfolio.length) +
    (certItems.length - existingCerts.length);

  if (unitLoading && !unit) {
    return (
      <DashboardLayout full>
        <PageSpinner />
      </DashboardLayout>
    );
  }

  if (!unit) {
    return (
      <DashboardLayout full>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-slate-500 dark:text-slate-500">PWBUnit not found.</p>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-primary-500 hover:underline">
            Go to dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const editorHeight = 'max(350px, calc(100vh - 310px))';

  return (
    <DashboardLayout full>
      <div className="flex-1 flex flex-col min-h-0">
        {/* ── Sticky header ── */}
        <div className="shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBack}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Edit JSON</h1>
              <p className="text-xs text-slate-500 dark:text-slate-500 font-mono truncate">/{unit.unit_name}</p>
            </div>
          </div>
          <Button
            type="button"
            disabled={!parsed || !!parseError}
            icon={<FileJson className="h-4 w-4" />}
            onClick={handleApply}
          >
            Apply changes
          </Button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-3">

            {/* Notice */}
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
              <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Photo/image fields are read-only in JSON.</strong>{' '}
                Use the <strong>Images</strong> section below to upload images.
              </p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg">
              <div className="flex items-center gap-0.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleFormat}
                  title="Format / pretty-print"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 active:scale-[0.97] transition-all duration-150"
                >
                  <Braces className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Format</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  title="Reset to current form values"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 active:scale-[0.97] transition-all duration-150"
                >
                  <RefreshCcw className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 active:scale-[0.97] transition-all duration-150"
                >
                  {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-green-500" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
                  <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  title="Copy blank template to clipboard"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 active:scale-[0.97] transition-all duration-150"
                >
                  {templateCopied ? <Check className="h-3.5 w-3.5 shrink-0 text-green-500" /> : <ClipboardCopy className="h-3.5 w-3.5 shrink-0" />}
                  <span className="hidden sm:inline">{templateCopied ? 'Copied!' : 'Copy template'}</span>
                </button>
              </div>

              {/* Live status badge */}
              {parseError ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 shrink-0">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>Invalid</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/40 shrink-0">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>Valid</span>
                </span>
              )}
            </div>

            {/* Editor */}
            <JsonCodeEditor value={text} onChange={handleChange} height={editorHeight} />

            {/* Section summary */}
            {summary && summary.length > 0 && (
              <div className="flex flex-wrap gap-1.5 animate-scale-in">
                {summary.map(s => (
                  <span
                    key={s}
                    className="text-xs px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Parse error */}
            {parseError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg animate-scale-in">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs font-mono text-red-700 dark:text-red-400 break-all">{parseError}</p>
              </div>
            )}

            {/* Images section */}
            {hasImageItems && (
              <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setImagesOpen(o => !o)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Images
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      {portfolioItems.length + certItems.length} item{portfolioItems.length + certItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {imagesOpen
                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />
                  }
                </button>

                {imagesOpen && (
                  <div className="px-4 pb-4 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {portfolioItems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wide mt-3 mb-1">
                          Portfolio items
                        </p>
                        {portfolioItems.map((item, i) => (
                          <ImageRow
                            key={i}
                            label={item.title || `Item ${i + 1}`}
                            imageUrl={item._image ?? null}
                            isNew={!item._id}
                            uploading={uploadingIdx === `portfolio:${i}`}
                            onUpload={f => item._id && handlePortfolioUpload(i, item._id, f)}
                          />
                        ))}
                      </div>
                    )}
                    {certItems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wide mt-3 mb-1">
                          Certifications
                        </p>
                        {certItems.map((cert, i) => (
                          <ImageRow
                            key={i}
                            label={cert.name || `Cert ${i + 1}`}
                            imageUrl={cert._image ?? null}
                            isNew={!cert._id}
                            uploading={uploadingIdx === `cert:${i}`}
                            onUpload={f => cert._id && handleCertUpload(i, cert._id, f)}
                          />
                        ))}
                      </div>
                    )}
                    {newItemsCount > 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-600 pt-3">
                        {newItemsCount} new item{newItemsCount !== 1 ? 's' : ''} — apply changes first to enable image upload.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom padding */}
            <div className="pb-4" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
