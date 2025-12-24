import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorageJSON, setStorageJSON, notifyUserChange, syncMedplusUsers } from '../../service';
import WarningModal from '../../common/WarningModal/WarningModal';
import './ManageAccount.css';


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
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [editKey, setEditKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const [medPlusCustomer, setMedPlusCustomer] = useState(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showNoCustomerModal, setShowNoCustomerModal] = useState(false);
  const [hasCheckedMedPlus, setHasCheckedMedPlus] = useState(false);


  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const u = await getStorageJSON('defaultUser', {});
        const medPlus = await getStorageJSON('medPlusCustomer', null);
        const hasChecked = await getStorageJSON('medPlusFirstCheckDone', false);
        if (!isMounted) return;
        if (u.birthday) {
          const age = calculateAge(u.birthday);
          if (u.age !== age) {
            u.age = age;
            await setStorageJSON('defaultUser', u);
          }
        }
        setUser(u);
        setMedPlusCustomer(medPlus);
        setHasCheckedMedPlus(hasChecked);
      } catch (err) {
        console.error('Failed to load profile info', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePairClick = async () => {
    if (!hasCheckedMedPlus) {
      // First time clicking - show "no customer found" modal
      setShowNoCustomerModal(true);
      await setStorageJSON('medPlusFirstCheckDone', true);
      setHasCheckedMedPlus(true);
    } else {
      // Already checked once - go to pairing page
      navigate('/medplus-pairing');
    }
  };


  const handleEdit = (key) => {
    setEditKey(key);
    setEditValue(user[key] || '');
  };


  const handleSave = async (key) => {
    // Birthday validation: must be a past date
    if (key === 'birthday') {
      const today = new Date();
      const inputDate = new Date(editValue);
      if (!editValue || isNaN(inputDate) || inputDate >= today.setHours(0, 0, 0, 0)) {
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
    await setStorageJSON('defaultUser', updated);

    // Also update registeredUser if it has the same ID
    const registeredUser = await getStorageJSON('registeredUser', null);
    if (registeredUser && String(registeredUser.id) === String(updated.id)) {
      await setStorageJSON('registeredUser', updated);
    }

    // Sync medplusUsers list
    await syncMedplusUsers();

    notifyUserChange();
    setEditKey(null);
    setEditValue('');
    setError('');
  };


  const handleInput = (e) => setEditValue(e.target.value);


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

          {/* MedPlus Customer ID Section */}
          {medPlusCustomer ? (
            <div className="medplus-linked-card">
              <div className="medplus-linked-header">
                <span className="medplus-linked-label">MedPlus Customer ID</span>
                <span className="medplus-linked-status">Linked</span>
              </div>
              <div className="medplus-linked-content">
                <span className="medplus-linked-id">{medPlusCustomer.customerId}</span>
                <button
                  className="medplus-unlink-btn"
                  type="button"
                  onClick={() => setShowUnlinkConfirm(true)}
                >
                  Unlink
                </button>
              </div>
            </div>
          ) : (
            <button
              className="medplus-pair-btn"
              type="button"
              onClick={handlePairClick}
            >
              Pair with MedPlus Customer ID
            </button>
          )}

          {/* Unlink Confirmation Modal */}
          {showUnlinkConfirm && (
            <div className="modal-overlay" onClick={() => setShowUnlinkConfirm(false)}>
              <div className="unlink-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="unlink-confirm-title">Unlink MedPlus ID?</div>
                <div className="unlink-confirm-message">
                  Are you sure you want to unlink your MedPlus Customer ID? You can link it again later.
                </div>
                <div className="unlink-confirm-buttons">
                  <button
                    className="unlink-confirm-cancel"
                    onClick={() => setShowUnlinkConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="unlink-confirm-yes"
                    onClick={async () => {
                      await setStorageJSON('medPlusCustomer', null);
                      setMedPlusCustomer(null);
                      setShowUnlinkConfirm(false);
                    }}
                  >
                    Unlink
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* No Customer ID Found Modal */}
          <WarningModal
            show={showNoCustomerModal}
            title="No Customer ID Found"
            message="We couldn't find a MedPlus Customer ID associated with your account. Please try again later."
            onClose={() => setShowNoCustomerModal(false)}
          />
        </div>
      </div>
    </div>
  );
}


export default ManageAccount;
