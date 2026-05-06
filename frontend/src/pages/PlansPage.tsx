import { Check, Mail } from 'lucide-react';
import { clsx } from 'clsx';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuthStore } from '../store/authStore';
import { PLAN_LIMITS, PLAN_LABELS, type UserPlan } from '../types/api';

interface PlanConfig {
  plan: UserPlan;
  description: string;
  features: string[];
  highlight: boolean;
}

const PLANS: PlanConfig[] = [
  {
    plan: 'free',
    description: 'Get started and explore the platform.',
    features: ['1 PWBUnit', 'All CV templates', 'Public CV page', 'API access'],
    highlight: false,
  },
  {
    plan: 'pro',
    description: 'For professionals building their presence.',
    features: ['3 PWBUnits', 'All CV templates', 'Public CV page', 'API access'],
    highlight: true,
  },
  {
    plan: 'pro_plus',
    description: 'For teams and power users.',
    features: ['10 PWBUnits', 'All CV templates', 'Public CV page', 'API access'],
    highlight: false,
  },
  {
    plan: 'owner',
    description: 'Unlimited access, full control.',
    features: ['Unlimited PWBUnits', 'All CV templates', 'Public CV page', 'API access', 'Priority support'],
    highlight: false,
  },
];

const CARD_STYLES: Record<UserPlan, { border: string; badge: string; badgeText: string }> = {
  free:     { border: 'border-slate-200 dark:border-slate-700/60',   badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',        badgeText: 'Free'    },
  pro:      { border: 'border-blue-500/60 ring-1 ring-blue-500/20',  badge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',           badgeText: 'Pro'     },
  pro_plus: { border: 'border-violet-500/50',                        badge: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',   badgeText: 'Pro+'    },
  owner:    { border: 'border-amber-500/50',                         badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',        badgeText: 'Owner'   },
};

const PLANS_ORDER: UserPlan[] = ['free', 'pro', 'pro_plus', 'owner'];

function limitLabel(plan: UserPlan): string {
  const n = PLAN_LIMITS[plan];
  return n === null ? 'Unlimited' : `${n} PWBUnit${n === 1 ? '' : 's'}`;
}

export function PlansPage() {
  const { user } = useAuthStore();
  const currentPlan = user?.plan ?? 'free';
  const currentIdx = PLANS_ORDER.indexOf(currentPlan);

  return (
    <DashboardLayout>
      <div className="page-enter">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Plans</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your current plan:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {PLAN_LABELS[currentPlan]}
            </span>
            {' · '}
            {limitLabel(currentPlan)}
          </p>
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map(({ plan, description, features, highlight }) => {
            const styles = CARD_STYLES[plan];
            const isCurrent = plan === currentPlan;
            const planIdx = PLANS_ORDER.indexOf(plan);
            const isUpgrade = planIdx > currentIdx;
            const isDowngrade = planIdx < currentIdx;

            return (
              <div
                key={plan}
                className={clsx(
                  'relative flex flex-col rounded-xl border bg-white dark:bg-slate-900 p-5 transition-all duration-200',
                  styles.border,
                  isCurrent && 'shadow-md dark:shadow-[0_4px_24px_rgba(0,0,0,.35)]',
                )}
              >
                {/* Current plan ribbon */}
                {isCurrent && (
                  <span className="absolute -top-px left-4 right-4 h-0.5 rounded-b bg-primary-500/60" />
                )}

                {/* Plan name + badge */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {PLAN_LABELS[plan]}
                  </h2>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                      Current
                    </span>
                  )}
                  {!isCurrent && (
                    <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', styles.badge)}>
                      {styles.badgeText}
                    </span>
                  )}
                </div>

                {/* Limit highlight */}
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
                  {limitLabel(plan)}
                </p>
                <p className="text-xs text-slate-500 mb-5">{description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Check className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="text-center text-xs text-slate-400 py-2">You are on this plan</div>
                ) : isUpgrade ? (
                  <a
                    href={`mailto:bliznukantonmain@gmail.com?subject=Upgrade request — ${PLAN_LABELS[plan]} plan`}
                    className={clsx(
                      'flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150',
                      highlight
                        ? 'bg-primary-600 text-white hover:bg-primary-500 hover:shadow-glow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700',
                    )}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Contact to upgrade
                  </a>
                ) : isDowngrade ? (
                  <a
                    href={`mailto:bliznukantonmain@gmail.com?subject=Plan change request — ${PLAN_LABELS[plan]} plan`}
                    className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Contact to change
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-slate-400">
          To change your plan, email{' '}
          <a
            href="mailto:bliznukantonmain@gmail.com"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            bliznukantonmain@gmail.com
          </a>
          {' '}and the plan will be updated manually.
        </p>
      </div>
    </DashboardLayout>
  );
}
