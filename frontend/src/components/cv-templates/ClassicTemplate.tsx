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

function getLinkIcon(link: Link, size = 14) {
  const name = link.name.toLowerCase();
  const url = link.url.toLowerCase();
  if (name.includes('github') || url.includes('github.com')) return <Github size={size} />;
  if (name.includes('linkedin') || url.includes('linkedin.com')) return <Linkedin size={size} />;
  if (name.includes('telegram') || url.includes('t.me')) return <Send size={size} />;
  return <Globe size={size} />;
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 mb-3">
      {children}
    </p>
  );
}

function MainHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shrink-0">
        {children}
      </h2>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

const SKILL_CAT_COLORS = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
];

export function ClassicTemplate({ unit }: TemplateProps) {
  const mainPhoto = unit.photos.find((p) => p.is_main) ?? unit.photos[0];
  const initial = `${unit.first_name[0] ?? ''}${unit.last_name[0] ?? ''}`.toUpperCase();

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
    catColorMap[cat] = SKILL_CAT_COLORS[i % SKILL_CAT_COLORS.length];
  });

  return (
    <div className="cv-page bg-white dark:bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row min-h-screen shadow-[0_0_80px_rgba(0,0,0,.08)] dark:shadow-none">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="md:w-72 shrink-0 bg-slate-900 text-white flex flex-col">

          {/* Photo + identity */}
          <div className="px-8 pt-10 pb-8 border-b border-white/10">
            {mainPhoto ? (
              <img
                src={mainPhoto.image}
                alt={unit.first_name}
                className="h-24 w-24 rounded-2xl object-cover border-2 border-white/20 mb-5 shadow-xl"
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-indigo-600 border-2 border-white/10 flex items-center justify-center text-2xl font-bold text-white mb-5 shadow-xl">
                {initial}
              </div>
            )}
            <h1 className="text-xl font-bold text-white leading-tight break-words">
              {unit.first_name} {unit.last_name}
            </h1>
            <p className="text-sm text-indigo-300 mt-1 font-medium leading-snug">{unit.headline}</p>

            {unit.pdf_resume && (
              <a
                href={unit.pdf_resume}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
              >
                <Download size={13} /> Download CV
              </a>
            )}
          </div>

          {/* Sidebar content */}
          <div className="flex-1 px-8 py-7 space-y-7">

            {/* Contact */}
            <div>
              <SideLabel>Contact</SideLabel>
              <div className="space-y-2.5">
                <a
                  href={`mailto:${unit.email}`}
                  className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white transition-colors break-all"
                >
                  <Mail size={13} className="shrink-0 text-indigo-400" />
                  {unit.email}
                </a>
                {unit.phone && (
                  <a
                    href={`tel:${unit.phone}`}
                    className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <Phone size={13} className="shrink-0 text-indigo-400" />
                    {unit.phone}
                  </a>
                )}
                {unit.location && (
                  <span className="flex items-center gap-2.5 text-xs text-slate-300">
                    <MapPin size={13} className="shrink-0 text-indigo-400" />
                    {unit.location}
                  </span>
                )}
              </div>
            </div>

            {/* Links */}
            {unit.links.length > 0 && (
              <div>
                <SideLabel>Links</SideLabel>
                <div className="space-y-2">
                  {unit.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      <span className="text-indigo-400 shrink-0">{getLinkIcon(l)}</span>
                      {l.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {unit.skills.length > 0 && (
              <div data-section="skills">
                <SideLabel>Skills</SideLabel>
                <div className="space-y-4">
                  {Object.entries(skillsByCategory).map(([cat, skills]) => (
                    <div key={cat}>
                      {Object.keys(skillsByCategory).length > 1 && (
                        <p className="text-[10px] text-slate-500 font-semibold mb-1.5">{cat}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-white/10 text-slate-200 font-medium"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {unit.languages.length > 0 && (
              <div data-section="languages">
                <SideLabel>Languages</SideLabel>
                <div className="space-y-2">
                  {unit.languages.map((l, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-200 font-medium">{l.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {unit.education_units.length > 0 && (
              <div data-section="education">
                <SideLabel>Education</SideLabel>
                <div className="space-y-4">
                  {unit.education_units
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((e) => (
                      <div key={e.id}>
                        <p className="text-xs font-bold text-white leading-snug">{e.institution}</p>
                        {e.degree && (
                          <p className="text-[11px] text-indigo-300 mt-0.5">
                            {e.degree}
                            {e.field_of_study ? ` in ${e.field_of_study}` : ''}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {formatDate(e.from_date)} – {formatDate(e.to_date)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <main className="flex-1 px-8 sm:px-10 py-10 space-y-10 bg-white dark:bg-slate-950">

          {/* About */}
          {unit.about && (
            <section data-section="about">
              <MainHeading>About</MainHeading>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{unit.about}</p>
            </section>
          )}

          {/* Experience */}
          {unit.experience_units.length > 0 && (
            <section data-section="experience">
              <MainHeading>Experience</MainHeading>
              <div className="relative pl-6 space-y-8">
                <div className="absolute left-0 top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-800" />
                {unit.experience_units
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((e) => (
                    <div key={e.id} className="relative">
                      <div className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-950" />
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1.5">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{e.title}</p>
                          {e.organization && (
                            <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                              {e.organization}
                              {e.location ? ` · ${e.location}` : ''}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0 pt-0.5">
                          {formatDate(e.from_date)} – {formatDate(e.to_date)}
                        </p>
                      </div>
                      {e.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {e.description}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Portfolio */}
          {unit.portfolio_items.length > 0 && (
            <section data-section="portfolio">
              <MainHeading>Projects</MainHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {unit.portfolio_items
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {p.image ? (
                        <div className="h-36 overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-36 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 flex items-center justify-center">
                          <span className="text-3xl font-bold text-indigo-200 dark:text-indigo-700">
                            {p.title[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="p-4">
                        {p.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {p.category}
                          </span>
                        )}
                        <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">{p.title}</p>
                        {p.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {p.description}
                          </p>
                        )}
                        {p.links.length > 0 && (
                          <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            {p.links.map((l, i) => (
                              <a
                                key={i}
                                href={l.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                <ExternalLink size={11} /> {l.name}
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

          {/* Certifications */}
          {unit.certifications.length > 0 && (
            <section data-section="certifications">
              <MainHeading>Certifications</MainHeading>
              <div className="space-y-4">
                {unit.certifications
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((c, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="h-10 w-10 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          {c.issuing_organization[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">{c.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {c.issuing_organization}
                          {c.issue_date ? ` · ${formatDate(c.issue_date)}` : ''}
                        </p>
                        {c.credential_url && (
                          <a
                            href={c.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
                          >
                            <ExternalLink size={10} /> View credential
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Awards */}
          {unit.awards.length > 0 && (
            <section data-section="awards">
              <MainHeading>Awards</MainHeading>
              <div className="space-y-4">
                {unit.awards
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((a, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 text-xl">
                        🏆
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{a.title}</p>
                        {a.issuer && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {a.issuer}
                            {a.date ? ` · ${formatDate(a.date)}` : ''}
                          </p>
                        )}
                        {a.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                            {a.description}
                          </p>
                        )}
                      </div>
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
                <MainHeading>{cs.title}</MainHeading>
                <div className="space-y-5">
                  {cs.items
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((item, ii) => (
                      <div key={ii} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                          )}
                          {item.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
                            >
                              <ExternalLink size={10} /> View
                            </a>
                          )}
                        </div>
                        {(item.from_date || item.to_date) && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                            {formatDate(item.from_date)} – {formatDate(item.to_date)}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            ))}
        </main>
      </div>
    </div>
  );
}
