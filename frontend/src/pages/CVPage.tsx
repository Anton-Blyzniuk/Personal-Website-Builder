import { useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pwbUnitsApi } from '../api/pwbunits';
import { analyticsApi } from '../api/analytics';
import { ClassicTemplate } from '../components/cv-templates/ClassicTemplate';
import { ModernTemplate } from '../components/cv-templates/ModernTemplate';
import { MinimalTemplate } from '../components/cv-templates/MinimalTemplate';
import { Spinner } from '../components/ui/Spinner';

const TEMPLATE_MAP = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
} as const;

export function CVPage() {
  const { unitName } = useParams<{ unitName: string }>();
  const tracked = useRef(false);

  const { data: unit, isLoading, isError } = useQuery({
    queryKey: ['pwbunit-public', unitName],
    queryFn: () => pwbUnitsApi.get(unitName!),
    enabled: !!unitName,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!unit || tracked.current) return;
    tracked.current = true;
    analyticsApi.track(unit.unit_name, document.referrer);
  }, [unit]);

  useEffect(() => {
    if (!unit) return;
    document.title = `${unit.first_name} ${unit.last_name} — ${unit.headline}`;
    return () => { document.title = 'PWB — Personal Website Builder'; };
  }, [unit]);

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

  const Template = TEMPLATE_MAP[unit.template ?? 'classic'] ?? ClassicTemplate;
  return <Template unit={unit} />;
}
