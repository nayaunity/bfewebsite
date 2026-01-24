"use client";

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
}

export function LineChart({ data, title, color = "#ffe500" }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--gray-600)]">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;
  const range = maxValue - minValue;

  // Chart dimensions
  const width = 100;
  const height = 50;
  const padding = { top: 5, right: 5, bottom: 5, left: 5 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Area path (for gradient fill)
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
      <h3 className="font-semibold text-[var(--foreground)] mb-4">{title}</h3>

      {/* Chart */}
      <div className="relative h-48">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id={`gradient-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="var(--card-border)"
              strokeWidth="0.2"
            />
          ))}

          {/* Area fill */}
          <path
            d={areaD}
            fill={`url(#gradient-${title.replace(/\s/g, "")})`}
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1"
              fill={color}
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-[var(--gray-600)] -translate-x-full pr-2">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue / 2)}</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-[var(--gray-600)]">
        {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1).map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>

      {/* Summary */}
      <div className="flex gap-4 mt-4 pt-4 border-t border-[var(--card-border)]">
        <div>
          <p className="text-xs text-[var(--gray-600)]">Today</p>
          <p className="text-lg font-bold text-[var(--foreground)]">{data[data.length - 1]?.value || 0}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--gray-600)]">Average</p>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--gray-600)]">Peak</p>
          <p className="text-lg font-bold text-[var(--foreground)]">{maxValue}</p>
        </div>
      </div>
    </div>
  );
}
