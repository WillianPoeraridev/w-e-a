"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { formatBRL } from "@/lib/money";

const axisStyle = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

function TooltipBox({ label, rows }: { label?: string; rows: { name: string; value: number; color?: string }[] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {rows.map((r) => (
        <p key={r.name} className="flex items-center gap-2 tabular-nums">
          {r.color && <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} />}
          <span className="text-muted-foreground">{r.name}:</span>
          <span className="font-medium">{formatBRL(r.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function CategoryDonut({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  if (data.length === 0) {
    return <EmptyChart text="Sem gastos neste mês" />;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                rows={[
                  {
                    name: String(payload[0].name),
                    value: Number(payload[0].value),
                    color: payload[0].payload.color,
                  },
                ]}
              />
            ) : null
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={String(label)}
                rows={[
                  { name: "Entradas", value: Number(payload[0]?.value ?? 0), color: "hsl(var(--success))" },
                  { name: "Saídas", value: Number(payload[1]?.value ?? 0), color: "hsl(var(--destructive))" },
                ]}
              />
            ) : null
          }
        />
        <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#gIncome)" />
        <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#gExpense)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PersonBars({
  data,
}: {
  data: { name: string; income: number; expense: number; color: string }[];
}) {
  if (data.length === 0) return <EmptyChart text="Sem dados" />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={String(label)}
                rows={[
                  { name: "Entradas", value: Number(payload[0]?.value ?? 0), color: "hsl(var(--success))" },
                  { name: "Saídas", value: Number(payload[1]?.value ?? 0), color: "hsl(var(--destructive))" },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="income" radius={[4, 4, 0, 0]} fill="hsl(var(--success))" />
        <Bar dataKey="expense" radius={[4, 4, 0, 0]} fill="hsl(var(--destructive))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
