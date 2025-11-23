import { Footprints, Clock, Flame } from 'lucide-react';

// ActivityRings component - integrated to show Steps/Active/Calories in rings
const ActivityRings = ({ steps = null, stepsGoal = 8000, active = null, activeGoal = 60, cals = null, calsGoal = 800 }) => {
  const ringProps = [
    { value: steps, goal: stepsGoal, color: '#21bf73', bgColor: '#b3eac2', radius: 70, stroke: 18 },
    { value: active, goal: activeGoal, color: '#268ed9', bgColor: '#b0dbf6', radius: 52, stroke: 18 },
    { value: cals, goal: calsGoal, color: '#e04085', bgColor: '#fdc5ec', radius: 32, stroke: 18 }
  ];

  const rotate = 'rotate(-90 100 100)';

  return (
    <div className="activity-rings-container">
      <svg className="activity-rings-graphic" width="200" height="200" viewBox="0 0 200 200">
        {ringProps.map((ring, idx) => {
          const progress = (ring.value == null) ? 0 : Math.min(ring.value / ring.goal, 1);
          const circum = 2 * Math.PI * ring.radius;
          return (
            <g key={idx}>
              <circle cx="100" cy="100" r={ring.radius} fill="none" stroke={ring.bgColor} strokeWidth={ring.stroke} style={{ opacity: 0.7 }} transform={rotate} />
              <circle cx="100" cy="100" r={ring.radius} fill="none" stroke={ring.color} strokeWidth={ring.stroke} strokeDasharray={circum} strokeDashoffset={circum * (1 - progress)} strokeLinecap="round" style={{ opacity: 0.93 }} transform={rotate} />
            </g>
          );
        })}
        <circle cx="100" cy="100" r="22" fill="#f0f4fa" />
      </svg>

      <div className="activity-rings-stats-row">
        <div className="stat-col">
          <Footprints className="activity-ring-icon" size={20} style={{ color: '#21bf73' }} />
          <span className="stat-value">{steps == null ? '—' : String(steps).toLocaleString()}</span>
          <span className="stat-label">Steps</span>
          <span className="stat-goal">/ {stepsGoal.toLocaleString()}</span>
        </div>

        <div className="stat-col">
          <Clock className="activity-ring-icon" size={20} style={{ color: '#268ed9' }} />
          <span className="stat-value">{active == null ? '—' : String(active)}</span>
          <span className="stat-label">Active time</span>
          <span className="stat-goal">/ {activeGoal} mins</span>
        </div>

        <div className="stat-col">
          <Flame className="activity-ring-icon" size={20} style={{ color: '#e04085' }} />
          <span className="stat-value">{cals == null ? '—' : String(cals)}</span>
          <span className="stat-label">Activity calories</span>
          <span className="stat-goal">/ {calsGoal.toLocaleString()} kcal</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityRings;
