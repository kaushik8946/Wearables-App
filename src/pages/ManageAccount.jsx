import React, { useEffect, useState } from 'react';
import '../styles/pages/ManageAccount.css';

const fields = [
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'birthday', label: 'Birthday', type: 'date' },
  { key: 'height', label: 'Height', type: 'number', unit: 'cm' },
  { key: 'weight', label: 'Weight', type: 'number', unit: 'kg' }
];

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

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('currentUser')) || {};
    setUser(u);
  }, []);

  const handleEdit = (key) => {
    setEditKey(key);
    setEditValue(user[key] || '');
  };

  const handleSave = (key) => {
    const updated = { ...user, [key]: editValue };
    setUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
    setEditKey(null);
    setEditValue('');
  };

  const handleInput = (e) => setEditValue(e.target.value);

  return (
    <div className="manageaccount-bg">
      <div className="manage-account-root">
        <div className="manage-account-container profile-style">
          <h1 className="manage-account-title">Profile</h1>
          <p className="manage-account-desc">Update your personal info for best fitness insights</p>
          <div className="profile-list">
            {fields.map(({ key, label, type, options, unit }) => (
              <div className="profile-row" key={key}>
                {/* Top row: label and value/add */}
                <div className="profile-row-main">
                  <span className="profile-label">{label}</span>
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
                      <input type="number" value={editValue} onChange={handleInput} className="profile-input modern-input" min="0" />
                    )}
                    <button className="profile-save-btn" onClick={() => handleSave(key)}>Save</button>
                    <button className="profile-cancel-btn" onClick={() => setEditKey(null)}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAccount;
