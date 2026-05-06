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

const CAT_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
];

export function ModernTemplate({ unit }: TemplateProps) {
  const mainPhoto = unit.photos.find((p) => p.is_main) ?? unit.photos[0];
  const initial = unit.first_name[0]?.toUpperCase() ?? '?';

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

  const hasBottomRow =
    unit.certifications.length > 0 || unit.awards.length > 0 || unit.languages.length > 0;

  return (
    <div className="cv-page bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-8 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold break-words">{unit.first_name} {unit.last_name}</h1>
              <p className="text-blue-100 mt-2 text-lg sm:text-xl">{unit.headline}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm text-blue-100">
                <span>{unit.email}</span>
                {unit.phone && <span>{unit.phone}</span>}
                {unit.location && <span>{unit.location}</span>}
              </div>
              {unit.links.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {unit.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white underline underline-offset-2 hover:text-blue-200"
                    >
                      {l.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="shrink-0 self-start sm:self-auto">
              {mainPhoto ? (
                <img
                  src={mainPhoto.image}
                  alt={unit.first_name}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-white/30"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
                  {initial}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 space-y-6 mt-6">
          {/* About */}
          {unit.about && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3 mb-4">
                About
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{unit.about}</p>
            </div>
          )}

          {/* Experience */}
          {unit.experience_units.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3 mb-6">
                Experience
              </h2>
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                {unit.experience_units
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((e) => (
                    <div key={e.id} className="relative">
                      <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-blue-500" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{e.title}</p>
                          {e.organization && (
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                              {e.organization}
                              {e.location ? ` · ${e.location}` : ''}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                          {formatDate(e.from_date)} – {formatDate(e.to_date)}
                        </p>
                      </div>
                      {e.description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {e.description}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {unit.skills.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3 mb-4">
                Skills
              </h2>
              <div className="space-y-3">
                {Object.entries(skillsByCategory).map(([cat, skills]) => (
                  <div key={cat}>
                    {Object.keys(skillsByCategory).length > 1 && (
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                        {cat}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s, i) => (
                        <span
                          key={i}
                          className={`rounded-full px-3 py-1 text-sm font-medium ${catColorMap[cat]}`}
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

          {/* Education */}
          {unit.education_units.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3 mb-4">
                Education
              </h2>
              <div className="space-y-4">
                {unit.education_units
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((e) => (
                    <div key={e.id} className="flex gap-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-sm font-bold text-slate-500 dark:text-slate-400">
                        {e.institution[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{e.institution}</p>
                        {e.degree && (
                          <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {e.degree}
                            {e.field_of_study ? ` in ${e.field_of_study}` : ''}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(e.from_date)} – {formatDate(e.to_date)}
                        </p>
                        {e.description && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{e.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {unit.portfolio_items.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3 mb-4">
                Portfolio
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {unit.portfolio_items
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="border border-slate-100 dark:border-slate-700 rounded-xl p-4"
                    >
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <p className="font-semibold text-slate-900 dark:text-white">{p.title}</p>
                      {p.category && (
                        <p className="text-xs text-blue-500 dark:text-blue-400 mb-1">{p.category}</p>
                      )}
                      {p.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                          {p.description}
                        </p>
                      )}
                      {p.links.length > 0 && (
                        <div className="flex gap-2 mt-2">
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
            </div>
          )}

          {/* Certifications / Awards / Languages — 3-col grid */}
          {hasBottomRow && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {unit.certifications.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3 mb-3">
                    Certifications
                  </h2>
                  <div className="space-y-2">
                    {unit.certifications
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((c, i) => (
                        <div key={i}>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{c.issuing_organization}</p>
                          {c.credential_url && (
                            <a
                              href={c.credential_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              View
                            </a>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {unit.awards.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3 mb-3">
                    Awards
                  </h2>
                  <div className="space-y-2">
                    {unit.awards
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((a, i) => (
                        <div key={i}>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{a.title}</p>
                          {a.issuer && <p className="text-xs text-slate-500 dark:text-slate-400">{a.issuer}</p>}
                          {a.date && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(a.date)}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {unit.languages.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3 mb-3">
                    Languages
                  </h2>
                  <div className="space-y-2">
                    {unit.languages.map((l, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{l.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{l.level}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Sections */}
          {unit.custom_sections
            .filter((cs) => cs.items.length > 0)
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((cs, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3 mb-4">
                  {cs.title}
                </h2>
                <div className="space-y-3">
                  {cs.items
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((item, ii) => (
                      <div
                        key={ii}
                        className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-3 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                            )}
                          </div>
                          {(item.from_date || item.to_date) && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                              {formatDate(item.from_date)} – {formatDate(item.to_date)}
                            </p>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline mt-1 block"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
