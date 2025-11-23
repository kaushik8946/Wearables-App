// Helper for SVG Curved Lines (Heart Rate) - Now accepting hex color
const SineWave = ({ color = "#ffffff", width = 100, height = 50 }) => (
  <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
    <path
      d={`M0 ${height / 2} Q ${width / 4} ${height} ${width / 2} ${height / 2} T ${width} ${height / 2}`}
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Fill Area */}
    <path
      d={`M0 ${height / 2} Q ${width / 4} ${height} ${width / 2} ${height / 2} T ${width} ${height / 2} V ${height} H 0 Z`}
      fill={color}
      fillOpacity="0.2"
    />
  </svg>
);

export default SineWave;
