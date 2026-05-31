"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisStyle = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

export function ProgressChart({
  data,
}: {
  data: { label: string; kg: number }[];
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Registre o mesmo exercício (com carga) em pelo menos 2 treinos pra ver a
        evolução. 📈
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} unit="kg" />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                <p className="mb-0.5 font-medium">{String(label)}</p>
                <p className="tabular-nums">{Number(payload[0]?.value)} kg</p>
              </div>
            ) : null
          }
        />
        <Line type="monotone" dataKey="kg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
