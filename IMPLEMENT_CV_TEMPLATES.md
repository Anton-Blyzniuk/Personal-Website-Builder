# CV Templates Feature — Implementation Spec

## Overview

Add CV template selection to PWBUnits. Each PWBUnit can have one of three templates assigned. A public shareable page renders the PWBUnit data as a styled CV using the selected template. Users share the link; anyone with the link sees the CV — no login required.

---

## Stack Context

- **Frontend:** React 18 + TypeScript + Vite + React Router DOM v6 + Zustand + TanStack React Query v5 + Tailwind CSS + React Hook Form + Zod + Lucide React + Axios
- **Backend:** Django + Django REST Framework + PostgreSQL + Cloudinary + JWT auth
- **Existing public endpoint:** `GET /api/v1/pwbunits/<unit_name>/` — already `AllowAny`, returns full PWBUnit with all nested data
- **Existing auth endpoint pattern:** JWT Bearer tokens, stored in Zustand `authStore`

---

## 1. Backend Changes

### 1.1 Add `template` field to PWBUnit model

**File:** `backend/pwb/models.py`

Add to `PWBUnit` class:

```python
class PWBUnit(models.Model):
    TEMPLATE_CHOICES = [
        ('classic', 'Classic'),
        ('modern', 'Modern'),
        ('minimal', 'Minimal'),
    ]

    # ... existing fields ...

    template = models.CharField(
        max_length=20,
        choices=TEMPLATE_CHOICES,
        default='classic',
    )
```

### 1.2 Update serializers

**File:** `backend/pwb/serializers.py`

Add `template` to every serializer that includes PWBUnit fields:

- `PWBUnitSerializer` — add `template` to `fields`
- `PWBUnitCreateSerializer` — add `template` to `fields` (optional field, default applies)
- `PWBUnitUpdateSerializer` — add `template` to `fields`
- `PWBUnitListSerializer` — add `template` to `fields`

No custom validation needed — DRF validates `choices` automatically.

### 1.3 Create and run migration

```bash
python manage.py makemigrations pwb
python manage.py migrate
```

Migration will add nullable-with-default column — safe for existing rows (they get `'classic'`).

---

## 2. Frontend Changes

### 2.1 Update TypeScript types

**File:** `frontend/src/types/api.ts`

Add to `PWBUnit` interface:

```typescript
template: 'classic' | 'modern' | 'minimal';
```

Add to `PWBUnitCreatePayload` and `PWBUnitUpdatePayload` interfaces:

```typescript
template?: 'classic' | 'modern' | 'minimal';
```

### 2.2 Add route to App.tsx

**File:** `frontend/src/App.tsx`

Add one public route (outside the auth guard, alongside `/`, `/login`, `/register`):

```tsx
import CVPage from './pages/CVPage';

// Inside <Routes>:
<Route path="/cv/:unitName" element={<CVPage />} />
```

No layout wrapper — `CVPage` is fully standalone (no nav, no sidebar).

### 2.3 Template selection UI in PWBUnitEditPage

**File:** `frontend/src/pages/PWBUnitEditPage.tsx`

Add a "Template" tab or a dedicated section in the existing tabbed form. Follow the same tab pattern already used in `PWBUnitForm`.

Inside `PWBUnitForm.tsx` (or a new `TemplateSection.tsx` under `sections/`), render three clickable cards — one per template. Selected card gets a highlight border. Persist choice via React Hook Form field `template`.

**TemplateSection component** — `frontend/src/components/pwbunit/sections/TemplateSection.tsx`:

