import { useId } from 'react';

/**
 * Logo mark for Personal Website Builder.
 * Design: indigo gradient square → browser chrome (3 dots + URL bar) → person silhouette.
 * Uses useId() so multiple instances on one page never share gradient/clip IDs.
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  const uid  = useId().replace(/:/g, '');
  const gId  = `pwb-g-${uid}`;
  const cId  = `pwb-c-${uid}`;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <clipPath id={cId}>
          <rect width="40" height="40" rx="10" />
        </clipPath>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="10" fill={`url(#${gId})`} />

      {/* Subtle inner shadow ring */}
      <rect width="40" height="40" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* Browser chrome bar */}
      <rect x="5" y="5" width="30" height="9.5" rx="2.5" fill="rgba(0,0,0,0.25)" />

      {/* Three window dots */}
      <circle cx="9.5"  cy="9.75" r="1.5" fill="rgba(255,255,255,0.55)" />
      <circle cx="14"   cy="9.75" r="1.5" fill="rgba(255,255,255,0.55)" />
      <circle cx="18.5" cy="9.75" r="1.5" fill="rgba(255,255,255,0.55)" />

      {/* URL bar */}
      <rect x="22" y="7.25" width="10" height="5" rx="2.5" fill="rgba(255,255,255,0.2)" />

      {/* Separator line under chrome */}
      <rect x="5" y="15.5" width="30" height="0.75" rx="0.375" fill="rgba(255,255,255,0.08)" />

      {/* Person silhouette — clipped to rounded square */}
      <g clipPath={`url(#${cId})`}>
        {/* Head */}
        <circle cx="20" cy="24" r="5.5" fill="white" fillOpacity="0.95" />
        {/* Body / shoulders */}
        <ellipse cx="20" cy="40" rx="13.5" ry="8.5" fill="white" fillOpacity="0.85" />
      </g>
    </svg>
  );
}
