import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  ExternalLink, Search, Copy, Check, BookOpen, Zap, Key,
  Code2, Shield, Database, AlertCircle, ChevronRight, X, Bot,
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../lib/env';
import { CopyButton } from '../components/ui/CopyButton';

// ─── AI docs snapshot ────────────────────────────────────────────────────────

function buildAiDocs(base: string): string {
  return `# Personal Website Builder — REST API Reference
Base URL: ${base}/

## Authentication
Two methods, interchangeable on every protected endpoint.

### JWT
POST ${base}/token/  →  {"access":"<jwt>","refresh":"<jwt>"}
  body: {"email":"string","password":"string"}
  access lifetime: 15 min | refresh lifetime: 3 days
POST ${base}/token/refresh/  →  {"access":"<new_jwt>"}
  body: {"refresh":"<token>"}
Header on protected requests: Authorization: Bearer <access_token>

### API Key + Secret (both headers required, one alone → 401)
Generate: POST ${base}/user/api-key/ [JWT required]
Headers: X-Api-Key: <key>   X-Api-Secret: <secret>
Secret is shown ONLY at creation/rotation — store immediately.

## Errors
{"detail":"message"} | {"field":["error"]} | {"field":{"nested":["error"]}}
400 validation | 401 unauthenticated | 403 not owner | 404 not found | 409 conflict | 429 rate limit

## Pagination
List endpoints: {"count":N,"next":"url|null","previous":"url|null","results":[...]}
Default page_size=20, max 100 via ?page_size=N
/teammates/ returns a plain array (not paginated).

## Endpoints

### Health
GET ${base}/ping/  →  {"ping":"pong"}  [public]

### Registration & Tokens
POST ${base}/user/register/  [public, throttle 10/hr]
  body: {"email","password","first_name","last_name"}
  201: {"access":"jwt","refresh":"jwt"}

POST ${base}/token/  [public, throttle 20/hr]
  body: {"email","password"}  →  {"access":"jwt","refresh":"jwt"}

POST ${base}/token/refresh/
  body: {"refresh":"token"}  →  {"access":"jwt"}

### User Profile  [JWT/Key]
GET  ${base}/user/my-info/
  res: {email,first_name,last_name,is_staff,is_superuser,last_login,date_joined,profile_picture:url|null}

PATCH ${base}/user/my-info/  — multipart/form-data or JSON
  optional fields: first_name, last_name, profile_picture (file)
  res: user profile object

POST ${base}/user/change-password/
  body: {"current_password","new_password"}  →  {"details":"password changed."}

### API Credentials  [JWT/Key]
GET    ${base}/user/api-key/        →  {"key","created_at","is_active":true}  (404 if none)
POST   ${base}/user/api-key/        →  {"key","secret","created_at"}  (409 if already exists)
POST   ${base}/user/api-key/rotate/ →  {"key","secret","created_at"}  (new secret, old invalidated)
DELETE ${base}/user/api-key/        →  204

### PWBUnits
GET  ${base}/pwbunits/  [JWT/Key] — paginated own units
  results item: {unit_name,first_name,last_name,headline,email,phone:null,location:null}

POST ${base}/pwbunits/  [JWT/Key]
  required: unit_name (slug, globally unique), first_name, last_name, headline (max 120), email
  optional: phone, location, about
  optional arrays (each replaces entire relation when included):
    skills, links, languages, experience_units, education_units,
    portfolio_items, certifications, awards, custom_sections
  201: full PWBUnit object

GET  ${base}/pwbunits/<unit_name>/  [PUBLIC]  →  full PWBUnit object

PATCH ${base}/pwbunits/<unit_name>/  [owner]
  Partial update. Nested array key present → entire array replaced; absent → untouched.
  →  full PWBUnit object

DELETE ${base}/pwbunits/<unit_name>/  [owner]  →  204

### Media — Photos  [owner, multipart/form-data]
GET    ${base}/pwbunits/<n>/photos/                  →  [{id,image:url,is_main:bool}]
POST   ${base}/pwbunits/<n>/photos/                  fields: image(file), is_main(bool,opt)  →  201 photo obj
  Setting is_main=true auto-demotes previous main.
PATCH  ${base}/pwbunits/<n>/photos/<id>/             body: {"is_main":"true"}  →  photo obj
DELETE ${base}/pwbunits/<n>/photos/<id>/             →  204

### Media — PDF Resume  [owner, multipart/form-data, field: file, PDF only]
POST   ${base}/pwbunits/<n>/pdf-resume/  →  {"pdf_resume":"url"}  (fl_attachment flag for download)
DELETE ${base}/pwbunits/<n>/pdf-resume/  →  204

### Media — Education Unit Image  [owner, multipart/form-data, field: image]
POST   ${base}/pwbunits/<n>/education-units/<id>/image/  →  {"image":"url"}
DELETE ${base}/pwbunits/<n>/education-units/<id>/image/  →  204

### Media — Portfolio Item Image  [owner, multipart/form-data, field: image]
POST   ${base}/pwbunits/<n>/portfolio-items/<id>/image/  →  {"image":"url"}
DELETE ${base}/pwbunits/<n>/portfolio-items/<id>/image/  →  204

### Teammates  [public, not paginated]
GET ${base}/teammates/
  res: [{id,first_name,last_name,email,photo:url|null,project_roles:[{id,name}],links:[{id,name,link}]}]
GET ${base}/teammates/<id>/
  res: list shape + date_of_birth:date|null, story:str|null

## Write Schemas for PWBUnit Nested Arrays

SkillWrite:
  name:str, category:str|null, order:int
  level: "Beginner"|"Intermediate"|"Advanced"|"Expert"|null

LinkWrite:
  name:str, url:str

LanguageWrite:
  name:str
  level: "A1 Beginner"|"A2 Elementary"|"B1 Intermediate"|"B2 Upper-Intermediate"
        |"C1 Advanced"|"C2 Advanced Proficiency"|"Native"|"Bilingual"

ExperienceUnitWrite:
  title:str, organization:str|null, location:str|null, description:str|null
  from_date:YYYY-MM-DD, to_date:YYYY-MM-DD|null (null = present), order:int

EducationUnitWrite:
  institution:str, degree:str|null, field_of_study:str|null, location:str|null
  from_date:YYYY-MM-DD, to_date:YYYY-MM-DD|null, description:str|null, order:int
  (image managed separately via /education-units/<id>/image/)

PortfolioItemWrite:
  title:str, category:str|null, description:str|null, date:YYYY-MM-DD|null, order:int
  links:[LinkWrite]
  (image managed separately via /portfolio-items/<id>/image/)

CertificationWrite:
  name:str, issuing_organization:str
  issue_date:YYYY-MM-DD|null, expiry_date:YYYY-MM-DD|null (must be after issue_date)
  credential_id:str|null, credential_url:str|null, order:int

AwardWrite:
  title:str, issuer:str|null, date:YYYY-MM-DD|null, description:str|null, order:int

CustomSectionWrite:
  title:str, order:int
  items:[{title:str,subtitle:str|null,from_date:YYYY-MM-DD|null,to_date:YYYY-MM-DD|null,description:str|null,url:str|null,order:int}]

## Full PWBUnit Response Object
{
  unit_name, first_name, last_name, headline, email,
  phone:str|null, location:str|null, about:str|null, pdf_resume:str|null,
  photos:[{id,image,is_main}],
  skills, links, languages, experience_units, education_units,
  portfolio_items, certifications, awards, custom_sections
}
education_units and portfolio_items include {id,...writeFields,image:str|null}
experience_units include {id,...writeFields}

## Rate Limits (per anonymous IP)
POST /user/register/, POST /admin/register/ → 10/hour
POST /token/ → 20/hour
Authenticated endpoints: not throttled. Exceeded → 429 Too Many Requests.
`;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

type NavItem = { id: string; title: string; children?: NavItem[] };

const NAV: NavItem[] = [
  { id: 'introduction',    title: 'Introduction' },
  { id: 'quickstart',      title: 'Quick Start' },
  { id: 'authentication',  title: 'Authentication' },
  { id: 'errors',          title: 'Errors & Pagination' },
  {
    id: 'endpoints-header', title: 'Endpoints',
    children: [
      { id: 'ep-health',       title: 'Health' },
      { id: 'ep-tokens',       title: 'Tokens' },
      { id: 'ep-registration', title: 'Registration' },
      { id: 'ep-profile',      title: 'User Profile' },
      { id: 'ep-password',     title: 'Password' },
      { id: 'ep-credentials',  title: 'API Credentials' },
      { id: 'ep-pwbunits',     title: 'PWBUnits' },
      { id: 'ep-photos',       title: 'Photos' },
      { id: 'ep-pdf',          title: 'PDF Resume' },
      { id: 'ep-edu-image',    title: 'Education Images' },
      { id: 'ep-portfolio-image', title: 'Portfolio Images' },
      { id: 'ep-teammates',    title: 'Teammates' },
    ],
  },
  { id: 'schemas',     title: 'Data Schemas' },
  { id: 'rate-limits', title: 'Rate Limits' },
  { id: 'interactive', title: 'Interactive Docs' },
];

function flattenIds(nav: NavItem[]): string[] {
  return nav.flatMap(n => [n.id, ...(n.children ? flattenIds(n.children) : [])]);
}

function flattenAll(nav: NavItem[]): NavItem[] {
  return nav.flatMap(n => [n, ...(n.children ? flattenAll(n.children) : [])]);
}

// ─── Primitives ───────────────────────────────────────────────────────────────

type Lang = 'curl' | 'js' | 'python';


function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative">
      <pre className="bg-slate-900 dark:bg-slate-950 text-slate-300 rounded-xl p-4 pr-12 overflow-x-auto text-xs font-mono leading-relaxed border border-slate-700/50 dark:border-slate-800">
        <code>{children}</code>
      </pre>
      <CopyButton
        text={children}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-700/60 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-all duration-150 active:scale-90"
        iconClassName="h-3.5 w-3.5"
      />
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    POST:   'bg-blue-500/15   text-blue-400   border-blue-500/25',
    PATCH:  'bg-amber-500/15  text-amber-400  border-amber-500/25',
    DELETE: 'bg-red-500/15    text-red-400    border-red-500/25',
    PUT:    'bg-orange-500/15 text-orange-400 border-orange-500/25',
  };
  return (
    <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border shrink-0 ${colors[method] ?? colors.GET}`}>
      {method}
    </span>
  );
}

function AuthBadge({ type }: { type: 'public' | 'jwt' | 'owner' }) {
  const map = {
    public: { label: 'Public',     cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    jwt:    { label: 'JWT / Key',  cls: 'bg-primary-500/10 text-primary-400 border-primary-500/20' },
    owner:  { label: 'Owner only', cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  };
  const { label, cls } = map[type];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border shrink-0 ${cls}`}>{label}</span>
  );
}