```tsx
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';

const TEMPLATES = [
  {
    id: 'classic' as const,
    name: 'Classic',
    description: 'Traditional two-column layout. Sidebar for skills and education, main column for experience.',
    preview: 'Two columns, professional, clean typography',
  },
  {
    id: 'modern' as const,
    name: 'Modern',
    description: 'Bold header with accent color. Card-based sections. Visual hierarchy.',
    preview: 'Bold, colorful header, cards layout',
  },
  {
    id: 'minimal' as const,
    name: 'Minimal',
    description: 'Typography-first, monochrome. Maximum readability, zero decoration.',
    preview: 'Clean, text-only, lots of whitespace',
  },
];

interface Props {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export default function TemplateSection({ watch, setValue }: Props) {
  const current = watch('template') ?? 'classic';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setValue('template', t.id, { shouldDirty: true })}
          className={`rounded-xl border-2 p-4 text-left transition-all ${
            current === t.id
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`}
        >
          <div className="font-semibold text-gray-900 dark:text-white mb-1">{t.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t.description}</div>
        </button>
      ))}
    </div>
  );
}
```

Add `template` field to the React Hook Form default values in `PWBUnitForm.tsx`:

```tsx
const form = useForm({
  defaultValues: {
    // ... existing defaults ...
    template: unit?.template ?? 'classic',
  },
});
```

Include `template` when calling `onSave` (it already passes the full form values — just ensure it's in `PWBUnitUpdatePayload`).

### 2.4 Share button on Dashboard cards

**File:** `frontend/src/pages/DashboardPage.tsx`

On each PWBUnit card, add a "Share CV" button/icon next to the existing Edit/Delete actions. On click, copy `window.location.origin + '/cv/' + unit.unit_name` to clipboard and show a toast "Link copied!".

```tsx
// Inside card actions:
<button
  onClick={() => {
    navigator.clipboard.writeText(`${window.location.origin}/cv/${unit.unit_name}`);
    toast({ title: 'Link copied!' });
  }}
  title="Copy CV link"
>
  <Share2 className="w-4 h-4" />
</button>
```

Import `Share2` from `lucide-react`.

---

## 3. New Files to Create

### 3.1 CV Page — `frontend/src/pages/CVPage.tsx`

This is the public shareable page. No auth required.

```tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPWBUnit } from '../api/pwbunits';
import ClassicTemplate from '../components/cv-templates/ClassicTemplate';
import ModernTemplate from '../components/cv-templates/ModernTemplate';
import MinimalTemplate from '../components/cv-templates/MinimalTemplate';
import Spinner from '../components/ui/Spinner';
import type { PWBUnit } from '../types/api';

const TEMPLATE_MAP = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
} as const;

export default function CVPage() {
  const { unitName } = useParams<{ unitName: string }>();

  const { data: unit, isLoading, isError } = useQuery({
    queryKey: ['pwbunit-public', unitName],
    queryFn: () => getPWBUnit(unitName!),
    enabled: !!unitName,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !unit) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Profile not found.
      </div>
    );
  }

  const Template = TEMPLATE_MAP[unit.template ?? 'classic'];
  return <Template unit={unit} />;
}
```

`getPWBUnit` already exists in `frontend/src/api/pwbunits.ts` and hits the public endpoint — no changes needed there.

---

### 3.2 Template Components

Create folder: `frontend/src/components/cv-templates/`

All three templates receive one prop:

```tsx
interface TemplateProps {
  unit: PWBUnit; // from frontend/src/types/api.ts
}
```

Each template is a standalone React component. It must be fully self-contained — no shared layout, no navigation, no sidebar from the app. Use only Tailwind classes for styling.

---

#### 3.2.1 ClassicTemplate — `frontend/src/components/cv-templates/ClassicTemplate.tsx`

**Layout:** Two-column. Left sidebar (~30% width) holds contact info, skills, languages, education summary. Right main column (~70%) holds experience, portfolio, certifications, awards, custom sections.

**Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Full-width. Name (large), Headline. Background: dark.  │
├──────────────┬──────────────────────────────────────────────────┤
│  SIDEBAR     │  MAIN                                            │
│  Contact     │  About (if present)                             │
│  Skills      │  Experience (each job as card)                  │
│  Languages   │  Portfolio (each project)                       │
│  Education   │  Certifications                                 │
│  Links       │  Awards                                         │
│              │  Custom sections                                │
└──────────────┴──────────────────────────────────────────────────┘
```

**Visual details:**
- Header bg: `bg-gray-900 text-white`, padding `py-10 px-8`
- Main photo (if exists): circular avatar in header, top-right
- Sidebar bg: `bg-gray-50` (light mode) / `bg-gray-800` (dark mode)
- Section headings: uppercase, small tracking, border-bottom, accent color `text-blue-600`
- Font: system sans-serif via Tailwind defaults
- Page max-width: `max-w-4xl mx-auto`

**Date formatting:** Helper function `formatDate(dateStr: string | null): string` — render as `MMM YYYY` or `Present` if null/empty.

**Conditional rendering:** Every section only renders if it has data. Skills with `category` group by category. Experience items sorted by `order`. Same for all arrays.

---

#### 3.2.2 ModernTemplate — `frontend/src/components/cv-templates/ModernTemplate.tsx`

**Layout:** Single column with full-width cards. Bold colorful header.

**Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: gradient bg (blue-600 → purple-600). Name huge.        │
│          Headline. Photo circular right side.                   │
│          Contact row: icon + value pairs inline.                │
├─────────────────────────────────────────────────────────────────┤
│  ABOUT — full-width card with left colored border               │
├─────────────────────────────────────────────────────────────────┤
│  EXPERIENCE — timeline style (vertical line + dots)             │
├─────────────────────────────────────────────────────────────────┤
│  SKILLS — tag cloud, color-coded by category                    │
├─────────────────────────────────────────────────────────────────┤
│  EDUCATION — cards with institution logo placeholder            │
├─────────────────────────────────────────────────────────────────┤
│  PORTFOLIO — 2-col grid of project cards                        │
├─────────────────────────────────────────────────────────────────┤
│  CERTIFICATIONS, AWARDS, LANGUAGES — 3-col grid                 │
├─────────────────────────────────────────────────────────────────┤
│  CUSTOM SECTIONS — accordion-style                              │
└─────────────────────────────────────────────────────────────────┘
```

**Visual details:**
- Header: `bg-gradient-to-r from-blue-600 to-purple-600 text-white`
- Cards: `bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700`
- Section titles: large, bold, with colored left-border `border-l-4 border-blue-500 pl-3`
- Skill tags: `rounded-full px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100`
- Timeline dots: `w-3 h-3 rounded-full bg-blue-500`
- Page max-width: `max-w-3xl mx-auto`
- White background page: `bg-gray-50 dark:bg-gray-900 min-h-screen`

---

#### 3.2.3 MinimalTemplate — `frontend/src/components/cv-templates/MinimalTemplate.tsx`

**Layout:** Single centered column, maximum width `max-w-2xl`. No colors, no shadows. Pure typography.

**Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  NAME — very large serif-like font (font-bold text-4xl)         │
│  Headline — gray, text-lg                                       │
│  Contact line — inline, separator dots                          │
│  ─────────────────────────────── (thin hr)                      │
│  ABOUT                                                          │
│  ─────────────────────────────── (thin hr)                      │
│  EXPERIENCE                                                     │
│  Job Title @ Org           Location · Date range                │
│  Description                                                    │
│  ─────────────────────────────── (thin hr)                      │
│  EDUCATION                                                      │
│  ... same pattern ...                                           │
│  ─────────────────────────────── (thin hr)                      │
│  SKILLS                                                         │
│  Category: Skill1, Skill2, Skill3                               │
│  ─────────────────────────────── (thin hr)                      │
│  LANGUAGES, CERTIFICATIONS, AWARDS, PORTFOLIO, CUSTOM           │
└─────────────────────────────────────────────────────────────────┘
```

**Visual details:**
- Background: `bg-white dark:bg-gray-950`
- Text: `text-gray-900 dark:text-gray-100`
- Section headings: `text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3`
- Dividers: `<hr className="border-gray-200 dark:border-gray-800 my-6" />`
- No card borders, no shadows, no colors except gray scale
- Links: `text-gray-900 dark:text-gray-100 underline underline-offset-2`
- Padding: `py-12 px-8`

---

## 4. Data Flow

```
User edits PWBUnit → selects template → saves → backend stores template field

Anyone opens /cv/:unitName →
  CVPage fetches GET /api/v1/pwbunits/<unitName>/ (public, no auth) →
  Picks template component based on unit.template →
  Renders CV
```

---

## 5. Print / PDF Consideration

Add print styles to `index.css` (global):

```css
@media print {
  /* Hide browser chrome */
  nav, header, footer, button, .no-print { display: none !important; }
  body { background: white; }
  .cv-page { padding: 0; margin: 0; max-width: 100%; }
}
```

Each template root element should have class `cv-page`.

Users can print-to-PDF using browser `Ctrl+P / Cmd+P`. No special library needed.

---

## 6. Exact File List

**New files:**
- `frontend/src/pages/CVPage.tsx`
- `frontend/src/components/cv-templates/ClassicTemplate.tsx`
- `frontend/src/components/cv-templates/ModernTemplate.tsx`
- `frontend/src/components/cv-templates/MinimalTemplate.tsx`
- `frontend/src/components/pwbunit/sections/TemplateSection.tsx`

**Modified files:**
- `backend/pwb/models.py` — add `template` field + `TEMPLATE_CHOICES`
- `backend/pwb/serializers.py` — add `template` to all PWBUnit serializers
- `frontend/src/types/api.ts` — add `template` to `PWBUnit`, payloads
- `frontend/src/App.tsx` — add `/cv/:unitName` route
- `frontend/src/pages/DashboardPage.tsx` — add share button on cards
- `frontend/src/components/pwbunit/PWBUnitForm.tsx` — add Template tab/section + default value
- `frontend/src/index.css` — add `@media print` styles

**New migration file** (auto-generated):
- `backend/pwb/migrations/000X_pwbunit_add_template.py`

---

## 7. Implementation Rules

1. **No new dependencies.** Use only packages already in `package.json` and `requirements.txt`.
2. **Follow existing patterns exactly.** Tab naming, component structure, import style, Tailwind class patterns — match what exists in `PWBUnitForm.tsx` and other section components.
3. **Every section is conditional.** If `unit.skills.length === 0`, skip the skills section entirely. Same for all arrays.
4. **Sort by `order` field.** All nested arrays (`skills`, `experience`, `education`, etc.) have an `order: number` field. Sort ascending before rendering.
5. **Photo:** `unit.photos` is an array. The main photo has `is_main: true`. Use `unit.photos.find(p => p.is_main)?.image_url` for the avatar. Fall back to first photo if no main. Fall back to name initial if no photos.
6. **Links:** `unit.links` is an array of `{ name, url }`. Render as clickable links with `target="_blank" rel="noopener noreferrer"`.
7. **Dates:** Many date fields are nullable. Always guard: `experience.start_date ?? ''`, render `Present` for null end dates.
8. **Dark mode:** Tailwind dark mode is class-based (check `tailwind.config.js` for `darkMode: 'class'`). Use `dark:` variants throughout CV templates so they respect the user's theme preference.
9. **`getPWBUnit` API call:** Already exists in `frontend/src/api/pwbunits.ts`. Use it as-is in `CVPage.tsx`.
10. **No auth on CVPage.** Do not wrap in any auth guard. The page must work for unauthenticated visitors.
11. **Toast for share button:** Use the existing `useToast` hook from `frontend/src/hooks/useToast.tsx`.
12. **Template default:** Backend default is `'classic'`. Frontend default value in form is `unit?.template ?? 'classic'`. `CVPage` falls back to `'classic'` if `unit.template` is undefined.
13. **Migration safety:** The `template` field has `default='classic'` at DB level — existing rows are safe, no data migration needed.

---

## 8. Verification Checklist

After implementation, verify:

- [ ] `GET /api/v1/pwbunits/<unit_name>/` response includes `template` field
- [ ] `PATCH /api/v1/pwbunits/<unit_name>/` accepts `{ "template": "modern" }` and saves it
- [ ] `/cv/<unit_name>` route renders without login
- [ ] Switching templates in edit form and saving persists the choice
- [ ] All three templates render with real PWBUnit data (test with a unit that has all sections filled)
- [ ] Templates are responsive on mobile (stack columns, reduce padding)
- [ ] Print-to-PDF via browser hides nav/buttons and shows only CV content
- [ ] Share button copies correct URL and shows toast
- [ ] Dark mode works in all three templates
- [ ] Empty sections are not rendered (test with a PWBUnit with minimal data)
