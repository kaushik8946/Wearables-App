import React, { useState } from 'react';
import '../styles/pages/ClassWorkout.css';

const ClassWorkout = () => {
  const [activeTab, setActiveTab] = useState('classes');

  return (
    <div className="classworkout-container">
      <div className="classworkout-tabs">
        <button
          className={`classworkout-tab${activeTab === 'classes' ? ' active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          Classes
        </button>
        <button
          className={`classworkout-tab${activeTab === 'workouts' ? ' active' : ''}`}
          onClick={() => setActiveTab('workouts')}
        >
          Workouts
        </button>
      </div>
      <div className="classworkout-content">
        {activeTab === 'classes' ? (
          <div>
            <h2 className="classworkout-title">Classes</h2>
            <p className="classworkout-desc">This is a placeholder for classes content.</p>
          </div>
        ) : (
          <div>
            <h2 className="classworkout-title">Workouts</h2>
            <p className="classworkout-desc">This is a placeholder for workouts content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassWorkout;
