import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Clock, Globe, ChevronDown, CheckCircle2, TrendingUp, Award, MapPin } from 'lucide-react';
import { jobTrackerApi } from '@/lib/plugins-api';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { cn } from '@/lib/utils';

const TIMEZONES = [
  { value: 'Local', label: 'Local' },
  { value: 'America/New_York', label: 'Eastern' },
  { value: 'America/Chicago', label: 'Central' },
  { value: 'America/Denver', label: 'Mountain' },
  { value: 'America/Los_Angeles', label: 'Pacific' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Kolkata', label: 'India' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

const GOAL_OPTIONS = [5, 10, 15, 20, 25];

const FUNNEL_STAGES = [
  { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { key: 'interview', label: 'Interview', color: 'bg-amber-500' },
  { key: 'offer', label: 'Offer', color: 'bg-emerald-500' },
];

function getResolvedTimezone(pref: string | null | undefined): string {
  if (pref && pref !== 'Local') return pref;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/New_York';
  }
}

export function PipelineStatsCard() {
  const { dashboardStats, preferences, fetchDashboard, fetchPreferences, setPreferences } = useJobTrackerStore();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [showGoalMenu, setShowGoalMenu] = useState(false);
  const [showTzMenu, setShowTzMenu] = useState(false);

  const prefTimezone = preferences?.timezone || 'America/New_York';
  const effectiveTimezone = getResolvedTimezone(prefTimezone);
  const dailyGoal = preferences?.dailyGoal ?? 10;
  const todayCount = dashboardStats?.applicationsToday ?? 0;
  const totalCount = dashboardStats?.totalApplications ?? 0;
  const goalProgress = Math.min(todayCount / dailyGoal, 1);
  const goalReached = dailyGoal > 0 && todayCount >= dailyGoal;
  const responseRate = dashboardStats?.responseRate ?? 0;
  const successRate = dashboardStats?.successRate ?? 0;
  const statusCounts = dashboardStats?.statusCounts ?? {};
  const upcomingTasks = dashboardStats?.upcomingTasks ?? [];

  // Fetch preferences first, then dashboard - avoids race where two fetches overwrite each other
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchPreferences();
      if (cancelled) return;
      const tz = prefTimezone === 'Local' ? getResolvedTimezone('Local') : prefTimezone;
      await fetchDashboard(tz || undefined);
    })();
    return () => { cancelled = true; };
  }, [fetchPreferences, fetchDashboard, prefTimezone]);

  useEffect(() => {
    const updateTime = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: effectiveTimezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: effectiveTimezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        setCurrentTime(formatter.format(new Date()));
        setCurrentDate(dateFormatter.format(new Date()));
      } catch {
        setCurrentTime('--:--');
        setCurrentDate('--');
      }
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, [effectiveTimezone]);

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

  const setTimezone = async (tz: string) => {
    if (tz === prefTimezone) return;
    try {
      await jobTrackerApi.updatePreferences({ timezone: tz });
      setPreferences(preferences ? { ...preferences, timezone: tz } : { dailyGoal: 10, timezone: tz });
      setShowTzMenu(false);
      const resolved = tz === 'Local' ? getResolvedTimezone('Local') : tz;
      fetchDashboard(resolved);
    } catch (e) {
      console.error(e);
    }
  };

  const tzLabel = TIMEZONES.find((t) => t.value === prefTimezone)?.label || (prefTimezone === 'Local' ? 'Local' : prefTimezone);
  const nextTask = upcomingTasks[0];

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      {/* Row 1: Main stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Today</span>
            <span className="text-xl font-bold text-sky-600">{todayCount}</span>
          </div>
          <div className="h-3 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-xl font-bold text-gray-900">{totalCount}</span>
          </div>
          <div className="h-3 w-px bg-gray-200" />
          {/* Goal progress */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowGoalMenu(!showGoalMenu)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                {goalReached ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                <span>{todayCount}/{dailyGoal}</span>
                {goalReached && <span className="text-xs text-emerald-600 font-medium">Goal reached</span>}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showGoalMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowGoalMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg border border-gray-200 shadow-lg py-1 min-w-[120px]">
                    <div className="px-3 py-1.5 text-xs text-gray-500">Daily goal</div>
                    {GOAL_OPTIONS.map((g) => (
                      <button
                        key={g}
                        onClick={() => setGoal(g)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-gray-50',
                          g === dailyGoal && 'bg-sky-50 text-sky-600 font-medium'
                        )}
                      >
                        {g} apps/day
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  goalProgress >= 1 ? 'bg-emerald-500' : 'bg-sky-500'
                )}
                style={{ width: `${goalProgress * 100}%` }}
              />
            </div>
          </div>
          {/* Response & success rates */}
          {(responseRate > 0 || successRate > 0) && (
            <>
              <div className="h-3 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <span title="Response rate" className="flex items-center gap-1 text-xs text-gray-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {responseRate}% response
                </span>
                <span title="Success rate" className="flex items-center gap-1 text-xs text-gray-500">
                  <Award className="w-3.5 h-3.5" />
                  {successRate}% success
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: Timezone + Date + Time */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowTzMenu(!showTzMenu)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <Globe className="w-4 h-4" />
              <span>{tzLabel}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showTzMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTzMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg border border-gray-200 shadow-lg py-1 max-h-48 overflow-y-auto min-w-[140px]">
                  {TIMEZONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTimezone(t.value)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-gray-50',
                        t.value === prefTimezone && 'bg-sky-50 text-sky-600 font-medium'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-gray-500">{currentDate}</span>
            <span className="font-mono tabular-nums">{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Mini funnel + upcoming task */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
        {/* Mini funnel */}
        <div className="flex items-center gap-1">
          {FUNNEL_STAGES.map((stage) => {
            const count = statusCounts[stage.key] ?? 0;
            const maxVal = Math.max(...FUNNEL_STAGES.map((s) => statusCounts[s.key] ?? 0), 1);
            const width = Math.max((count / maxVal) * 48, count > 0 ? 8 : 0);
            return (
              <div key={stage.key} className="flex items-center gap-1.5" title={`${stage.label}: ${count}`}>
                <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', stage.color)}
                    style={{ width: `${width}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-16 truncate">{stage.label}</span>
              </div>
            );
          })}
        </div>

        {/* Next upcoming task */}
        {nextTask && (
          <Link
            to={`/plugins/job-tracker/applications/${nextTask.jobApplication?.id}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-sky-600 transition-colors"
          >
            <MapPin className="w-4 h-4 text-amber-500" />
            <span className="truncate max-w-[200px]">
              Next: {nextTask.title}
              {nextTask.jobApplication && (
                <span className="text-gray-400"> @ {nextTask.jobApplication.company}</span>
              )}
              {nextTask.dueDate && (
                <span className="text-xs text-gray-400 ml-1">
                  ({new Date(nextTask.dueDate).toLocaleDateString()})
                </span>
              )}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
