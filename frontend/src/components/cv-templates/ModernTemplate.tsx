import { Mail, Phone, MapPin, ExternalLink, Download, Send, Globe, Github, Linkedin } from 'lucide-react';
import type { PWBUnit, Link } from '../../types/api';

interface TemplateProps {
  unit: PWBUnit;
}

function formatDate(dateStr: string | null | undefined, fallback = 'Present'): string {
  if (!dateStr) return fallback;
  const parts = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
}

function getLinkIcon(link: Link, size = 16) {
  const name = link.name.toLowerCase();
  const url = link.url.toLowerCase();
  if (name.includes('github') || url.includes('github.com')) return <Github size={size} />;
  if (name.includes('linkedin') || url.includes('linkedin.com')) return <Linkedin size={size} />;
  if (name.includes('telegram') || url.includes('t.me')) return <Send size={size} />;
  return <Globe size={size} />;
}

const CAT_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 shrink-0">{children}</h2>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export function ModernTemplate({ unit }: TemplateProps) {
  const mainPhoto = unit.photos.find((p) => p.is_main) ?? unit.photos[0];
  const initial = `${unit.first_name[0] ?? ''}${unit.last_name[0] ?? ''}`.toUpperCase();

  const yearsExp =
    unit.experience_units.length > 0
      ? new Date().getFullYear() -
        Math.min(...unit.experience_units.map((e) => parseInt(e.from_date.split('-')[0], 10)))
      : null;

  const skillsByCategory = unit.skills
    .slice()
    .sort((a, b) => a.order - b.order)
    .reduce<Record<string, typeof unit.skills>>((acc, skill) => {
      const cat = skill.category ?? 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    }, {});

  const catColorMap: Record<string, string> = {};
  Object.keys(skillsByCategory).forEach((cat, i) => {
    catColorMap[cat] = CAT_COLORS[i % CAT_COLORS.length];
  });

  const navLinks = [
    unit.about && { id: 'about', label: 'About' },
    unit.skills.length > 0 && { id: 'skills', label: 'Skills' },
    unit.experience_units.length > 0 && { id: 'experience', label: 'Experience' },
    unit.portfolio_items.length > 0 && { id: 'projects', label: 'Projects' },
    (unit.certifications.length > 0 || unit.awards.length > 0) && { id: 'achievements', label: 'Achievements' },
  ].filter(Boolean) as { id: string; label: string }[];

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const hasAchievements = unit.certifications.length > 0 || unit.awards.length > 0;

  return (
    <div className="cv-page bg-white dark:bg-slate-950 min-h-screen">

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 flex items-center justify-between h-14">
          <span className="font-bold text-white text-sm tracking-tight">
            {unit.first_name} {unit.last_name}
          </span>
          <div className="hidden sm:flex items-center gap-6">
            {navLinks.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('contact')}
              className="text-sm text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
            >
              Contact
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start gap-10 sm:gap-14">

          {/* Photo */}
          <div className="shrink-0">
            {mainPhoto ? (
              <img
                src={mainPhoto.image}
                alt={unit.first_name}
                className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl object-cover border-2 border-white/10 shadow-2xl"
              />
            ) : (
              <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl bg-slate-700 border-2 border-white/10 flex items-center justify-center text-3xl font-bold text-slate-300 shadow-2xl">
                {initial}
              </div>
            )}
          </div>

          {/* Copy */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-2">
              {unit.location ?? 'Available for work'}
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight break-words">
              {unit.first_name} {unit.last_name}
            </h1>
            <p className="mt-3 text-xl text-slate-300">{unit.headline}</p>

            {/* Stats */}
            {(yearsExp !== null || unit.portfolio_items.length > 0 || unit.certifications.length > 0) && (
              <div className="flex flex-wrap gap-8 mt-6 py-4 border-t border-b border-white/10">
                {yearsExp !== null && yearsExp > 0 && (
                  <div>
                    <p className="text-3xl font-bold text-white">{yearsExp}+</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Years exp.</p>
                  </div>
                )}
                {unit.portfolio_items.length > 0 && (
                  <div>
                    <p className="text-3xl font-bold text-white">{unit.portfolio_items.length}+</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Projects</p>
                  </div>
                )}
                {unit.certifications.length > 0 && (
                  <div>
                    <p className="text-3xl font-bold text-white">{unit.certifications.length}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Certs</p>
                  </div>
                )}
              </div>
            )}

            {/* Contact row */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-5 text-sm text-slate-400">
              <a
                href={`mailto:${unit.email}`}
                className="flex items-center gap-1.5 hover:text-blue-300 transition-colors"
              >
                <Mail size={14} /> {unit.email}
              </a>
              {unit.phone && (
                <a
                  href={`tel:${unit.phone}`}
                  className="flex items-center gap-1.5 hover:text-blue-300 transition-colors"
                >
                  <Phone size={14} /> {unit.phone}
                </a>
              )}
              {unit.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {unit.location}
                </span>
              )}
            </div>

            {/* Social + CV buttons */}
            {(unit.links.length > 0 || unit.pdf_resume) && (
              <div className="flex flex-wrap gap-2 mt-5">
                {unit.links.map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-slate-200 transition-colors border border-white/10"
                  >
                    {getLinkIcon(l, 15)}
                    <span>{l.name}</span>
                  </a>
                ))}
                {unit.pdf_resume && (
                  <a
                    href={unit.pdf_resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-colors"
                  >
                    <Download size={15} /> Download CV
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 space-y-20">

        {/* About */}
        {unit.about && (
          <section id="about" data-section="about">
            <SectionHeading>About</SectionHeading>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg max-w-3xl">
              {unit.about}
            </p>
          </section>
        )}

        {/* Skills */}
        {unit.skills.length > 0 && (
          <section id="skills" data-section="skills">
            <SectionHeading>Skills</SectionHeading>
            <div className="space-y-6">
              {Object.entries(skillsByCategory).map(([cat, skills]) => (
                <div key={cat}>
                  {Object.keys(skillsByCategory).length > 1 && (
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                      {cat}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s, i) => (
                      <span
                        key={i}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${catColorMap[cat]}`}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {unit.experience_units.length > 0 && (
          <section id="experience" data-section="experience">
            <SectionHeading>Experience</SectionHeading>
            <div className="relative pl-7 space-y-10">
              <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
              {unit.experience_units
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((e) => (
                  <div key={e.id} className="relative">
                    <div className="absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-950 shadow" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-snug">
                          {e.title}
                        </p>
                        {e.organization && (
                          <p className="text-blue-600 dark:text-blue-400 font-medium">
                            {e.organization}
                            {e.location ? ` · ${e.location}` : ''}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 dark:text-slate-500 shrink-0 pt-0.5">
                        {formatDate(e.from_date)} – {formatDate(e.to_date)}
                      </p>
                    </div>
                    {e.description && (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{e.description}</p>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Education */}
        {unit.education_units.length > 0 && (
          <section id="education" data-section="education">
            <SectionHeading>Education</SectionHeading>
            <div className="relative pl-7 space-y-8">
              <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
              {unit.education_units
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((e) => (
                  <div key={e.id} className="relative">
                    <div className="absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-white dark:border-slate-950 shadow" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-snug">
                          {e.institution}
                        </p>
                        {e.degree && (
                          <p className="text-violet-600 dark:text-violet-400 font-medium">
                            {e.degree}
                            {e.field_of_study ? ` in ${e.field_of_study}` : ''}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 dark:text-slate-500 shrink-0 pt-0.5">
                        {formatDate(e.from_date)} – {formatDate(e.to_date)}
                      </p>
                    </div>
                    {e.description && (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{e.description}</p>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Portfolio */}
        {unit.portfolio_items.length > 0 && (
          <section id="projects" data-section="portfolio">
            <SectionHeading>Projects</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {unit.portfolio_items
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((p) => (
                  <div
                    key={p.id}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl dark:hover:shadow-slate-900/50 transition-all duration-300"
                  >
                    {p.image ? (
                      <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                        <span className="text-4xl font-bold text-slate-300 dark:text-slate-600">
                          {p.title[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="p-5">
                      {p.category && (
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {p.category}
                        </span>
                      )}
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mt-1 leading-snug">
                        {p.title}
                      </h3>
                      {p.description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                          {p.description}
                        </p>
                      )}
                      {p.links.length > 0 && (
                        <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          {p.links.map((l, i) => (
                            <a
                              key={i}
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
                            >
                              <ExternalLink size={13} /> {l.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Certifications & Awards */}
        {hasAchievements && (
          <section id="achievements">
            <SectionHeading>Certifications & Awards</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
              {unit.certifications.length > 0 && (
                <div data-section="certifications" className="space-y-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                    Certifications
                  </p>
                  {unit.certifications
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((c, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        {c.image ? (
                          <img
                            src={c.image}
                            alt={c.name}
                            className="h-11 w-11 rounded-xl object-contain shrink-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-bold text-sm">
                            {c.issuing_organization[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {c.issuing_organization}
                            {c.issue_date ? ` · ${formatDate(c.issue_date)}` : ''}
                          </p>
                          {c.credential_url && (
                            <a
                              href={c.credential_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                            >
                              <ExternalLink size={10} /> View credential
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {unit.awards.length > 0 && (
                <div data-section="awards" className="space-y-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                    Awards
                  </p>
                  {unit.awards
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((a, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 text-xl">
                          🏆
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                            {a.title}
                          </p>
                          {a.issuer && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {a.issuer}
                              {a.date ? ` · ${formatDate(a.date)}` : ''}
                            </p>
                          )}
                          {a.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              {a.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Languages */}
        {unit.languages.length > 0 && (
          <section data-section="languages">
            <SectionHeading>Languages</SectionHeading>
            <div className="flex flex-wrap gap-3">
              {unit.languages.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{l.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{l.level}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Custom Sections */}
        {unit.custom_sections
          .filter((cs) => cs.items.length > 0)
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((cs, i) => (
            <section key={i} data-section={`custom-${cs.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <SectionHeading>{cs.title}</SectionHeading>
              <div className="space-y-6">
                {cs.items
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((item, ii) => (
                    <div key={ii} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-slate-500 dark:text-slate-400 text-sm">{item.subtitle}</p>
                        )}
                        {item.description && (
                          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                          >
                            <ExternalLink size={11} /> View
                          </a>
                        )}
                      </div>
                      {(item.from_date || item.to_date) && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 shrink-0">
                          {formatDate(item.from_date)} – {formatDate(item.to_date)}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
      </div>

      {/* ── CTA Footer ────────────────────────────────────────────────────── */}
      <div id="contact" className="bg-slate-900 text-white py-20 px-4 sm:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">Let's work together</h2>
        <p className="text-slate-400 text-lg mt-3 mb-8 max-w-md mx-auto">
          Have a project in mind or want to connect? Reach out.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <a
            href={`mailto:${unit.email}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            <Mail size={18} /> Get in touch
          </a>
          {unit.links.slice(0, 2).map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
            >
              {getLinkIcon(l, 16)} {l.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
