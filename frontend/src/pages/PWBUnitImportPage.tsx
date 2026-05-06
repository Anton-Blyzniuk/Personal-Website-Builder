import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, FileJson, CheckCircle, AlertCircle, ChevronRight, Upload } from 'lucide-react';
import { pwbUnitsApi } from '../api/pwbunits';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { PhotosSection } from '../components/pwbunit/sections/PhotosSection';
import type { PWBUnitCreatePayload } from '../types/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['unit_name', 'first_name', 'last_name', 'headline', 'email'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPayload(raw: any): PWBUnitCreatePayload {
  const payload: PWBUnitCreatePayload = {
    unit_name:  String(raw.unit_name  ?? ''),
    first_name: String(raw.first_name ?? ''),
    last_name:  String(raw.last_name  ?? ''),
    headline:   String(raw.headline   ?? ''),
    email:      String(raw.email      ?? ''),
    phone:      raw.phone    ? String(raw.phone)    : null,
    location:   raw.location ? String(raw.location) : null,
    about:      raw.about    ? String(raw.about)    : null,
  };

  if (Array.isArray(raw.skills)) {
    payload.skills = raw.skills.map((s: any, i: number) => ({
      name:     String(s.name ?? ''),
      category: s.category ? String(s.category) : null,
      level:    s.level ?? null,
      order:    s.order ?? i,
    }));
  }
  if (Array.isArray(raw.links)) {
    payload.links = raw.links.map((l: any) => ({
      name: String(l.name ?? ''),
      url:  String(l.url  ?? ''),
    }));
  }
  if (Array.isArray(raw.languages)) {
    payload.languages = raw.languages.map((l: any) => ({
      name:  String(l.name  ?? ''),
      level: l.level ?? 'Native',
    }));
  }
  if (Array.isArray(raw.experience_units)) {
    payload.experience_units = raw.experience_units.map((e: any, i: number) => ({
      title:        String(e.title        ?? ''),
      organization: e.organization ? String(e.organization) : null,
      location:     e.location     ? String(e.location)     : null,
      description:  e.description  ? String(e.description)  : null,
      from_date:    String(e.from_date ?? ''),
      to_date:      e.to_date ? String(e.to_date) : null,
      order:        e.order ?? i,
    }));
  }
  if (Array.isArray(raw.education_units)) {
    payload.education_units = raw.education_units.map((e: any, i: number) => ({
      institution:   String(e.institution   ?? ''),
      degree:        e.degree        ? String(e.degree)        : null,
      field_of_study: e.field_of_study ? String(e.field_of_study) : null,
      location:      e.location      ? String(e.location)      : null,
      from_date:     String(e.from_date ?? ''),
      to_date:       e.to_date ? String(e.to_date) : null,
      description:   e.description ? String(e.description) : null,
      order:         e.order ?? i,
    }));
  }
  if (Array.isArray(raw.portfolio_items)) {
    payload.portfolio_items = raw.portfolio_items.map((p: any, i: number) => ({
      title:       String(p.title ?? ''),
      category:    p.category    ? String(p.category)    : null,
      description: p.description ? String(p.description) : null,
      date:        p.date        ? String(p.date)        : null,
      order:       p.order ?? i,
      links: Array.isArray(p.links) ? p.links.map((l: any) => ({
        name: String(l.name ?? ''),
        url:  String(l.url  ?? ''),
      })) : [],
    }));
  }
  if (Array.isArray(raw.certifications)) {
    payload.certifications = raw.certifications.map((c: any, i: number) => ({
      name:                 String(c.name                 ?? ''),
      issuing_organization: String(c.issuing_organization ?? ''),
      issue_date:    c.issue_date    ? String(c.issue_date)    : null,
      expiry_date:   c.expiry_date   ? String(c.expiry_date)   : null,
      credential_id: c.credential_id ? String(c.credential_id) : null,
      credential_url: c.credential_url ? String(c.credential_url) : null,
      order:         c.order ?? i,
    }));
  }
  if (Array.isArray(raw.awards)) {
    payload.awards = raw.awards.map((a: any, i: number) => ({
      title:       String(a.title ?? ''),
      issuer:      a.issuer      ? String(a.issuer)      : null,
      date:        a.date        ? String(a.date)        : null,
      description: a.description ? String(a.description) : null,
      order:       a.order ?? i,
    }));
  }
  if (Array.isArray(raw.custom_sections)) {
    payload.custom_sections = raw.custom_sections.map((cs: any, i: number) => ({
      title: String(cs.title ?? ''),
      order: cs.order ?? i,
      items: Array.isArray(cs.items) ? cs.items.map((item: any, ii: number) => ({
        title:       String(item.title ?? ''),
        subtitle:    item.subtitle    ? String(item.subtitle)    : null,
        from_date:   item.from_date   ? String(item.from_date)   : null,
        to_date:     item.to_date     ? String(item.to_date)     : null,
        description: item.description ? String(item.description) : null,
        url:         item.url         ? String(item.url)         : null,
        order:       item.order ?? ii,
      })) : [],
    }));
  }

  return payload;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countSections(raw: any): string[] {
  const parts: string[] = [];
  if (Array.isArray(raw.skills)           && raw.skills.length)           parts.push(`${raw.skills.length} skill(s)`);
  if (Array.isArray(raw.experience_units) && raw.experience_units.length) parts.push(`${raw.experience_units.length} experience entry/entries`);
  if (Array.isArray(raw.education_units)  && raw.education_units.length)  parts.push(`${raw.education_units.length} education entry/entries`);
  if (Array.isArray(raw.portfolio_items)  && raw.portfolio_items.length)  parts.push(`${raw.portfolio_items.length} portfolio item(s)`);
  if (Array.isArray(raw.certifications)   && raw.certifications.length)   parts.push(`${raw.certifications.length} certification(s)`);
  if (Array.isArray(raw.awards)           && raw.awards.length)           parts.push(`${raw.awards.length} award(s)`);
  if (Array.isArray(raw.languages)        && raw.languages.length)        parts.push(`${raw.languages.length} language(s)`);
  if (Array.isArray(raw.links)            && raw.links.length)            parts.push(`${raw.links.length} link(s)`);
  if (Array.isArray(raw.custom_sections)  && raw.custom_sections.length)  parts.push(`${raw.custom_sections.length} custom section(s)`);
  return parts;
}

