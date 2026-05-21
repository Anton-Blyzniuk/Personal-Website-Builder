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

export function ClassicTemplate({ unit }: TemplateProps) {
  const mainPhoto = unit.photos.find((p) => p.is_main) ?? unit.photos[0];
  const initial = unit.first_name[0]?.toUpperCase() ?? '?';

  const skillsByCategory = unit.skills
    .slice()
    .sort((a, b) => a.order - b.order)
    .reduce<Record<string, typeof unit.skills>>((acc, skill) => {
      const cat = skill.category ?? 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    }, {});

  return (
    <div className="cv-page bg-white dark:bg-slate-950 min-h-screen max-w-4xl mx-auto shadow-lg">
      {/* Header */}
      <div className="bg-slate-900 text-white py-10 px-4 sm:px-8 flex items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold break-words">{unit.first_name} {unit.last_name}</h1>
          <p className="text-slate-300 mt-1 text-lg">{unit.headline}</p>
        </div>
        {mainPhoto ? (
          <img
            src={mainPhoto.image}
            alt={unit.first_name}
            className="h-20 w-20 rounded-full object-cover border-2 border-slate-600 shrink-0"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-slate-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initial}
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-[30%] bg-slate-50 dark:bg-slate-800 p-6 space-y-6">
          <section data-section="contact">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
              Contact
            </h2>
            <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <p>{unit.email}</p>
              {unit.phone && <p>{unit.phone}</p>}
              {unit.location && <p>{unit.location}</p>}
            </div>
          </section>

          {unit.skills.length > 0 && (
            <section data-section="skills">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                Skills
              </h2>
              <div className="space-y-3">
                {Object.entries(skillsByCategory).map(([cat, skills]) => (
                  <div key={cat}>
                    {cat !== 'Other' && (
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{cat}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {skills.map((s, i) => (
                        <span
                          key={i}
                          className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded px-2 py-0.5"
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

          {unit.languages.length > 0 && (
            <section data-section="languages">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                Languages
              </h2>
              <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {unit.languages.map((l, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{l.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">{l.level}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {unit.education_units.length > 0 && (
            <section data-section="education">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                Education
              </h2>
              <div className="space-y-3">
                {unit.education_units
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((e) => (
                    <div key={e.id} className="text-sm">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{e.institution}</p>
                      {e.degree && <p className="text-slate-600 dark:text-slate-400">{e.degree}</p>}
                      {e.field_of_study && (
                        <p className="text-slate-500 dark:text-slate-500 text-xs">{e.field_of_study}</p>
                      )}
                      <p className="text-slate-400 dark:text-slate-500 text-xs">
                        {formatDate(e.from_date, '?')} – {formatDate(e.to_date)}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {unit.links.length > 0 && (
            <section data-section="links">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                Links
              </h2>
              <div className="space-y-1">
                {unit.links.map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                  >
                    {l.name}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Main column */}
        <div className="flex-1 p-6 space-y-6">
          {unit.about && (
            <section data-section="about">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                About
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{unit.about}</p>
            </section>
          )}

          {unit.experience_units.length > 0 && (
            <section data-section="experience">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                Experience
              </h2>
              <div className="space-y-4">
                {unit.experience_units
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((e) => (
                    <div key={e.id} className="text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{e.title}</p>
                          {e.organization && (
                            <p className="text-slate-600 dark:text-slate-400">
                              {e.organization}
                              {e.location ? ` · ${e.location}` : ''}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                          {formatDate(e.from_date, '?')} – {formatDate(e.to_date)}
                        </p>
                      </div>
                      {e.description && (
                        <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">{e.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {unit.portfolio_items.length > 0 && (
            <section data-section="portfolio">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                Portfolio
              </h2>
              <div className="space-y-3">
                {unit.portfolio_items
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((p) => (
                    <div key={p.id} className="text-sm">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {p.title}
                        {p.category ? ` — ${p.category}` : ''}
                      </p>
                      {p.description && <p className="text-slate-600 dark:text-slate-300">{p.description}</p>}
                      {p.links.length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {p.links.map((l, i) => (
                            <a
                              key={i}
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {l.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {unit.certifications.length > 0 && (
            <section data-section="certifications">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                Certifications
              </h2>
              <div className="space-y-2">
                {unit.certifications
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((c, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {c.issuing_organization}
                        {c.issue_date ? ` · ${formatDate(c.issue_date)}` : ''}
                      </p>
                      {c.credential_url && (
                        <a
                          href={c.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View credential
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {unit.awards.length > 0 && (
            <section data-section="awards">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                Awards
              </h2>
              <div className="space-y-2">
                {unit.awards
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((a, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-semibold text-slate-900 dark:text-white">{a.title}</p>
                      {a.issuer && (
                        <p className="text-slate-500 dark:text-slate-400">
                          {a.issuer}
                          {a.date ? ` · ${formatDate(a.date)}` : ''}
                        </p>
                      )}
                      {a.description && <p className="text-slate-600 dark:text-slate-300">{a.description}</p>}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {unit.custom_sections
            .filter((cs) => cs.items.length > 0)
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((cs, i) => (
              <section key={i}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">
                  {cs.title}
                </h2>
                <div className="space-y-2">
                  {cs.items
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((item, ii) => (
                      <div key={ii} className="text-sm">
                        <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                        {item.subtitle && <p className="text-slate-500 dark:text-slate-400">{item.subtitle}</p>}
                        {(item.from_date || item.to_date) && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatDate(item.from_date)} – {formatDate(item.to_date)}
                          </p>
                        )}
                        {item.description && <p className="text-slate-600 dark:text-slate-300">{item.description}</p>}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}
