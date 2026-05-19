import { useState, useEffect, useMemo, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json as jsonLang, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import { githubLight, githubDarkInit } from '@uiw/codemirror-theme-github';
import { AlertCircle, CheckCircle2, Info, FileJson, Copy, RefreshCcw, Braces, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { PWBUnit } from '../../types/api';
import type { PWBUnitFormData } from './PWBUnitForm';

// ─── Theme (module-level, created once) ───────────────────────────────────────

const darkTheme = githubDarkInit({
  settings: {
    background: '#0f172a',
    gutterBackground: '#1e293b',
    gutterBorder: 'transparent',
    gutterForeground: '#475569',
    lineHighlight: 'rgba(255,255,255,0.025)',
    selection: 'rgba(148,163,184,0.2)',
    selectionMatch: 'rgba(148,163,184,0.12)',
    caret: '#94a3b8',
  },
});

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark')),
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function getSummary(data: PWBUnitFormData): string[] {
  const parts: string[] = [];
  const n = (arr?: unknown[]) => arr?.length ?? 0;
  const p = (count: number, s: string, pl: string) => `${count} ${count === 1 ? s : pl}`;
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

// ─── Component ────────────────────────────────────────────────────────────────

interface JSONEditorModalProps {
  open: boolean;
  onClose: () => void;
  unit: PWBUnit;
  formData: PWBUnitFormData;
  onApply: (data: PWBUnitFormData) => void;
}

export function JSONEditorModal({ open, onClose, unit, formData, onApply }: JSONEditorModalProps) {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<PWBUnitFormData | null>(null);
  const [copied, setCopied] = useState(false);
  const dark = useDarkMode();

  const extensions = useMemo(
    () => [jsonLang(), linter(jsonParseLinter()), lintGutter()],
    [],
  );

  useEffect(() => {
    if (open) {
      const initial = toJson(formData, unit);
      setText(initial);
      setParsed(formData);
      setParseError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const validate = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setParsed(null);
        setParseError('JSON cannot be empty');
        return;
      }
      try {
        const raw = JSON.parse(value);
        setParsed(fromJson(raw, formData));
        setParseError(null);
      } catch (err) {
        setParsed(null);
        setParseError(err instanceof Error ? err.message : 'Invalid JSON');
      }
    },
    [formData],
  );

  const handleChange = useCallback(
    (value: string) => {
      setText(value);
      validate(value);
    },
    [validate],
  );

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(text), null, 2);
      setText(formatted);
      validate(formatted);
    } catch {
      // already showing error
    }
  };

  const handleReset = () => {
    const initial = toJson(formData, unit);
    setText(initial);
    validate(initial);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!parsed) return;
    onApply(parsed);
    onClose();
  };

  const summary = parsed && !parseError ? getSummary(parsed) : null;

  return (
    <Modal open={open} onClose={onClose} title="Edit JSON" size="lg">
      <div className="p-5 space-y-3">

        {/* Read-only images notice */}
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
          <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Photo and image fields are read-only</strong> — shown for reference but changes will
            be ignored. Use the <strong>Photos &amp; Media</strong> tab to manage images.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg">
          <div className="flex items-center gap-0.5">
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
              {copied ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
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

        {/* CodeMirror editor */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 text-xs">
          <div className="h-52 sm:h-80">
            <CodeMirror
              value={text}
              onChange={handleChange}
              theme={dark ? darkTheme : githubLight}
              extensions={extensions}
              height="100%"
              basicSetup={{ tabSize: 2 }}
            />
          </div>
        </div>

        {/* Live section summary (shown when valid) */}
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

        {/* Parse error detail */}
        {parseError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg animate-scale-in">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs font-mono text-red-700 dark:text-red-400 break-all">{parseError}</p>
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
