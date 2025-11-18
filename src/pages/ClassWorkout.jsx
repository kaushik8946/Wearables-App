import React, { useState } from 'react';
import { MdVideoLibrary, MdFitnessCenter } from 'react-icons/md';
import '../styles/pages/ClassWorkout.css';
import mockData from '../data/mockData';
import Workout from './Workout';

const ClassWorkout = () => {
  const [activeTab, setActiveTab] = useState('classes');

  return (
    <div className="classworkout-bg">
      <div className="classworkout-tabs classworkout-tabs-fixed">
        <button
          className={`classworkout-tab${activeTab === 'classes' ? ' active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <span className="tab-icon" style={{ fontWeight: 'bold', color: '#111' }}><MdVideoLibrary size={22} style={{ fontWeight: 'bold', color: '#111' }} /></span>
          Classes
        </button>
        <button
          className={`classworkout-tab${activeTab === 'workouts' ? ' active' : ''}`}
          onClick={() => setActiveTab('workouts')}
        >
          <span className="tab-icon" style={{ fontWeight: 'bold', color: '#111' }}><MdFitnessCenter size={22} style={{ fontWeight: 'bold', color: '#111' }} /></span>
          Workouts
        </button>
      </div>
      <div className="classworkout-container">
        <div className="classworkout-content">
          {activeTab === 'classes' ? (
            <div className="cw-vertical-scroll">
              <h1 className="classworkout-title">Explore Classes</h1>
              <p className="classworkout-desc">Discover sessions across categories and levels.</p>
              {mockData.classCategories.map((cat) => (
                <div className="cw-category-section" key={cat.id}>
                  <div className="cw-category-title">{cat.name}</div>
                  <div className="cw-hscroll">
                    {cat.items.map((item) => (
                      <div className="cw-card modern-card" key={item.id}>
                        <img src={item.image} alt={item.title} />
                        <div className="cw-card-body">
                          <div className="cw-meta-row">
                            <span className="cw-level">{item.level}</span>
                            <span className="cw-duration">{item.duration}</span>
                          </div>
                          <div className="cw-card-title">{item.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Workout />
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassWorkout;
