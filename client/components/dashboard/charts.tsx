export function BarChart({
  items,
  valueLabel,
}: {
  items: Array<{ label: string; value: number }>;
  valueLabel?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-slate-600">{item.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${Math.round((item.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs font-medium text-slate-700">
            {item.value}
            {valueLabel ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ points }: { points: Array<{ label: string; value: number }> }) {
  const width = 560;
  const height = 180;
  const max = Math.max(...points.map((point) => point.value), 1);
  const min = 0;
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * (width - 24) + 12;
    const y = height - 28 - ((point.value - min) / (max - min || 1)) * (height - 48);
    return { x, y, ...point };
  });
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
      <path d={path} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
      {coords.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="3.5" fill="#4f46e5" />
          <text x={point.x} y={height - 8} textAnchor="middle" className="fill-slate-400" fontSize="10">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function StackedDayChart({
  days,
}: {
  days: Array<{ label: string; present: number; late: number; absent: number }>;
}) {
  const max = Math.max(...days.map((day) => day.present + day.late + day.absent), 1);
  return (
    <div className="flex h-48 items-end gap-2">
      {days.map((day) => (
        <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-40 w-full flex-col justify-end overflow-hidden rounded-md bg-slate-100">
            <div className="bg-rose-400" style={{ height: `${(day.absent / max) * 100}%` }} />
            <div className="bg-amber-400" style={{ height: `${(day.late / max) * 100}%` }} />
            <div className="bg-indigo-500" style={{ height: `${(day.present / max) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500">{day.label}</span>
        </div>
      ))}
    </div>
  );
}