const EXAMPLE_JSON = JSON.stringify({
  unit_name: 'jane-doe',
  first_name: 'Jane',
  last_name: 'Doe',
  headline: 'Senior Software Engineer',
  email: 'jane@example.com',
  phone: '+1 234 567 8900',
  location: 'New York, NY',
  about: 'Experienced engineer with 10 years in backend systems.',
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
  ],
  experience_units: [
    {
      title: 'Senior Software Engineer',
      organization: 'Acme Corp',
      location: 'New York, NY',
      description: 'Built scalable distributed systems serving millions of users.',
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
  portfolio_items: [],
  certifications: [],
  awards: [],
  custom_sections: [],
}, null, 2);

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PWBUnitImportPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [json, setJson] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsed, setParsed] = useState<{ payload: PWBUnitCreatePayload; raw: any; photosCount: number } | null>(null);
  const [createdUnitName, setCreatedUnitName] = useState<string | null>(null);

  const validate = (text: string) => {
    setJson(text);
    if (!text.trim()) { setParsed(null); setParseError(null); return; }
    try {
      const raw = JSON.parse(text);
      for (const field of REQUIRED_FIELDS) {
        if (!raw[field]) throw new Error(`Missing required field: "${field}"`);
      }
      const payload = buildPayload(raw);
      const photosCount = Array.isArray(raw.photos) ? raw.photos.length : 0;
      setParsed({ payload, raw, photosCount });
      setParseError(null);
    } catch (err) {
      setParsed(null);
      setParseError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const create = useMutation({
    mutationFn: pwbUnitsApi.create,
    onSuccess: (unit) => {
      success('PWBUnit created successfully');
      setCreatedUnitName(unit.unit_name);
    },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  // ── Phase 2: after creation ──────────────────────────────────────────────

  if (createdUnitName) {
    return (
      <DashboardLayout>
        <div className="page-enter max-w-3xl">
          {/* Success banner */}
          <div className="flex items-start gap-4 p-5 mb-8 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl animate-scale-in">
            <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-800 dark:text-green-300">PWBUnit created!</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">
                <span className="font-mono">/{createdUnitName}</span> is ready. Upload photos below, then continue to the full editor.
              </p>
            </div>
            <Link
              to={`/dashboard/pwbunits/${createdUnitName}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors shrink-0"
            >
              Full editor
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Photo upload */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-primary-600/10 flex items-center justify-center border border-primary-500/20">
                <Upload className="h-4 w-4 text-primary-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Photos & Media</h2>
                <p className="text-xs text-slate-500 dark:text-slate-500">Upload photos and a PDF resume for your new PWBUnit</p>
              </div>
            </div>
            <PhotosSection unitName={createdUnitName} pdfResume={null} />
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              to={`/dashboard/pwbunits/${createdUnitName}/edit`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-500 hover:shadow-glow-sm transition-all duration-200 active:scale-[0.97]"
            >
              Continue to full editor
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Phase 1: paste JSON ──────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="page-enter max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-xl bg-primary-600/10 flex items-center justify-center border border-primary-500/20">
            <FileJson className="h-4 w-4 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Import from JSON</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-500 mb-8 ml-12">
          Paste your CV data as JSON. Required fields: <code className="text-primary-500 text-xs">unit_name</code>,{' '}
          <code className="text-primary-500 text-xs">first_name</code>, <code className="text-primary-500 text-xs">last_name</code>,{' '}
          <code className="text-primary-500 text-xs">headline</code>, <code className="text-primary-500 text-xs">email</code>.
        </p>

        {/* Textarea */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">JSON</span>
            <button
              type="button"
              onClick={() => validate(EXAMPLE_JSON)}
              className="text-xs text-primary-500 hover:text-primary-400 font-medium transition-colors"
            >
              Load example
            </button>
          </div>
          <textarea
            value={json}
            onChange={e => validate(e.target.value)}
            placeholder={'{\n  "unit_name": "your-name",\n  "first_name": "Jane",\n  ...\n}'}
            spellCheck={false}
            className="w-full h-72 p-4 text-xs font-mono bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none resize-none"
          />
        </div>

        {/* Parse error */}
        {parseError && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg animate-scale-in">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{parseError}</p>
          </div>
        )}

        {/* Preview */}
        {parsed && !parseError && (
          <div className="mb-6 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden animate-scale-in">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Valid JSON — ready to import</span>
            </div>
            <div className="px-4 py-4 space-y-2">
              <div className="flex gap-3 items-baseline">
                <span className="text-xs text-slate-400 w-24 shrink-0">Name</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {parsed.payload.first_name} {parsed.payload.last_name}
                </span>
              </div>
              <div className="flex gap-3 items-baseline">
                <span className="text-xs text-slate-400 w-24 shrink-0">Unit name</span>
                <span className="text-sm font-mono text-slate-700 dark:text-slate-300">/{parsed.payload.unit_name}</span>
              </div>
              <div className="flex gap-3 items-baseline">
                <span className="text-xs text-slate-400 w-24 shrink-0">Headline</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{parsed.payload.headline}</span>
              </div>
              {countSections(parsed.raw).length > 0 && (
                <div className="flex gap-3 items-start">
                  <span className="text-xs text-slate-400 w-24 shrink-0 pt-0.5">Sections</span>
                  <div className="flex flex-wrap gap-1.5">
                    {countSections(parsed.raw).map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {parsed.photosCount > 0 && (
                <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {parsed.photosCount} photo(s) detected in JSON — photos can't be imported from URLs.
                    You'll be able to upload them on the next step.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={() => navigate('/dashboard/pwbunits/new')}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!parsed || !!parseError}
            loading={create.isPending}
            icon={<FileJson className="h-4 w-4" />}
            onClick={() => parsed && create.mutate(parsed.payload)}
          >
            Create PWBUnit
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