function EndpointCard({
  method, path, description, auth, children,
}: {
  method: string; path: string; description: string;
  auth: 'public' | 'jwt' | 'owner';
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150 text-left"
      >
        <MethodBadge method={method} />
        <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 truncate">{path}</code>
        <span className="text-xs text-slate-500 dark:text-slate-500 hidden sm:block truncate max-w-[200px]">{description}</span>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <AuthBadge type={auth} />
          <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700/50 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
          {children}
        </div>
      )}
    </div>
  );
}

function ReqBlock({ children }: { children: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Request body</p>
      <CodeBlock>{children}</CodeBlock>
    </div>
  );
}

function ResBlock({ status, children }: { status: number; children: string }) {
  const color = status < 300 ? 'text-emerald-400' : 'text-red-400';
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">
        Response <span className={`font-bold ${color}`}>{status}</span>
      </p>
      <CodeBlock>{children}</CodeBlock>
    </div>
  );
}

function CodeTabs({ curl, js, python }: { curl: string; js: string; python: string }) {
  const [lang, setLang] = useState<Lang>('curl');
  const code = { curl, js, python }[lang];
  return (
    <div>
      <div className="flex gap-1 mb-2">
        {(['curl', 'js', 'python'] as Lang[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all duration-150 ${
              lang === l
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {l === 'js' ? 'JavaScript' : l}
          </button>
        ))}
      </div>
      <CodeBlock>{code}</CodeBlock>
    </div>
  );
}

function Section({ id, icon, title, children }: {
  id: string; icon: ReactNode; title: string; children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-xl bg-primary-600/10 dark:bg-primary-600/15 flex items-center justify-center border border-primary-500/20 shrink-0">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Sub({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 pt-2">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/60 uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activeId, query, onQuery, onNavigate }: {
  activeId: string; query: string;
  onQuery: (q: string) => void;
  onNavigate: (id: string) => void;
}) {
  const filtered = query.trim()
    ? flattenAll(NAV).filter(n => n.title.toLowerCase().includes(query.toLowerCase()))
    : null;

  const renderItem = (item: NavItem, depth = 0) => (
    <div key={item.id}>
      <button
        onClick={() => onNavigate(item.id)}
        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all duration-150 ${
          depth > 0 ? 'pl-5' : ''
        } ${
          activeId === item.id
            ? 'bg-primary-600/10 dark:bg-primary-600/15 text-primary-500 dark:text-primary-400 font-medium'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
        }`}
      >
        {depth > 0 && <span className="mr-1 opacity-30">›</span>}
        {item.title}
      </button>
      {!query && item.children?.map(c => renderItem(c, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Search docs…"
          className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
        />
        {query && (
          <button onClick={() => onQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <nav className="space-y-0.5">
        {(filtered ?? NAV).map(item => renderItem(item))}
      </nav>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DocsPage() {
  const { isAuthenticated } = useAuthStore();
  const [activeId, setActiveId]           = useState('introduction');
  const [query, setQuery]                 = useState('');
  const [mobileSidebarOpen, setMobile]    = useState(false);
  const [aiCopied, setAiCopied]           = useState(false);
  const BASE = `${API_BASE_URL}/api/v1`;

  const copyForAi = () => {
    navigator.clipboard.writeText(buildAiDocs(BASE)).then(() => {
      setAiCopied(true);
      setTimeout(() => setAiCopied(false), 2500);
    });
  };

  useEffect(() => {
    const ids = flattenIds(NAV);
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveId(entry.target.id); break; }
        }
      },
      { rootMargin: '-8% 0% -80% 0%', threshold: 0 },
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
    setMobile(false);
    setQuery('');
  };

  // When inside DashboardLayout the scroll container is <main> (overflow-y-auto)
  // and there is no sticky top-bar on desktop, so sticky starts at top-0.
  // When inside PublicLayout the whole page scrolls and the header is ~68px tall.
  const sidebarSticky = isAuthenticated
    ? 'sticky top-0 max-h-screen overflow-y-auto py-8 scrollbar-none'
    : 'sticky top-[var(--header-height)] h-[calc(100vh-var(--header-height))] overflow-y-auto py-8 scrollbar-none';
  const mobileBarTop = isAuthenticated ? 'top-[52px]' : 'top-[65px]';

  const Layout = isAuthenticated ? DashboardLayout : PublicLayout;

  return (
    <Layout>
      {/* DashboardLayout already adds max-w + padding; PublicLayout needs its own container */}
      <div className={isAuthenticated ? '' : 'max-w-7xl mx-auto px-4 sm:px-6'}>

        {/* Mobile nav bar */}
        <div className={`lg:hidden sticky ${mobileBarTop} z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800/60 py-2 -mx-4 px-4`}>
          <button
            onClick={() => setMobile(o => !o)}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 w-full"
          >
            <BookOpen className="h-4 w-4" />
            Jump to section
            <ChevronRight className={`h-4 w-4 ml-auto transition-transform duration-200 ${mobileSidebarOpen ? 'rotate-90' : ''}`} />
          </button>
          {mobileSidebarOpen && (
            <div className="mt-3 pb-2">
              <Sidebar activeId={activeId} query={query} onQuery={setQuery} onNavigate={goTo} />
            </div>
          )}
        </div>

        <div className="flex gap-10">

          {/* Desktop sidebar */}
          <aside className="w-52 shrink-0 hidden lg:block">
            <div className={sidebarSticky}>
              <Sidebar activeId={activeId} query={query} onQuery={setQuery} onNavigate={goTo} />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 py-10 space-y-20 page-enter">

            {/* Introduction */}
            <Section id="introduction" icon={<BookOpen className="h-4 w-4 text-primary-400" />} title="Introduction">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The Personal Website Builder REST API lets you programmatically manage user accounts,
                PWBUnits (public profile pages), media, and more. All endpoints are prefixed with:
              </p>
              <CodeBlock>{`${BASE}/`}</CodeBlock>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {[
                  { name: 'Swagger UI', desc: 'Interactive explorer — try endpoints live', url: `${API_BASE_URL}/api/v1/swagger/` },
                  { name: 'ReDoc',      desc: 'Clean, searchable reference docs',         url: `${API_BASE_URL}/api/v1/redoc/` },
                ].map(({ name, desc, url }) => (
                  <a key={name} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:border-primary-500/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary-600/10 flex items-center justify-center shrink-0">
                      <ExternalLink className="h-4 w-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Copy for AI */}
              <button
                onClick={copyForAi}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left group ${
                  aiCopied
                    ? 'border-green-500/40 bg-green-50 dark:bg-green-950/20'
                    : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:border-primary-500/50 hover:shadow-md'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                  aiCopied ? 'bg-green-500/15' : 'bg-violet-500/10'
                }`}>
                  {aiCopied
                    ? <Check className="h-4 w-4 text-green-500" />
                    : <Bot className="h-4 w-4 text-violet-400" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold transition-colors duration-200 ${
                    aiCopied ? 'text-green-700 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {aiCopied ? 'Copied to clipboard!' : 'Copy docs for AI'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {aiCopied
                      ? 'Paste into any AI chat to give it full API context'
                      : 'Copy a compact API reference to paste into ChatGPT, Claude, etc.'}
                  </p>
                </div>
                {!aiCopied && (
                  <Copy className="h-4 w-4 text-slate-400 group-hover:text-primary-400 transition-colors duration-150 shrink-0" />
                )}
              </button>
            </Section>

            {/* Quick Start */}
            <Section id="quickstart" icon={<Zap className="h-4 w-4 text-primary-400" />} title="Quick Start">
              <p className="text-slate-600 dark:text-slate-400">Get up and running in five steps.</p>

              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">1</div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Register an account</h3>
                </div>
                <CodeTabs
                  curl={`curl -X POST ${BASE}/user/register/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "you@example.com",
    "password": "mypassword123",
    "first_name": "Jane",
    "last_name": "Doe"
  }'`}
                  js={`const { access, refresh } = await fetch('${BASE}/user/register/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'you@example.com',
    password: 'mypassword123',
    first_name: 'Jane',
    last_name: 'Doe',
  }),
}).then(r => r.json());`}
                  python={`import requests

resp = requests.post('${BASE}/user/register/', json={
    'email': 'you@example.com',
    'password': 'mypassword123',
    'first_name': 'Jane',
    'last_name': 'Doe',
})
tokens = resp.json()  # { "access": "...", "refresh": "..." }`}
                />
                <p className="text-xs text-slate-500 dark:text-slate-500">Registration returns JWT tokens directly — no separate login step needed.</p>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">2</div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Log in to get tokens (returning users)</h3>
                </div>
                <CodeTabs
                  curl={`curl -X POST ${BASE}/token/ \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"mypassword123"}'`}
                  js={`const { access, refresh } = await fetch('${BASE}/token/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'you@example.com', password: 'mypassword123' }),
}).then(r => r.json());`}
                  python={`resp = requests.post('${BASE}/token/', json={
    'email': 'you@example.com', 'password': 'mypassword123',
})
access  = resp.json()['access']
refresh = resp.json()['refresh']`}
                />
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">3</div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Send the access token with every request</h3>
                </div>
                <CodeTabs
                  curl={`curl ${BASE}/pwbunits/ \\
  -H "Authorization: Bearer <access_token>"`}
                  js={`const { results } = await fetch('${BASE}/pwbunits/', {
  headers: { Authorization: \`Bearer \${access}\` },
}).then(r => r.json());`}
                  python={`headers = {'Authorization': f'Bearer {access}'}
units = requests.get('${BASE}/pwbunits/', headers=headers).json()`}
                />
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Access tokens expire after <strong>15 minutes</strong>. Refresh tokens last <strong>3 days</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">4</div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Refresh an expired access token</h3>
                </div>
                <CodeTabs
                  curl={`curl -X POST ${BASE}/token/refresh/ \\
  -H "Content-Type: application/json" \\
  -d '{"refresh":"<refresh_token>"}'`}
                  js={`const { access: newAccess } = await fetch('${BASE}/token/refresh/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh }),
}).then(r => r.json());`}
                  python={`new_access = requests.post('${BASE}/token/refresh/', json={
    'refresh': refresh,
}).json()['access']`}
                />
              </div>

              {/* Step 5 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-slate-500 dark:bg-slate-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">5</div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">(Optional) Use an API Key for headless access</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Generate a key+secret pair, then send both headers on every request:</p>
                <CodeTabs
                  curl={`# Generate (requires a valid JWT first)
curl -X POST ${BASE}/user/api-key/ \\
  -H "Authorization: Bearer <access_token>"

# Use the key on any protected endpoint
curl ${BASE}/pwbunits/ \\
  -H "X-Api-Key: <your-key>" \\
  -H "X-Api-Secret: <your-secret>"`}
                  js={`// Generate
const { key, secret } = await fetch('${BASE}/user/api-key/', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${access}\` },
}).then(r => r.json());

// Use on any request
const res = await fetch('${BASE}/pwbunits/', {
  headers: { 'X-Api-Key': key, 'X-Api-Secret': secret },
});`}
                  python={`# Generate
creds = requests.post('${BASE}/user/api-key/', headers=headers).json()
key, secret = creds['key'], creds['secret']

# Use
api_headers = {'X-Api-Key': key, 'X-Api-Secret': secret}
units = requests.get('${BASE}/pwbunits/', headers=api_headers).json()`}
                />
              </div>
            </Section>

            {/* Authentication */}
            <Section id="authentication" icon={<Shield className="h-4 w-4 text-primary-400" />} title="Authentication">
              <p className="text-slate-600 dark:text-slate-400">Two methods are supported. You can switch between them freely on any request.</p>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary-400" />
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">JWT — Recommended</span>
                    <span className="ml-auto text-xs text-slate-500">Authorization: Bearer header</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• Obtain via <code className="text-primary-500 text-xs">/token/</code> or <code className="text-primary-500 text-xs">/user/register/</code></li>
                      <li>• Access token lifetime: <strong className="text-slate-800 dark:text-slate-200">15 minutes</strong></li>
                      <li>• Refresh token lifetime: <strong className="text-slate-800 dark:text-slate-200">3 days</strong></li>
                    </ul>
                    <CodeBlock>{`Authorization: Bearer <access_token>`}</CodeBlock>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
                    <Key className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">API Key + Secret</span>
                    <span className="ml-auto text-xs text-slate-500">Two custom headers</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• Generate via dashboard or <code className="text-primary-500 text-xs">POST /user/api-key/</code></li>
                      <li>• The secret is only shown <strong className="text-slate-800 dark:text-slate-200">once</strong> — store it immediately</li>
                      <li>• Both headers must be present; providing only one returns <strong className="text-red-400">401</strong></li>
                    </ul>
                    <CodeBlock>{`X-Api-Key: <your-key>\nX-Api-Secret: <your-secret>`}</CodeBlock>
                  </div>
                </div>
              </div>
            </Section>

            {/* Errors & Pagination */}
            <Section id="errors" icon={<AlertCircle className="h-4 w-4 text-primary-400" />} title="Errors & Pagination">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Error format</h3>
                  <CodeBlock>{`{ "detail": "Human-readable message." }

{ "field_name": ["Error for that field."] }

{ "field_name": { "nested_field": ["Error."] } }`}</CodeBlock>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Code</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Meaning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {[
                        ['400', 'Validation error'],
                        ['401', 'Not authenticated or invalid credentials'],
                        ['403', 'Authenticated but not the owner'],
                        ['404', 'Resource not found'],
                        ['409', 'Conflict — e.g. duplicate email or key exists'],
                        ['429', 'Rate limit exceeded'],
                      ].map(([code, meaning]) => (
                        <tr key={code} className="bg-white dark:bg-slate-900">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{code}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{meaning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Pagination</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    List endpoints return a paginated envelope. Default page size: <strong>20</strong>. Override with <code className="text-primary-500 text-xs">?page_size=N</code> (max 100). The <code className="text-xs text-primary-500">/teammates/</code> list is not paginated.
                  </p>
                  <CodeBlock>{`{
  "count": 42,
  "next": "${BASE}/pwbunits/?page=2",
  "previous": null,
  "results": [ ... ]
}`}</CodeBlock>
                </div>
              </div>
            </Section>

            {/* Endpoints */}
            <Section id="endpoints-header" icon={<Code2 className="h-4 w-4 text-primary-400" />} title="Endpoints">
              <p className="text-slate-600 dark:text-slate-400">Click any row to expand full documentation.</p>

              <Sub id="ep-health" title="Health">
                <EndpointCard method="GET" path="/ping/" description="Health check" auth="public">
                  <ResBlock status={200}>{`{ "ping": "pong" }`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-tokens" title="Auth — Tokens">
                <EndpointCard method="POST" path="/token/" description="Obtain JWT access + refresh tokens" auth="public">
                  <ReqBlock>{`{ "email": "string", "password": "string" }`}</ReqBlock>
                  <ResBlock status={200}>{`{ "access": "<jwt>", "refresh": "<jwt>" }`}</ResBlock>
                  <p className="text-xs text-slate-500">Throttled: 20 req/hour per IP.</p>
                </EndpointCard>
                <EndpointCard method="POST" path="/token/refresh/" description="Exchange refresh token for a new access token" auth="public">
                  <ReqBlock>{`{ "refresh": "<refresh_token>" }`}</ReqBlock>
                  <ResBlock status={200}>{`{ "access": "<new_jwt>" }`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-registration" title="Registration">
                <EndpointCard method="POST" path="/user/register/" description="Create a new user account" auth="public">
                  <ReqBlock>{`{
  "email": "string",
  "password": "string",    // min length, not common, not purely numeric
  "first_name": "string",
  "last_name": "string"
}`}</ReqBlock>
                  <ResBlock status={201}>{`{ "access": "<jwt>", "refresh": "<jwt>" }`}</ResBlock>
                  <p className="text-xs text-slate-500">Throttled: 10 req/hour per IP. Returns 400 on duplicate email or weak password.</p>
                </EndpointCard>
              </Sub>

              <Sub id="ep-profile" title="User Profile">
                <EndpointCard method="GET" path="/user/my-info/" description="Get authenticated user's profile" auth="jwt">
                  <ResBlock status={200}>{`{
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "is_staff": false,
  "is_superuser": false,
  "last_login": "2026-04-28T10:00:00Z",
  "date_joined": "2026-01-01T00:00:00Z",
  "profile_picture": "https://res.cloudinary.com/..."  // null if not set
}`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="PATCH" path="/user/my-info/" description="Update name or profile picture" auth="jwt">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Request — multipart/form-data or JSON</p>
                    <CodeBlock>{`first_name        string  optional
last_name         string  optional
profile_picture   file    optional (JPEG, PNG, WebP, GIF)`}</CodeBlock>
                  </div>
                  <ResBlock status={200}>{`{ /* User profile object */ }`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-password" title="Password">
                <EndpointCard method="POST" path="/user/change-password/" description="Change the authenticated user's password" auth="jwt">
                  <ReqBlock>{`{
  "current_password": "string",
  "new_password": "string"
}`}</ReqBlock>
                  <ResBlock status={200}>{`{ "details": "password changed." }`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-credentials" title="API Credentials">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  One credential set per user. The <strong>secret is only returned at creation and rotation</strong> — store it immediately.
                </p>
                <EndpointCard method="GET" path="/user/api-key/" description="Get current key info (no secret returned)" auth="jwt">
                  <ResBlock status={200}>{`{ "key": "string", "created_at": "datetime", "is_active": true }`}</ResBlock>
                  <p className="text-xs text-slate-500">Returns 404 if no credentials exist yet.</p>
                </EndpointCard>
                <EndpointCard method="POST" path="/user/api-key/" description="Generate a new key + secret pair" auth="jwt">
                  <ResBlock status={201}>{`{ "key": "string", "secret": "string", "created_at": "datetime" }`}</ResBlock>
                  <p className="text-xs text-slate-500">Returns 409 if credentials already exist — DELETE first or use /rotate/.</p>
                </EndpointCard>
                <EndpointCard method="POST" path="/user/api-key/rotate/" description="Generate a new secret (old secret immediately invalidated)" auth="jwt">
                  <ResBlock status={200}>{`{ "key": "string", "secret": "string", "created_at": "datetime" }`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="DELETE" path="/user/api-key/" description="Permanently revoke credentials" auth="jwt">
                  <ResBlock status={204}>{`// No body`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-pwbunits" title="PWBUnits">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  A PWBUnit is a public profile page identified by a unique <code className="text-primary-500 text-xs">unit_name</code> slug.
                  Single-unit retrieval is public; all writes require ownership.
                </p>
                <EndpointCard method="GET" path="/pwbunits/" description="List own PWBUnits (paginated)" auth="jwt">
                  <ResBlock status={200}>{`{
  "count": 1, "next": null, "previous": null,
  "results": [{
    "unit_name": "jane-doe",
    "first_name": "Jane", "last_name": "Doe",
    "headline": "Senior Engineer",
    "email": "jane@example.com",
    "phone": null, "location": "New York"
  }]
}`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="POST" path="/pwbunits/" description="Create a new PWBUnit" auth="jwt">
                  <ReqBlock>{`{
  "unit_name": "jane-doe",        // required; slug, globally unique
  "first_name": "Jane",           // required
  "last_name": "Doe",             // required
  "headline": "Senior Engineer",  // required; max 120 chars
  "email": "jane@example.com",    // required
  "phone": "+1234567890",         // optional
  "location": "New York",         // optional
  "about": "About me...",         // optional
  "skills": [],                   // optional — see Data Schemas
  "links": [], "languages": [],
  "experience_units": [], "education_units": [],
  "portfolio_items": [], "certifications": [],
  "awards": [], "custom_sections": []
}`}</ReqBlock>
                  <ResBlock status={201}>{`{ /* PWBUnit full object */ }`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="GET" path="/pwbunits/{unit_name}/" description="Get a single PWBUnit — public, no auth needed" auth="public">
                  <ResBlock status={200}>{`{ /* PWBUnit full object — see Data Schemas */ }`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="PATCH" path="/pwbunits/{unit_name}/" description="Partial update (nested arrays are fully replaced when present)" auth="owner">
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <p>• Only fields included in the request body are changed.</p>
                    <p>• For nested arrays: if a key is present the <strong>entire array is replaced</strong>; if absent, that relation is untouched.</p>
                  </div>
                  <ResBlock status={200}>{`{ /* PWBUnit full object */ }`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="DELETE" path="/pwbunits/{unit_name}/" description="Delete unit and all related data (cascade)" auth="owner">
                  <ResBlock status={204}>{`// No body`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-photos" title="Media — Photos">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Stored on Cloudinary. Accepted: JPEG, PNG, WebP, GIF.</p>
                <EndpointCard method="GET" path="/pwbunits/{unit_name}/photos/" description="List all photos for a unit" auth="jwt">
                  <ResBlock status={200}>{`[
  { "id": 1, "image": "https://res.cloudinary.com/...", "is_main": true },
  { "id": 2, "image": "https://res.cloudinary.com/...", "is_main": false }
]`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="POST" path="/pwbunits/{unit_name}/photos/" description="Upload a photo (multipart/form-data)" auth="owner">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Request — multipart/form-data</p>
                    <CodeBlock>{`image     file   required
is_main   bool   optional (default false) — "true"/"1"/"yes" accepted`}</CodeBlock>
                  </div>
                  <ResBlock status={201}>{`{ "id": 3, "image": "https://res.cloudinary.com/...", "is_main": false }`}</ResBlock>
                  <p className="text-xs text-slate-500">Setting is_main=true automatically demotes the previous main photo.</p>
                </EndpointCard>
                <EndpointCard method="PATCH" path="/pwbunits/{unit_name}/photos/{id}/" description="Set a photo as main" auth="owner">
                  <ReqBlock>{`{ "is_main": "true" }`}</ReqBlock>
                  <ResBlock status={200}>{`{ "id": 2, "image": "https://...", "is_main": true }`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="DELETE" path="/pwbunits/{unit_name}/photos/{id}/" description="Delete a photo" auth="owner">
                  <ResBlock status={204}>{`// No body`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-pdf" title="Media — PDF Resume">
                <EndpointCard method="POST" path="/pwbunits/{unit_name}/pdf-resume/" description="Upload or replace the PDF resume (multipart/form-data)" auth="owner">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Request — multipart/form-data</p>
                    <CodeBlock>{`file   file   required (application/pdf only)`}</CodeBlock>
                  </div>
                  <ResBlock status={200}>{`{ "pdf_resume": "https://res.cloudinary.com/.../fl_attachment/..." }`}</ResBlock>
                  <p className="text-xs text-slate-500">URL includes the fl_attachment Cloudinary flag — browsers will prompt a download.</p>
                </EndpointCard>
                <EndpointCard method="DELETE" path="/pwbunits/{unit_name}/pdf-resume/" description="Remove the PDF resume" auth="owner">
                  <ResBlock status={204}>{`// No body`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-edu-image" title="Media — Education Images">
                <EndpointCard method="POST" path="/pwbunits/{unit_name}/education-units/{id}/image/" description="Upload or replace an education unit image" auth="owner">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Request — multipart/form-data</p>
                    <CodeBlock>{`image   file   required (JPEG, PNG, WebP, GIF)`}</CodeBlock>
                  </div>
                  <ResBlock status={200}>{`{ "image": "https://res.cloudinary.com/..." }`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="DELETE" path="/pwbunits/{unit_name}/education-units/{id}/image/" description="Remove the education unit image" auth="owner">
                  <ResBlock status={204}>{`// No body`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-portfolio-image" title="Media — Portfolio Images">
                <EndpointCard method="POST" path="/pwbunits/{unit_name}/portfolio-items/{id}/image/" description="Upload or replace a portfolio item image" auth="owner">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Request — multipart/form-data</p>
                    <CodeBlock>{`image   file   required (JPEG, PNG, WebP, GIF)`}</CodeBlock>
                  </div>
                  <ResBlock status={200}>{`{ "image": "https://res.cloudinary.com/..." }`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="DELETE" path="/pwbunits/{unit_name}/portfolio-items/{id}/image/" description="Remove the portfolio item image" auth="owner">
                  <ResBlock status={204}>{`// No body`}</ResBlock>
                </EndpointCard>
              </Sub>

              <Sub id="ep-teammates" title="Teammates">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Read-only and public. Returns a plain array (not paginated).</p>
                <EndpointCard method="GET" path="/teammates/" description="List all teammates" auth="public">
                  <ResBlock status={200}>{`[
  {
    "id": 1,
    "first_name": "Alice", "last_name": "Smith",
    "email": "alice@example.com",
    "photo": "https://res.cloudinary.com/...",  // null if not set
    "project_roles": [{ "id": 1, "name": "Frontend Developer" }],
    "links": [{ "id": 1, "name": "GitHub", "link": "https://github.com/alice" }]
  }
]`}</ResBlock>
                </EndpointCard>
                <EndpointCard method="GET" path="/teammates/{id}/" description="Get a single teammate with full details" auth="public">
                  <ResBlock status={200}>{`{
  /* list fields + */
  "date_of_birth": "1990-05-15",    // null if not set
  "story": "Alice joined in 2021…"  // null if not set
}`}</ResBlock>
                </EndpointCard>
              </Sub>
            </Section>

            {/* Data Schemas */}
            <Section id="schemas" icon={<Database className="h-4 w-4 text-primary-400" />} title="Data Schemas">
              <p className="text-slate-600 dark:text-slate-400">Write schemas for nested arrays in PWBUnit create/update payloads.</p>
              <CodeBlock>{`// SkillWrite
{ "name": "Python", "category": "Backend", "level": "Expert", "order": 0 }
// level: Beginner | Intermediate | Advanced | Expert | null

// LinkWrite
{ "name": "GitHub", "url": "https://github.com/..." }

// LanguageWrite
{ "name": "English", "level": "Native" }
// level: A1 Beginner | A2 Elementary | B1 Intermediate | B2 Upper-Intermediate
//        C1 Advanced | C2 Advanced Proficiency | Native | Bilingual

// ExperienceUnitWrite
{
  "title": "Senior Engineer",
  "organization": "Acme Corp",   // optional
  "location": "NY",              // optional
  "description": "Built things", // optional
  "from_date": "2020-01-01",     // YYYY-MM-DD
  "to_date": null,               // optional; null means "present"
  "order": 0
}

// EducationUnitWrite
{
  "institution": "MIT",
  "degree": "BSc",               // optional
  "field_of_study": "CS",        // optional
  "location": "Cambridge",       // optional
  "from_date": "2015-09-01",
  "to_date": "2019-06-01",       // optional; must be after from_date
  "description": null,           // optional
  "order": 0
  // Note: image managed separately via /education-units/{id}/image/
}

// PortfolioItemWrite
{
  "title": "My App",
  "category": "Web",             // optional
  "description": "A web app",    // optional
  "date": "2023-05-01",          // optional
  "order": 0,
  "links": [{ "name": "Live", "url": "https://..." }]
  // Note: image managed separately via /portfolio-items/{id}/image/
}

// CertificationWrite
{
  "name": "AWS Certified",
  "issuing_organization": "Amazon",
  "issue_date": "2022-01-01",    // optional
  "expiry_date": "2025-01-01",   // optional; must be after issue_date
  "credential_id": "ABC123",     // optional
  "credential_url": "https://...", // optional
  "order": 0
}

// AwardWrite
{ "title": "Best Dev", "issuer": "DevConf", "date": "2023-06-01", "description": "...", "order": 0 }

// CustomSectionWrite
{
  "title": "Publications",
  "order": 0,
  "items": [{
    "title": "My Paper",
    "subtitle": "Journal",         // optional
    "from_date": "2023-01-01",     // optional
    "to_date": "2023-06-01",       // optional; must be after from_date
    "description": "...",          // optional
    "url": "https://...",          // optional
    "order": 0
  }]
}`}</CodeBlock>
            </Section>

            {/* Rate Limits */}
            <Section id="rate-limits" icon={<Zap className="h-4 w-4 text-primary-400" />} title="Rate Limits">
              <p className="text-slate-600 dark:text-slate-400">Per anonymous IP. Authenticated endpoints are not throttled by default.</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Scope</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Limit</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Endpoints</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {[
                      ['registration', '10 / hour', 'POST /user/register/,  POST /admin/register/'],
                      ['token',        '20 / hour', 'POST /token/'],
                    ].map(([scope, limit, paths]) => (
                      <tr key={scope} className="bg-white dark:bg-slate-900">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{scope}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{limit}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{paths}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">
                  Exceeding a limit returns <strong>429 Too Many Requests</strong>. Wait until the next hour window.
                </p>
              </div>
            </Section>

            {/* Interactive Docs */}
            <Section id="interactive" icon={<ExternalLink className="h-4 w-4 text-primary-400" />} title="Interactive Docs">
              <p className="text-slate-600 dark:text-slate-400">Live, explorable documentation powered by the OpenAPI 3 schema.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { name: 'Swagger UI',    desc: 'Try endpoints live in your browser with built-in auth',      url: `${API_BASE_URL}/api/v1/swagger/` },
                  { name: 'ReDoc',         desc: 'Clean readable reference with collapsible schemas',           url: `${API_BASE_URL}/api/v1/redoc/` },
                  { name: 'OpenAPI Schema', desc: 'Raw OpenAPI 3 JSON/YAML for code generation and tooling',   url: `${API_BASE_URL}/api/v1/schema/` },
                ].map(({ name, desc, url }) => (
                  <a key={name} href={url} target="_blank" rel="noreferrer"
                    className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:border-primary-500/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</p>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">{desc}</p>
                  </a>
                ))}
              </div>
            </Section>

          </div>
        </div>
      </div>
    </Layout>
  );
}
