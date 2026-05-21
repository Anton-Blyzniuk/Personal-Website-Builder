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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500 mb-5">
      {children}
    </h2>
  );
}

export function MinimalTemplate({ unit }: TemplateProps) {
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

  const customSectionsWithItems = unit.custom_sections
    .filter((cs) => cs.items.length > 0)
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <div className="cv-page bg-white dark:bg-slate-950 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 sm:px-10 py-14 sm:py-20">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="mb-14">
          <div className="flex items-start justify-between gap-6 mb-5">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight break-words">
                {unit.first_name}
                <br />
                {unit.last_name}
              </h1>
              <p className="mt-3 text-lg text-slate-500 dark:text-slate-400 font-normal">{unit.headline}</p>
            </div>
            {mainPhoto ? (
              <img
                src={mainPhoto.image}
                alt={unit.first_name}
                className="h-20 w-20 rounded-2xl object-cover shrink-0"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400 dark:text-slate-500 shrink-0">
                {initial}
              </div>
            )}
          </div>

          {/* Contact + links row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <a
              href={`mailto:${unit.email}`}
              className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <Mail size={13} /> {unit.email}
            </a>
            {unit.phone && (
              <a
                href={`tel:${unit.phone}`}
                className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <Phone size={13} /> {unit.phone}
              </a>
            )}
            {unit.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> {unit.location}
              </span>
            )}
          </div>

          {/* Social links + download */}
          {(unit.links.length > 0 || unit.pdf_resume) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {unit.links.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
                >
                  {getLinkIcon(l)} {l.name}
                </a>
              ))}
              {unit.pdf_resume && (
                <a
                  href={unit.pdf_resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 transition-all"
                >
                  <Download size={12} /> Resume
                </a>
              )}
            </div>
          )}
        </header>

        {/* ── Sections ─────────────────────────────────────────────────────── */}
        <div className="space-y-14">

          {/* About */}
          {unit.about && (
            <section data-section="about">
              <SectionTitle>About</SectionTitle>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[15px]">{unit.about}</p>
            </section>
          )}

          {/* Skills */}
          {unit.skills.length > 0 && (
            <section data-section="skills">
              <SectionTitle>Skills</SectionTitle>
              <div className="space-y-4">
                {Object.entries(skillsByCategory).map(([cat, skills]) => (
                  <div key={cat} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                    {Object.keys(skillsByCategory).length > 1 && (
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 sm:w-24 sm:text-right sm:shrink-0 sm:pt-1.5">
                        {cat}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
            <section data-section="experience">
              <SectionTitle>Experience</SectionTitle>
              <div className="space-y-8">
                {unit.experience_units
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((e) => (
                    <div key={e.id} className="group">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 mb-1.5">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{e.title}</span>
                          {e.organization && (
                            <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                              {e.organization}
                              {e.location ? ` · ${e.location}` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                          {formatDate(e.from_date)} – {formatDate(e.to_date)}
                        </p>
                      </div>
                      {e.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{e.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Education */}
          {unit.education_units.length > 0 && (
            <section data-section="education">
              <SectionTitle>Education</SectionTitle>
              <div className="space-y-6">
                {unit.education_units
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((e) => (
                    <div key={e.id}>
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 mb-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{e.institution}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                          {formatDate(e.from_date)} – {formatDate(e.to_date)}
                        </p>
                      </div>
                      {e.degree && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {e.degree}
                          {e.field_of_study ? `, ${e.field_of_study}` : ''}
                        </p>
                      )}
                      {e.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">{e.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Portfolio */}
          {unit.portfolio_items.length > 0 && (
            <section data-section="portfolio">
              <SectionTitle>Projects</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {unit.portfolio_items
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="group rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                    >
                      {p.image ? (
                        <div className="h-36 overflow-hidden">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-36 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                          <span className="text-3xl font-bold text-slate-200 dark:text-slate-700">
                            {p.title[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="p-4">
                        {p.category && (
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {p.category}
                          </p>
                        )}
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-0.5 leading-snug">
                          {p.title}
                        </p>
                        {p.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {p.description}
                          </p>
                        )}
                        {p.links.length > 0 && (
                          <div className="flex gap-3 mt-3">
                            {p.links.map((l, i) => (
                              <a
                                key={i}
                                href={l.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2 decoration-slate-300 dark:decoration-slate-600"
                              >
                                <ExternalLink size={10} /> {l.name}
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
              <SectionTitle>Certifications</SectionTitle>
              <div className="space-y-4">
                {unit.certifications
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((c, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="h-9 w-9 rounded-lg object-contain border border-slate-200 dark:border-slate-800 p-0.5 shrink-0 bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-xs font-bold text-slate-400 dark:text-slate-500">
                          {c.issuing_organization[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                          {c.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {c.issuing_organization}
                          {c.issue_date ? ` · ${formatDate(c.issue_date)}` : ''}
                        </p>
                        {c.credential_url && (
                          <a
                            href={c.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2 mt-0.5"
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
              <SectionTitle>Awards</SectionTitle>
              <div className="space-y-4">
                {unit.awards
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((a, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                        {a.date && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                            {formatDate(a.date)}
                          </p>
                        )}
                      </div>
                      {a.issuer && <p className="text-xs text-slate-500 dark:text-slate-400">{a.issuer}</p>}
                      {a.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {a.description}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {unit.languages.length > 0 && (
            <section data-section="languages">
              <SectionTitle>Languages</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {unit.languages.map((l, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-semibold">{l.name}</span>
                    <span className="text-slate-400 dark:text-slate-500 ml-1.5">{l.level}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Custom Sections */}
          {customSectionsWithItems.map((cs, i) => (
            <section key={i} data-section={`custom-${cs.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <SectionTitle>{cs.title}</SectionTitle>
              <div className="space-y-6">
                {cs.items
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((item, ii) => (
                    <div key={ii}>
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                        {(item.from_date || item.to_date) && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                            {formatDate(item.from_date)} – {formatDate(item.to_date)}
                          </p>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                      )}
                      {item.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2 mt-0.5"
                        >
                          <ExternalLink size={10} /> View
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Footer contact ───────────────────────────────────────────────── */}
        <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {unit.first_name} {unit.last_name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{unit.headline}</p>
          </div>
          <a
            href={`mailto:${unit.email}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 transition-all"
          >
            <Mail size={15} /> {unit.email}
          </a>
        </div>
      </div>
    </div>
  );
}
