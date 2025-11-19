import { useEffect, useState } from 'react';
import { MdPerson, MdPersonOutline, MdEdit, MdDelete, MdAdd } from 'react-icons/md';
import { idbGet, idbGetJSON, idbSet, idbSetJSON } from '../data/db';
import { idbGetJSON as idbGetJSONDevices, idbSetJSON as idbSetJSONDevices } from '../data/db';
import '../styles/pages/Family.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [defaultUserId, setDefaultUserId] = useState('');
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let currentUser = await idbGetJSON('currentUser', null);
        let otherUsers = await idbGetJSON('users', []);
        const storedDefaultUserId = await idbGet('defaultUserId');
        // Ensure every user has a unique id
        const ensureId = (user) => {
          if (!user) return user;
          if (!user.id) {
            return { ...user, id: `user_${Date.now()}_${Math.random().toString(36).slice(2,8)}` };
          }
          return user;
        };
        currentUser = currentUser ? ensureId(currentUser) : null;
        otherUsers = Array.isArray(otherUsers) ? otherUsers.map(ensureId) : [];
        if (!isMounted) return;
        const hydratedUsers = (currentUser
          ? [{ ...currentUser, self: true }, ...otherUsers]
          : otherUsers).map(u => ({ ...u, deviceId: String(u.deviceId || '') }));
        setUsers(hydratedUsers);
        // Persist any id changes
        if (currentUser) await idbSetJSON('currentUser', { ...currentUser });
        await idbSetJSON('users', otherUsers);

        // Default user logic
        if (hydratedUsers.length === 1) {
          setDefaultUserId(hydratedUsers[0].id);
          await idbSet('defaultUserId', hydratedUsers[0].id);
        } else if (storedDefaultUserId && hydratedUsers.some(u => u.id === storedDefaultUserId)) {
          setDefaultUserId(storedDefaultUserId);
        } else {
          setDefaultUserId('');
        }

        // Load paired devices
        const devices = await idbGetJSONDevices('pairedDevices', []);
        setPairedDevices(devices);
      } catch (err) {
        console.error('Failed to load users/devices from IndexedDB', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveUsers = async (updatedUsers) => {
    try {
      const onlyUsers = updatedUsers.filter(u => !u.self);
      await idbSetJSON('users', onlyUsers);
      setUsers(updatedUsers);
      // If only one user left, set as default
      if (updatedUsers.length === 1) {
        setDefaultUserId(updatedUsers[0].id);
        await idbSet('defaultUserId', updatedUsers[0].id);
      } else if (!updatedUsers.some(u => u.id === defaultUserId)) {
        setDefaultUserId('');
        await idbSet('defaultUserId', '');
      }
    } catch (err) {
      console.error('Failed to persist users list', err);
    }
  };

  // Device assignment logic
  const getAssignedDeviceId = (user) => user.deviceId || '';
  const getDeviceAssignedUserId = (deviceId) => {
    // Compare as strings to avoid type mismatches
    const user = users.find(u => String(u.deviceId || '') === String(deviceId || ''));
    return user ? String(user.id) : null;
  };
  const availableDevicesForEdit = (editingUserId) => {
    // Only devices not assigned to any user, or assigned to this user
    return pairedDevices.filter(d => {
      const assignedUserId = getDeviceAssignedUserId(d.id);
      // allowed if not assigned or assigned to editing user
      return !assignedUserId || String(assignedUserId) === String(editingUserId);
    });
  };

  const openAddModal = () => {
    setFormData({ name: '', age: '', gender: '' });
    setErrors({});
    setModalMode('add');
    setModalOpen(true);
  };

  const openEditModal = (idx) => {
    setFormData({
      name: users[idx].name || '',
      age: users[idx].age || '',
      gender: users[idx].gender || '',
    });
    setErrors({});
    setEditingIndex(idx);
    setModalMode('edit');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingIndex(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age || isNaN(formData.age) || formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Valid age (1-120) is required';
    }
    if (!formData.gender) newErrors.gender = 'Gender is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    // Always generate a unique id for new user
    const newUser = { 
      ...formData, 
      self: false, 
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` 
    };
    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
    closeModal();
  };

  const handleSaveEdit = async () => {
    if (!validateForm()) return;

    const updatedUsers = [...users];
    const isSelf = updatedUsers[editingIndex]?.self;
    // Always ensure id exists
    updatedUsers[editingIndex] = { 
      ...updatedUsers[editingIndex], 
      ...formData,
      id: updatedUsers[editingIndex].id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    };

    if (isSelf) {
      const { self, ...rest } = updatedUsers[editingIndex];
      await idbSetJSON('currentUser', rest);
    }
    await saveUsers(updatedUsers);
    closeModal();
  };

  const handleRemove = async (idx) => {
    if (users[idx].self) return alert("Can't remove default logged-in user.");
    if (!window.confirm('Remove this user?')) return;

    const updatedUsers = users.filter((_, i) => i !== idx);
    await saveUsers(updatedUsers);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="header-section">
          <h2 className="page-title">Family Members</h2>
          <p className="page-subtitle">Manage your family's health profiles</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, justifyContent: 'flex-end', marginBottom: 24 }}>
          <button className="btn-primary add-member-btn" style={{ marginBottom: 0, maxWidth: 180 }} onClick={openAddModal}>
            <MdAdd size={20} />
            <span>Add User</span>
          </button>
          {users.length > 1 && (
            <button
              className="btn-primary"
              style={{ maxWidth: 180, padding: '8px 18px', fontSize: 14 }}
              onClick={() => setShowDefaultModal(true)}
            >
              Change Default User
            </button>
          )}
        </div>

        <div className="user-list">
          {users.length === 0 ? (
            <div className="empty-state">
              <MdPersonOutline size={64} />
              <p>No users yet</p>
              <span>Add a family member to get started</span>
            </div>
          ) : (
            users.map((user, idx) => (
              <div className="user-card" key={user.id || idx}>
                <div className="user-avatar">
                  {user.self ? (
                    <MdPerson size={32} />
                  ) : (
                    <MdPersonOutline size={32} />
                  )}
                </div>
                <div className="user-info">
                  <p className="user-name">
                    {user.name || 'Unnamed'}
                    {user.self && <span className="self-badge">Self</span>}
                    {user.id === defaultUserId && (
                      <span className="self-badge" style={{ background: '#667eea', marginLeft: 6 }}>Default</span>
                    )}
                  </p>
                  <p className="user-meta">
                    {user.age ? `${user.age} years` : 'Age not set'} • {user.gender || 'Gender not set'}
                  </p>
                </div>
                <div className="user-actions">
                  <button
                    onClick={() => openEditModal(idx)}
                    className="action-btn edit-btn"
                    title="Edit"
                    aria-label="Edit user"
                  >
                    <MdEdit size={20} />
                  </button>
                  {!user.self && (
                    <button
                      onClick={() => handleRemove(idx)}
                      className="action-btn delete-btn"
                      title="Delete"
                      aria-label="Delete user"
                    >
                      <MdDelete size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Default User Modal */}
      {showDefaultModal && users.length > 1 && (
        <div className="modal-overlay" onClick={() => setShowDefaultModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Change Default User</h3>
                <p className="modal-subtitle">Select the default user for this app</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDefaultModal(false)} aria-label="Close">
                X
              </button>
            </div>
            <div className="form-group">
              <label htmlFor="defaultUser">Default User</label>
              <select
                id="defaultUser"
                className="form-input"
                value={defaultUserId}
                onChange={async e => {
                  setDefaultUserId(e.target.value);
                  await idbSet('defaultUserId', e.target.value);
                }}
              >
                <option value="">-- Select User --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name || 'Unnamed'}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-buttons">
              <button className="btn-primary btn-submit" onClick={() => setShowDefaultModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>{modalMode === 'add' ? 'Add New User' : 'Edit User'}</h3>
                <p className="modal-subtitle">Fill in the details below</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Close">
                X
              </button>
            </div>
            
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-input ${errors.name ? 'error' : ''}`}
                autoFocus
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                name="age"
                min={1}
                max={120}
                placeholder="Enter age"
                value={formData.age}
                onChange={handleInputChange}
                className={`form-input ${errors.age ? 'error' : ''}`}
              />
              {errors.age && <span className="error-message">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`form-input ${errors.gender ? 'error' : ''}`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>

            {/* Assign Device Dropdown (only in edit mode) */}
            {modalMode === 'edit' && (
              <div className="form-group">
                {/* Only show the label if a device is assigned or there is at least one available device */}
                {users[editingIndex] && (users[editingIndex].deviceId || (availableDevicesForEdit(users[editingIndex]?.id) || []).length > 0) && (
                  <label htmlFor="assignDevice">
                    {users[editingIndex] && users[editingIndex].deviceId ? 'Assigned Device' : 'Assign Device'}
                  </label>
                )}
                {/* If user already has a device, show assigned device and a button to remove it */}
                {users[editingIndex] && users[editingIndex].deviceId ? (
                  (() => {
                    const assignedId = users[editingIndex].deviceId;
                    const assignedDevice = pairedDevices.find(d => String(d.id) === String(assignedId));
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 14, color: '#222' }}>
                          {assignedDevice ? `${assignedDevice.name} (${assignedDevice.model})` : 'Assigned device not found'}
                        </div>
                        <button
                          className="btn-remove"
                          onClick={async () => {
                            // Unassign the device for this user
                            const updatedUsers = users.map((u, idx) => (
                              idx === editingIndex ? { ...u, deviceId: '' } : u
                            ));
                            setUsers(updatedUsers);
                            // Persist
                            const onlyUsers = updatedUsers.filter(u => !u.self);
                            await idbSetJSON('users', onlyUsers);
                            if (users[editingIndex].self) {
                              const { self, ...rest } = updatedUsers[editingIndex];
                              await idbSetJSON('currentUser', rest);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  (() => {
                    const available = availableDevicesForEdit(users[editingIndex]?.id);
                    if (!available || available.length === 0) {
                      return (
                        <div className="no-devices-placeholder">No devices to assign</div>
                      );
                    }
                    return (
                      <select
                        id="assignDevice"
                        className="form-input"
                        value={getAssignedDeviceId(users[editingIndex] || {})}
                        onChange={async e => {
                      const deviceId = e.target.value;
                      // Remove deviceId from any other user
                      const updatedUsers = users.map((u, idx) => {
                        if (idx === editingIndex) {
                          return { ...u, deviceId };
                        } else if (u.deviceId && String(u.deviceId) === String(deviceId)) {
                          return { ...u, deviceId: '' };
                        }
                        return u;
                      });
                      setUsers(updatedUsers);
                      // Persist
                      const onlyUsers = updatedUsers.filter(u => !u.self);
                      await idbSetJSON('users', onlyUsers);
                      if (users[editingIndex].self) {
                        const { self, ...rest } = updatedUsers[editingIndex];
                        await idbSetJSON('currentUser', rest);
                      }
                    }}
                  >
                    <option value="">-- None --</option>
                    {availableDevicesForEdit(users[editingIndex]?.id).map(device => (
                      <option key={device.id} value={device.id}>
                        {device.name} ({device.model})
                      </option>
                    ))}
                      </select>
                    );
                  })()
                )}
              </div>
            )}

            <div className="modal-buttons">
              {modalMode === 'add' ? (
                <button onClick={handleAdd} className="btn-primary btn-submit">
                  <MdAdd size={20} />
                  Add User
                </button>
              ) : (
                <button onClick={handleSaveEdit} className="btn-primary btn-submit">
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
