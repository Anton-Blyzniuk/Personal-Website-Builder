import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, UserPlus, PenLine, Share2,
  MapPin, Briefcase, Code2, Globe, Key, Layers,
  Check, Zap, Lock,
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { useAuthStore } from '../store/authStore';

// ─── Animation timings ────────────────────────────────────────────────────────
const PHASE_MS  = 700;
const HOLD_MS   = 4000;
const MAX_PHASE = 6;

// ─── Browser Mockup ───────────────────────────────────────────────────────────
function BrowserMockup({ phase }: { phase: number }) {
  const show = (n: number) => phase >= n;
  const pct  = phase === 0 ? 0 : phase >= MAX_PHASE ? 100 : Math.round((phase / MAX_PHASE) * 85);

  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,.55)] border border-white/10 select-none">

      {/* Chrome bar */}
      <div className="relative bg-[#0e0e1b] px-4 pt-4 pb-3">
        <div
          className="absolute inset-x-0 top-0 h-[3px] rounded-b-sm bg-gradient-to-r from-primary-500 via-violet-500 to-cyan-400"
          style={{
            width: `${pct}%`,
            opacity: phase >= MAX_PHASE ? 0 : 1,
            transition: 'width 640ms cubic-bezier(.4,0,.2,1), opacity 400ms ease 260ms',
          }}
        />
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28ca42]" />
          </div>
          <div className="flex-1 max-w-[220px] mx-auto bg-white/[0.08] rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full shrink-0 transition-colors duration-700"
              style={{ background: phase >= MAX_PHASE ? '#4ade80' : '#475569' }}
            />
            <span className="text-[11px] text-slate-400 font-mono tracking-tight">pwb.app/jane-doe</span>
          </div>
        </div>
      </div>

      {/* Website content */}
      <div className="bg-white">

        {/* Site nav — phase 1 */}
        <nav className={`px-5 py-3 border-b border-slate-100 flex items-center justify-between transition-all duration-500 ${show(1) ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[9px] font-extrabold">JD</span>
            </div>
            <span className="text-[11px] font-bold text-slate-800">Jane Doe</span>
          </div>
          <div className="flex items-center gap-3">
            {['About', 'Experience', 'Skills'].map(l => (
              <span key={l} className="text-[9px] text-slate-400 font-medium hidden sm:block">{l}</span>
            ))}
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary-600 text-white font-semibold">Hire me</span>
          </div>
        </nav>

        {/* Profile header — phase 2 */}
        <div className={`px-5 pt-5 transition-all duration-500 ease-out ${show(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-start gap-4">
            <div className="h-[52px] w-[52px] rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_16px_rgba(99,102,241,.45)] shrink-0 ring-2 ring-white ring-offset-2 ring-offset-slate-50">
              J
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-extrabold text-slate-900 text-[15px] leading-tight">Jane Doe</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-bold">Open to work</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Senior Software Engineer</p>
              <p className="text-slate-400 text-[10px] flex items-center gap-1 mt-0.5">
                <MapPin className="h-2.5 w-2.5 shrink-0" />New York, NY · Full-time / Remote
              </p>
            </div>
          </div>
        </div>

        <div className={`mx-5 mt-4 border-t border-slate-100 transition-opacity duration-300 ${show(2) ? 'opacity-100' : 'opacity-0'}`} />

        {/* Experience — phase 3 */}
        <div className={`px-5 pt-4 transition-all duration-500 ease-out ${show(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="flex items-center gap-1.5 mb-3">
            <Briefcase className="h-3 w-3 text-primary-500 shrink-0" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
          </div>

          {/* Experience item — phase 4 */}
          <div className={`flex gap-3 mb-4 transition-all duration-500 ease-out ${show(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="w-0.5 rounded-full bg-gradient-to-b from-primary-400 to-violet-400 shrink-0 self-stretch my-0.5" />
            <div>
              <p className="font-bold text-slate-800 text-[11px]">Senior Software Engineer</p>
              <p className="text-slate-400 text-[10px]">Acme Corp · Jan 2020 – Present · 4 yrs</p>
              <p className="text-slate-500 text-[10px] mt-1 leading-relaxed">Building scalable distributed systems and developer tooling at scale.</p>
            </div>
          </div>
        </div>

        {/* Skills — phase 5 */}
        <div className={`px-5 transition-all duration-500 ease-out ${show(5) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Skills</p>
          <div className="flex flex-wrap gap-1.5 pb-3">
            {['Python', 'TypeScript', 'React', 'Docker', 'AWS', 'Go'].map((s, i) => (
              <span
                key={s}
                className="px-2 py-0.5 text-[10px] rounded-full bg-primary-50 text-primary-700 border border-primary-200 font-semibold"
                style={{
                  opacity:   show(5) ? 1 : 0,
                  transform: show(5) ? 'scale(1)' : 'scale(0.8)',
                  transition: `opacity 280ms ${i * 55}ms, transform 280ms ${i * 55}ms`,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Links — phase 6 */}
        <div className={`px-5 pb-5 transition-all duration-500 ease-out ${show(6) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Links</p>
          <div className="flex gap-2 flex-wrap">
            {['GitHub', 'LinkedIn', 'Portfolio'].map((l, i) => (
              <span
                key={l}
                className="text-[10px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 bg-white shadow-sm font-medium"
                style={{ opacity: show(6) ? 1 : 0, transition: `opacity 280ms ${i * 80}ms` }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const steps = [
  {
    icon: <UserPlus className="h-6 w-6" />,
    gradient: 'from-primary-500 to-primary-700',
    glow: 'shadow-[0_8px_28px_rgba(99,102,241,.45)]',
    title: 'Create your account',
    desc: 'Sign up in seconds — no credit card, no setup. Just your email and a password.',
  },
  {
    icon: <PenLine className="h-6 w-6" />,
    gradient: 'from-violet-500 to-violet-700',
    glow: 'shadow-[0_8px_28px_rgba(139,92,246,.45)]',
    title: 'Build your profile',
    desc: 'Add experience, education, skills, portfolio items, certifications, and photos.',
  },
  {
    icon: <Share2 className="h-6 w-6" />,
    gradient: 'from-cyan-500 to-cyan-700',
    glow: 'shadow-[0_8px_28px_rgba(6,182,212,.45)]',
    title: 'Share your link',
    desc: 'Your profile lives at a public URL. Share it anywhere — no login required to view.',
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: <Layers className="h-6 w-6 text-primary-500" />,
    iconBg: 'bg-primary-50 dark:bg-primary-900/30',
    badge: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40 border-primary-200 dark:border-primary-800/50',
    badgeText: 'Profiles',
    title: 'Multiple PWBUnits',
    desc: 'Create unlimited profiles — each with its own URL slug, section layout, and dedicated media library. Perfect for separating your personal and professional brands.',
  },
  {
    icon: <Globe className="h-6 w-6 text-cyan-500" />,
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    badge: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800/40',
    badgeText: 'Sharing',
    title: 'Instant public URL',
    desc: "Every profile gets a unique, shareable public link the moment it's created. No extra configuration, domain, or hosting required.",
  },
  {
    icon: <Code2 className="h-6 w-6 text-green-500" />,
    iconBg: 'bg-green-50 dark:bg-green-900/20',
    badge: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/40',
    badgeText: 'Developer',
    title: 'Full REST API',
    desc: 'Every feature is accessible via a documented REST API. Swagger UI and ReDoc included. Build your own integrations, sync from code, or automate your profile.',
  },
  {
    icon: <Key className="h-6 w-6 text-amber-500" />,
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    badge: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/40',
    badgeText: 'Auth',
    title: 'API credentials',
    desc: 'Generate key + secret pairs for headless and programmatic access. Rotate or revoke any credential instantly. Multiple pairs supported per account.',
  },
];

// ─── Strip items ───────────────────────────────────────────────────────────────
const strip = [
  { icon: <Layers className="h-3.5 w-3.5" />, text: 'Unlimited profiles' },
  { icon: <Globe className="h-3.5 w-3.5" />, text: 'Instant public URLs' },
  { icon: <Code2 className="h-3.5 w-3.5" />, text: 'Full REST API' },
  { icon: <Key className="h-3.5 w-3.5" />, text: 'API credentials' },
  { icon: <Zap className="h-3.5 w-3.5" />, text: 'JSON import' },
  { icon: <Lock className="h-3.5 w-3.5" />, text: 'Secure by default' },
  { icon: <Check className="h-3.5 w-3.5" />, text: 'Free to use' },
  { icon: <Sparkles className="h-3.5 w-3.5" />, text: 'Media uploads' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const run = (next: number) => {
      setPhase(next);
      t = setTimeout(() => run(next >= MAX_PHASE ? 0 : next + 1), next >= MAX_PHASE ? HOLD_MS : PHASE_MS);
    };
    t = setTimeout(() => run(1), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <PublicLayout>
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
          overflow-hidden is on the background layer only so floating cards
          (desktop-only) are never clipped by the section boundary.
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center px-4 sm:px-6 py-16 lg:py-0">

        {/* Background — clipped independently from content */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/70 via-transparent to-violet-50/30 dark:from-primary-950/60 dark:via-slate-950 dark:to-violet-950/30" />
          <div className="absolute inset-0 bg-grid-dark opacity-[0.35] dark:opacity-50" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/4 h-[700px] w-[700px] bg-primary-400/[0.12] dark:bg-primary-500/[0.18] rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-0 h-[500px] w-[400px] bg-violet-400/[0.07] dark:bg-violet-500/[0.12] rounded-full blur-[90px]" />
          <div className="absolute bottom-0 left-1/3 h-[350px] w-[500px] bg-cyan-400/[0.06] dark:bg-cyan-500/[0.09] rounded-full blur-[90px]" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

            {/* ── Left: text ── */}
            <div className="text-center lg:text-left">

              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary-400/30 dark:border-primary-500/30 bg-primary-50 dark:bg-primary-500/[0.08] text-primary-600 dark:text-primary-400 text-sm font-semibold animate-fade-in shadow-sm dark:shadow-none">
                <Sparkles className="h-3.5 w-3.5 animate-float" />
                Personal Website Builder
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.08] tracking-tight mb-5 animate-fade-up">
                Build your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-violet-500 to-cyan-400">
                  personal website
                </span>
                {' '}in minutes.
              </h1>

              <p
                className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-up"
                style={{ animationDelay: '80ms' }}
              >
                Create a rich, structured professional profile with experience, skills,
                portfolio, and photos. Share a beautiful public page — or access everything
                through the full REST API.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-up"
                style={{ animationDelay: '160ms' }}
              >
                <Link
                  to={isAuthenticated ? '/dashboard' : '/register'}
                  className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-500 shadow-[0_4px_24px_rgba(99,102,241,.4)] hover:shadow-[0_6px_36px_rgba(99,102,241,.6)] transition-all duration-200 active:scale-[0.97]"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Start building — free'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                </Link>
                <Link
                  to="/docs"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 backdrop-blur-sm transition-all duration-200"
                >
                  View API docs
                </Link>
              </div>

              <div
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-7 animate-fade-up"
                style={{ animationDelay: '240ms' }}
              >
                {['Free to use', 'No credit card', 'Full REST API'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500 font-medium">
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Right: mockup ── */}
            {/* Floating cards use hidden lg:flex so they only appear when the
                two-column layout is active and won't clip or overlap the text. */}
            <div className="relative animate-fade-up mt-4 lg:mt-0" style={{ animationDelay: '200ms' }}>
              {/* Glow backdrop */}
              <div className="absolute inset-0 scale-105 bg-gradient-to-br from-primary-500/20 via-violet-500/10 to-cyan-400/10 rounded-3xl blur-3xl pointer-events-none" />

              <div className="relative">
                <BrowserMockup phase={phase} />
              </div>

              {/* Floating card — top right, desktop only */}
              <div className="hidden lg:flex absolute -top-5 -right-8 z-10 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,.5)] border border-slate-100 dark:border-slate-700/80 items-center gap-3 animate-float">
                <div className="h-9 w-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(34,197,94,.4)]">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">Profile published!</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">pwb.app/jane-doe</p>
                </div>
              </div>

              {/* Floating card — bottom left, desktop only */}
              <div
                className="hidden lg:flex absolute -bottom-5 -left-8 z-10 bg-[#0e0e1b] rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,.4)] border border-white/[0.08] items-center gap-3 animate-float-delayed"
              >
                <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(99,102,241,.4)]">
                  <Code2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">REST API ready</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">GET /api/pwbunits/</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MARQUEE STRIP
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden border-y border-slate-200 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm py-4">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...strip, ...strip].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 px-7 text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              <span className="text-primary-500 dark:text-primary-400">{item.icon}</span>
              {item.text}
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 ml-5" />
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16 sm:mb-20">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-[0.2em] mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              From zero to published in three steps
            </h2>
            <p className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              No templates to wrestle with. No hosting to configure. Just fill in your details and share.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-10 relative">
            {/* Connector line — desktop only, sits behind the icons */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.67%+2.5rem)] right-[calc(16.67%+2.5rem)] h-px bg-gradient-to-r from-primary-400/40 via-violet-400/50 to-cyan-400/40" />

            {steps.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className={`relative h-20 w-20 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white mb-6 ${s.glow} shrink-0`}>
                  {s.icon}
                  <span className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-extrabold flex items-center justify-center shadow-md">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{s.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 bg-slate-100/70 dark:bg-slate-900/50 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-[0.2em] mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Everything in one place
            </h2>
            <p className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              A complete toolkit for building, managing, and sharing your professional profile.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map(f => (
              <div
                key={f.title}
                className="group relative rounded-2xl border p-6 sm:p-7 bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl dark:hover:shadow-[0_12px_48px_rgba(0,0,0,.45)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-5">
                  {/* h-12 w-12 with p-3 perfectly frames an h-6 w-6 icon */}
                  <div className={`h-12 w-12 rounded-xl ${f.iconBg} flex items-center justify-center p-3 shrink-0`}>
                    {f.icon}
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${f.badge}`}>
                    {f.badgeText}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          API PREVIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6">
        <div className="absolute inset-0 bg-grid-dark opacity-40 dark:opacity-60 pointer-events-none" />
        <div className="absolute top-1/2 left-0 h-[400px] w-[400px] bg-primary-500/[0.06] dark:bg-primary-500/[0.10] rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

        <div className="relative max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left */}
          <div>
            <p className="text-xs font-bold text-primary-500 uppercase tracking-[0.2em] mb-4">Developer-first</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5">
              Every feature has an API
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              The entire platform is accessible via a documented REST API. Generate credentials
              in the dashboard and start integrating — build your own CMS, sync your CV from code,
              or automate everything.
            </p>
            <ul className="space-y-3.5 mb-8">
              {[
                'OpenAPI / Swagger UI included',
                'Key + Secret credential pairs',
                'Full CRUD on all profile sections',
                'Media upload endpoints',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  <div className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group"
            >
              Read the full API docs
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Right — code block */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,.6)]">
            <div className="bg-[#0e0e1b] px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#28ca42]" />
              </div>
              <span className="text-[11px] text-slate-500 font-mono">api · profile endpoint</span>
              <div className="w-[50px]" />
            </div>
            <div className="bg-[#090914] p-5 sm:p-6 font-mono text-[12px] leading-relaxed overflow-x-auto">
              <div className="text-slate-600 mb-3"># Fetch your profile via REST API</div>
              <div className="mb-0.5">
                <span className="text-amber-400 font-bold">GET</span>
                <span className="text-slate-300">  /api/pwbunits/jane-doe/</span>
              </div>
              <div className="mb-4 text-slate-500">
                <span className="text-slate-600">Authorization: </span>
                <span className="text-green-400">Key</span>
                <span className="text-slate-400"> abc123 </span>
                <span className="text-green-400">Secret</span>
                <span className="text-slate-400"> xyz789</span>
              </div>
              <div className="border-t border-white/[0.05] pt-4 mb-2">
                <span className="text-green-400 font-bold">200 OK</span>
              </div>
              <div className="text-slate-400">{'{'}</div>
              <div className="ml-5 space-y-0.5">
                <div><span className="text-blue-400">"name"</span><span className="text-slate-500">:     </span><span className="text-orange-300">"jane-doe"</span><span className="text-slate-600">,</span></div>
                <div><span className="text-blue-400">"headline"</span><span className="text-slate-500">:  </span><span className="text-orange-300">"Senior Software Engineer"</span><span className="text-slate-600">,</span></div>
                <div><span className="text-blue-400">"skills"</span><span className="text-slate-500">:    </span><span className="text-slate-300">[ ... ]</span><span className="text-slate-600">,</span></div>
                <div><span className="text-blue-400">"experience"</span><span className="text-slate-500">: </span><span className="text-slate-300">[ ... ]</span><span className="text-slate-600">,</span></div>
                <div><span className="text-blue-400">"photos"</span><span className="text-slate-500">:    </span><span className="text-slate-300">[ ... ]</span></div>
              </div>
              <div className="text-slate-400">{'}'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 sm:py-32 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0a0814] to-slate-950" />
        <div className="absolute inset-0 bg-grid-dark opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-primary-600/[0.18] rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 h-[350px] w-[450px] bg-violet-600/[0.12] rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 h-[250px] w-[350px] bg-cyan-500/[0.08] rounded-full blur-[70px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full border border-primary-500/25 bg-primary-500/[0.08] text-primary-400 text-xs font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
            Ready when you are
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Your professional presence{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-violet-400 to-cyan-400">
              starts here.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Create your free account and have your personal website live in minutes.
            No templates, no fluff — just your career, structured and shareable.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-500 shadow-[0_4px_28px_rgba(99,102,241,.5)] hover:shadow-[0_6px_40px_rgba(99,102,241,.7)] transition-all duration-200 active:scale-[0.97]"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Create free account'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-150" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl border border-white/[0.12] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.20] transition-all duration-200 backdrop-blur-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
