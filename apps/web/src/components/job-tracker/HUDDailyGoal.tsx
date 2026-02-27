import { useState, useEffect } from 'react';
import { Target, CheckCircle2, ChevronDown } from 'lucide-react';
import { jobTrackerApi } from '@/lib/plugins-api';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { cn } from '@/lib/utils';

const GOAL_OPTIONS = [5, 10, 15, 20, 25];

export function HUDDailyGoal() {
  const { dashboardStats, preferences, fetchDashboard, fetchPreferences, setPreferences } = useJobTrackerStore();
  const [showGoalMenu, setShowGoalMenu] = useState(false);

  const dailyGoal = preferences?.dailyGoal ?? 10;
  const todayCount = dashboardStats?.applicationsToday ?? 0;
  const goalProgress = Math.min(todayCount / dailyGoal, 1);
  const goalReached = dailyGoal > 0 && todayCount >= dailyGoal;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchPreferences();
      if (cancelled) return;
      await fetchDashboard();
    })();
    return () => { cancelled = true; };
  }, [fetchPreferences, fetchDashboard]);

  const setGoal = async (goal: number) => {
    if (goal === dailyGoal) return;
    try {
      await jobTrackerApi.updatePreferences({ dailyGoal: goal });
      setPreferences(preferences ? { ...preferences, dailyGoal: goal } : { dailyGoal: goal, timezone: null });
      setShowGoalMenu(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowGoalMenu(!showGoalMenu)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors hover:border-cyan-500/50"
        style={{
          borderColor: 'rgba(0,255,255,0.25)',
          background: 'rgba(10,24,38,0.5)',
          color: goalReached ? '#34d399' : '#67e8f9',
        }}
      >
        {goalReached ? (
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
        ) : (
          <Target className="w-3.5 h-3.5" style={{ color: '#22d3ee' }} />
        )}
        <span className="text-[10px] font-bold tracking-wider">
          {todayCount}/{dailyGoal}
        </span>
        <span className="text-[9px] opacity-75 hidden sm:inline">TODAY</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>
      {/* Progress bar */}
      <div
        className="mt-1.5 h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(0,255,255,0.1)' }}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', goalReached ? '' : '')}
          style={{
            width: `${goalProgress * 100}%`,
            background: goalReached ? 'linear-gradient(90deg, #34d399, #22c55e)' : 'linear-gradient(90deg, #22d3ee, #06b6d4)',
          }}
        />
      </div>
      {showGoalMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowGoalMenu(false)} aria-hidden="true" />
          <div
            className="absolute left-0 top-full mt-1 z-20 py-1 min-w-[120px] rounded-lg border"
            style={{
              background: 'rgba(6,13,22,0.98)',
              borderColor: 'rgba(0,255,255,0.3)',
            }}
          >
            <div className="px-3 py-1.5 text-[9px] font-bold tracking-wider" style={{ color: 'rgba(0,255,255,0.6)' }}>
              DAILY GOAL
            </div>
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={cn(
                  'w-full px-3 py-2 text-left text-xs transition-colors',
                  g === dailyGoal && 'font-bold'
                )}
                style={{
                  color: g === dailyGoal ? '#22d3ee' : 'rgba(0,255,255,0.8)',
                  background: g === dailyGoal ? 'rgba(0,255,255,0.1)' : 'transparent',
                }}
              >
                {g} apps/day
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
