import React from 'react';
import '../styles/components/WeightHistory.css';

// Simple SVG sparkline for weight history
// props.data = [{date: "Nov 12", value: 72.3}, ...]
const WeightHistory = ({ data = [], height = 60 }) => {
  if (!data || data.length === 0) return null;

  const values = data.map(d => Number(d.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 280;
  const stepX = width / Math.max(1, data.length - 1);

  const points = data
    .map((d, i) => {
      const x = i * stepX;
      const y = height - ((Number(d.value) - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  // Build a path for smooth curve (polyline for simplicity)
  const polylinePath = data
    .map((d, i) => {
      const x = i * stepX;
      const y = height - ((Number(d.value) - min) / range) * height;
      return `${x} ${y}`;
    })
    .join(' L ');

  const lastValue = values[values.length - 1];
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

  return (
    <div className="weight-history">
      <div className="wh-header">
        <div className="wh-title">Past 7 days</div>
        <div className="wh-stats">Latest: <strong>{lastValue}</strong> · Avg: <strong>{avg}</strong></div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="wh-svg">
        <defs>
          <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#64c8ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#64c8ff" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area under the line */}
        <path d={`M 0 ${height} L ${points} L ${width} ${height} Z`} fill="url(#grad)" stroke="none" />

        {/* Line */}
        <path d={`M ${polylinePath}`} fill="none" stroke="#64c8ff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {data.map((d, i) => {
          const x = i * stepX;
          const y = height - ((Number(d.value) - min) / range) * height;
          return <circle key={i} cx={x} cy={y} r={2.5} fill="#007acc" />;
        })}
      </svg>

      <div className="wh-dates">
        {data.map((d, i) => (
          <div key={i} className="wh-date">{d.label}</div>
        ))}
      </div>
    </div>
  );
};

export default WeightHistory;
