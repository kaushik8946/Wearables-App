import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { idbGetJSON, idbSetJSON, emitUserChange, idbClear } from '../data/db';
import '../styles/pages/ManageAccount.css';


const fields = [
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'birthday', label: 'Birthday', type: 'date' },
  { key: 'age', label: 'Age', type: 'readonly' },
  { key: 'height', label: 'Height', type: 'number', unit: 'cm' },
  { key: 'weight', label: 'Weight', type: 'number', unit: 'kg' }
];


function calculateAge(birthday) {
  if (!birthday) return '';
  const birth = new Date(birthday);
  if (isNaN(birth)) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}


function formatBirthday(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}


const ManageAccount = () => {
  const [user, setUser] = useState({});
  const [editKey, setEditKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const u = await idbGetJSON('currentUser', {});
        if (!isMounted) return;
        if (u.birthday) {
          const age = calculateAge(u.birthday);
          if (u.age !== age) {
            u.age = age;
            await idbSetJSON('currentUser', u);
          }
        }
        setUser(u);
      } catch (err) {
        console.error('Failed to load profile info', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);


  const handleEdit = (key) => {
    setEditKey(key);
    setEditValue(user[key] || '');
  };


  const handleSave = async (key) => {
    // Birthday validation: must be a past date
    if (key === 'birthday') {
      const today = new Date();
      const inputDate = new Date(editValue);
      if (!editValue || isNaN(inputDate) || inputDate >= today.setHours(0,0,0,0)) {
        setError('Birthday must be a valid past date.');
        return;
      }
    }
    let updated = { ...user, [key]: editValue };
    // If birthday is updated, recalculate age
    if (key === 'birthday') {
      updated.age = calculateAge(editValue);
    }
    setUser(updated);
    await idbSetJSON('currentUser', updated);
    emitUserChange();
    setEditKey(null);
    setEditValue('');
    setError('');
  };


  const handleInput = (e) => setEditValue(e.target.value);

  const handleLogout = async () => {
    try {
      await idbClear();
    } catch (err) {
      console.error('Failed to clear IndexedDB during logout', err);
    }
    sessionStorage.clear();
    navigate('/', { replace: true });
  };

  return (
    <div className="manageaccount-bg">
      <div className="manage-account-root">
        <div className="manage-account-container profile-style">
          <h1 className="manage-account-title">Profile</h1>
          <p className="manage-account-desc">Update your personal info for best fitness insights</p>
          <div className="profile-list">
            {fields.map(({ key, label, type, options, unit }) => {
              if (key === 'age') {
                // Age is calculated from birthday
                const age = calculateAge(user.birthday);
                return (
                  <div className="profile-row" key={key}>
                    <div className="profile-row-main">
                      <span className="profile-label">{label}</span>
                      <span className="profile-value" style={{ cursor: 'default', color: '#222' }}>{age ? age : <span className="profile-placeholder">--</span>}</span>
                    </div>
                  </div>
                );
              }
              // Add unit hint for height and weight
              let labelWithUnit = label;
              if (key === 'height' && unit) labelWithUnit = `${label} (${unit})`;
              if (key === 'weight' && unit) labelWithUnit = `${label} (${unit})`;
              return (
                <div className="profile-row" key={key}>
                  {/* Top row: label and value/add */}
                  <div className="profile-row-main">
                    <span className="profile-label">{labelWithUnit}</span>
                    {(editKey !== key) && (
                      user[key]
                        ? <span
                            className="profile-value"
                            onClick={() => handleEdit(key)}
                            tabIndex={0}
                            role="button"
                          >
                            {
                              key === 'birthday'
                                ? formatBirthday(user[key])
                                : unit
                                  ? `${user[key]}${unit}`
                                  : user[key]
                            }
                          </span>
                        : <button
                            className="profile-add-btn"
                            onClick={() => handleEdit(key)}
                            type="button"
                          >
                            Add
                          </button>
                    )}
                  </div>
                  {/* Second row: input + buttons */}
                  {editKey === key && (
                    <div className="profile-row-edit">
                      {type === 'select' ? (
                        <select value={editValue} onChange={handleInput} className="profile-input modern-input">
                          <option value="">Select</option>
                          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : type === 'date' ? (
                        <input type="date" value={editValue} onChange={handleInput} className="profile-input modern-input" />
                      ) : (
                        <input
                          type="number"
                          value={editValue}
                          onChange={handleInput}
                          className="profile-input modern-input"
                          min="1"
                          step="any"
                          inputMode="decimal"
                          pattern="[0-9]*"
                        />
                      )}
                      <button className="profile-save-btn" onClick={() => handleSave(key)}>Save</button>
                      <button className="profile-cancel-btn" onClick={() => setEditKey(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Logout Button */}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
          
          {/* Error Modal Popup */}
          {error && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-title">Invalid Birthday</div>
                <div className="modal-message">{error}</div>
                <button className="modal-close-btn" onClick={() => setError('')}>OK</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default ManageAccount;
