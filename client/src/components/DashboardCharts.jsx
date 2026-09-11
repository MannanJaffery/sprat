import { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from 'recharts';

const GRID_COLOR = '#E7E1D2';
const AXIS_COLOR = '#A9A497';
const TREND_COLOR = '#9A7720';

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-soft">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold text-text-primary">
          {formatter ? formatter(entry) : entry.value}
        </p>
      ))}
    </div>
  );
}

// Trend over time — a single series, so no legend (the title already names it).
export function ProjectsTrendChart({ projects }) {
  const data = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i * 7 - now.getDay());
      start.setHours(0, 0, 0, 0);
      weeks.push({ start, label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: 0 });
    }
    for (const p of projects) {
      const created = new Date(`${p.created_at}Z`);
      for (let i = weeks.length - 1; i >= 0; i--) {
        if (created >= weeks[i].start) {
          weeks[i].count += 1;
          break;
        }
      }
    }
    return weeks.map((w) => ({ label: w.label, count: w.count }));
  }, [projects]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TREND_COLOR} stopOpacity={0.22} />
            <stop offset="100%" stopColor={TREND_COLOR} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          content={<ChartTooltip formatter={(e) => `${e.value} project${e.value === 1 ? '' : 's'}`} />}
          cursor={{ stroke: GRID_COLOR }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={TREND_COLOR}
          strokeWidth={2}
          fill="url(#trendFill)"
          activeDot={{ r: 4, fill: TREND_COLOR, stroke: '#FAF7F0', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const STATUS_SLOTS = [
  { key: 'member', label: 'Member', color: '#5C7A3D' },
  { key: 'pending', label: 'Pending request', color: '#C2760C' },
  { key: 'other', label: 'Not joined', color: '#D8D2C2' },
];

// Part-to-whole across a fixed, small set of status values (not arbitrary
// categorical identity) — status colors are paired with a legend + direct
// count labels rather than relying on color alone.
export function MembershipBreakdownChart({ projects }) {
  const counts = useMemo(() => {
    let member = 0;
    let pending = 0;
    let other = 0;
    for (const p of projects) {
      if (p.is_member) member += 1;
      else if (p.join_request_status === 'pending') pending += 1;
      else other += 1;
    }
    return { member, pending, other };
  }, [projects]);

  const data = [{ name: 'Projects', ...counts }];
  const total = counts.member + counts.pending + counts.other;

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={64}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }} barSize={22}>
          <XAxis type="number" hide domain={[0, Math.max(total, 1)]} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(e) => {
                  const slot = STATUS_SLOTS.find((s) => s.key === e.dataKey);
                  return `${slot?.label}: ${e.value}`;
                }}
              />
            }
            cursor={{ fill: 'transparent' }}
          />
          {STATUS_SLOTS.map((slot, i) => (
            <Bar
              key={slot.key}
              dataKey={slot.key}
              stackId="status"
              fill={slot.color}
              stroke="#FAF7F0"
              strokeWidth={2}
              radius={
                i === 0
                  ? [4, 0, 0, 4]
                  : i === STATUS_SLOTS.length - 1
                  ? [0, 4, 4, 0]
                  : 0
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {STATUS_SLOTS.map((slot) => (
          <span key={slot.key} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slot.color }} />
            {slot.label} <strong className="text-text-primary">{counts[slot.key]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
