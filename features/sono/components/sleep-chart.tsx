"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisStyle = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

// 4–6h amber, <4h red, >=7h green, 6–7h primary
function barColor(hours: number): string {
  if (hours >= 7) return "hsl(var(--success))";
  if (hours >= 6) return "hsl(var(--primary))";
  if (hours >= 4) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

export function SleepChart({
  data,
}: {
  data: { label: string; hours: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        Registre algumas noites pra ver a tendência. 🌙
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <ReferenceLine y={8} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={12} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} unit="h" domain={[0, 12]} />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                <p className="mb-0.5 font-medium">{String(label)}</p>
                <p className="tabular-nums">{Number(payload[0]?.value).toFixed(1)} h</p>
              </div>
            ) : null
          }
        />
        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.label} fill={barColor(d.hours)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
