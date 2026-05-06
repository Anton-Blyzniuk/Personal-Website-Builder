import React from 'react';
import type { PWBUnit } from '../../types/api';

interface TemplateProps {
  unit: PWBUnit;
}

function formatDate(dateStr: string | null | undefined, fallback = 'Present'): string {
  if (!dateStr) return fallback;
  const parts = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
      {children}
    </h2>
  );
}

function Divider() {
  return <hr className="border-slate-200 dark:border-slate-800 my-6" />;
}

export function MinimalTemplate({ unit }: TemplateProps) {
  const mainPhoto = unit.photos.find((p) => p.is_main) ?? unit.photos[0];

  const skillsByCategory = unit.skills
    .slice()
    .sort((a, b) => a.order - b.order)
    .reduce<Record<string, typeof unit.skills>>((acc, skill) => {
      const cat = skill.category ?? 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    }, {});

  const contactParts = [unit.email, unit.phone, unit.location].filter(Boolean) as string[];

  const customSectionsWithItems = unit.custom_sections
    .filter((cs) => cs.items.length > 0)
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <div className="cv-page bg-white dark:bg-slate-950 min-h-screen">
      <div className="max-w-2xl mx-auto py-10 sm:py-12 px-4 sm:px-8">
        {/* Name & headline */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 break-words">
              {unit.first_name} {unit.last_name}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">{unit.headline}</p>
          </div>
          {mainPhoto && (
            <img
              src={mainPhoto.image}
              alt={unit.first_name}
              className="h-16 w-16 rounded-full object-cover shrink-0"
            />
          )}
        </div>

        {/* Contact inline */}
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{contactParts.join(' · ')}</p>

        {/* Links inline */}
        {unit.links.length > 0 && (
          <div className="flex flex-wrap gap-x-3 mt-1">
            {unit.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-900 dark:text-slate-100 underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {l.name}
              </a>
            ))}
          </div>
        )}

        {/* About */}
        {unit.about && (
          <>
            <Divider />
            <SectionTitle>About</SectionTitle>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{unit.about}</p>
          </>
        )}

        {/* Experience */}
        {unit.experience_units.length > 0 && (
          <>
            <Divider />
            <SectionTitle>Experience</SectionTitle>
            <div className="space-y-5">
              {unit.experience_units
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((e) => (
                  <div key={e.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {e.title}
                        {e.organization ? ` @ ${e.organization}` : ''}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                        {e.location && `${e.location} · `}
                        {formatDate(e.from_date)} – {formatDate(e.to_date)}
                      </p>
                    </div>
                    {e.description && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {e.description}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Education */}
        {unit.education_units.length > 0 && (
          <>
            <Divider />
            <SectionTitle>Education</SectionTitle>
            <div className="space-y-4">
              {unit.education_units
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((e) => (
                  <div key={e.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{e.institution}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
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
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{e.description}</p>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Skills */}
        {unit.skills.length > 0 && (
          <>
            <Divider />
            <SectionTitle>Skills</SectionTitle>
            <div className="space-y-2">
              {Object.entries(skillsByCategory).map(([cat, skills]) => (
                <p key={cat} className="text-sm text-slate-700 dark:text-slate-300">
                  {Object.keys(skillsByCategory).length > 1 && (
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{cat}: </span>
                  )}
                  {skills.map((s) => s.name).join(', ')}
                </p>
              ))}
            </div>
          </>
        )}

        {/* Languages */}
        {unit.languages.length > 0 && (
          <>
            <Divider />
            <SectionTitle>Languages</SectionTitle>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {unit.languages.map((l) => `${l.name} (${l.level})`).join(' · ')}
            </p>
          </>
        )}

        {/* Certifications */}
        {unit.certifications.length > 0 && (
          <>
            <Divider />
            <SectionTitle>Certifications</SectionTitle>
            <div className="space-y-3">
              {unit.certifications
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((c, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {c.issuing_organization}
                      {c.issue_date ? ` · ${formatDate(c.issue_date)}` : ''}
                    </p>
                    {c.credential_url && (
                      <a
                        href={c.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-900 dark:text-slate-100 underline underline-offset-2"
                      >
                        View credential
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Awards */}
        {unit.awards.length > 0 && (
          <>
            <Divider />
            <SectionTitle>Awards</SectionTitle>
            <div className="space-y-3">
              {unit.awards
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((a, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                      {a.date && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                          {formatDate(a.date)}
                        </p>
                      )}
                    </div>
                    {a.issuer && <p className="text-sm text-slate-500 dark:text-slate-400">{a.issuer}</p>}
                    {a.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{a.description}</p>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Portfolio */}
        {unit.portfolio_items.length > 0 && (
          <>
            <Divider />
            <SectionTitle>Portfolio</SectionTitle>
            <div className="space-y-4">
              {unit.portfolio_items
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((p) => (
                  <div key={p.id}>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {p.title}
                      {p.category ? ` — ${p.category}` : ''}
                    </p>
                    {p.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{p.description}</p>
                    )}
                    {p.links.length > 0 && (
                      <div className="flex gap-3 mt-1">
                        {p.links.map((l, i) => (
                          <a
                            key={i}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-900 dark:text-slate-100 underline underline-offset-2"
                          >
                            {l.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Custom Sections */}
        {customSectionsWithItems.map((cs, i) => (
          <React.Fragment key={i}>
            <Divider />
            <SectionTitle>{cs.title}</SectionTitle>
            <div className="space-y-3">
              {cs.items
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((item, ii) => (
                  <div key={ii}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                      {(item.from_date || item.to_date) && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                          {formatDate(item.from_date)} – {formatDate(item.to_date)}
                        </p>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                    )}
                    {item.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-900 dark:text-slate-100 underline underline-offset-2"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
