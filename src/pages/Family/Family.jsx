import { useEffect, useState } from 'react';
import { MdPerson, MdPersonOutline, MdEdit, MdDelete, MdAdd, MdWatch } from 'react-icons/md';
import { GiRing } from 'react-icons/gi';
import { FaWeight } from 'react-icons/fa';
import { getStorageItem, getStorageJSON, setStorageItem, setStorageJSON, notifyUserChange } from '../../service';
import './Family.css';

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
  const [showManageDevicesModal, setShowManageDevicesModal] = useState(false);
  const [managingUserIndex, setManagingUserIndex] = useState(null);

  const sanitizeUserForStorage = (user) => {
    if (!user) return null;
    const { self: _self, ...rest } = user;
    return rest;
  };

  const persistDefaultUserSelection = async (userList, candidateId = defaultUserId) => {
    let resolvedId = '';
    if (userList.length === 1) {
      resolvedId = userList[0].id;
    } else if (candidateId && userList.some(u => u.id === candidateId)) {
      resolvedId = candidateId;
    }

    setDefaultUserId(resolvedId);
    await setStorageItem('defaultUserId', resolvedId);
    const defaultUserData = resolvedId ? sanitizeUserForStorage(userList.find(u => u.id === resolvedId)) : null;
    await setStorageJSON('defaultUser', defaultUserData);
    return resolvedId;
  };

  // Helper to migrate old user data structure to new one
  const migrateUserData = (user) => {
    if (!user) return user;
    
    // If user already has devices array, return as-is
    if (Array.isArray(user.devices)) {
      return user;
    }
    
    // Migrate from old deviceId to new devices array structure
    const devices = [];
    if (user.deviceId) {
      devices.push(String(user.deviceId));
    }
    
    const { deviceId: _deviceId, ...rest } = user;
    return {
      ...rest,
      devices,
      defaultDevice: devices.length > 0 ? devices[0] : null
    };
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let currentUser = await getStorageJSON('currentUser', null);
        let otherUsers = await getStorageJSON('users', []);
        const storedDefaultUserId = await getStorageItem('defaultUserId');
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
        
        // Migrate users to new data structure
        const hydratedUsers = (currentUser
          ? [{ ...migrateUserData(currentUser), self: true }, ...otherUsers.map(migrateUserData)]
          : otherUsers.map(migrateUserData));
        
        setUsers(hydratedUsers);
        // Persist any id changes
        if (currentUser) await setStorageJSON('currentUser', { ...migrateUserData(currentUser) });
        await setStorageJSON('users', otherUsers.map(migrateUserData));

        // Default user logic persisted
        await persistDefaultUserSelection(hydratedUsers, storedDefaultUserId);

        // Load paired devices
        const devices = await getStorageJSON('pairedDevices', []);
        setPairedDevices(devices);
      } catch (err) {
        console.error('Failed to load users/devices from IndexedDB', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'watch':
        return <MdWatch size={16} />;
      case 'ring':
        return <GiRing size={16} />;
      case 'scale':
        return <FaWeight size={16} />;
      default:
        return <MdWatch size={16} />;
    }
  };

  const saveUsers = async (updatedUsers) => {
    try {
      const onlyUsers = updatedUsers.filter(u => !u.self);
      await setStorageJSON('users', onlyUsers);
      setUsers(updatedUsers);
      await persistDefaultUserSelection(updatedUsers);

      notifyUserChange();
    } catch (err) {
      console.error('Failed to persist users list', err);
    }
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

    const newUser = { 
      ...formData, 
      self: false, 
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      devices: [],
      defaultDevice: null
    };
    
    // Add user directly without device selection
    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
    closeModal();
  };

  const handleSaveEdit = async () => {
    if (!validateForm()) return;

    const updatedUsers = [...users];
    const isSelf = updatedUsers[editingIndex]?.self;
    const editedUser = {
      ...updatedUsers[editingIndex],
      ...formData,
      id: updatedUsers[editingIndex].id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    };
    updatedUsers[editingIndex] = editedUser;

    if (isSelf) {
      const { self: _self, ...rest } = editedUser;
      await setStorageJSON('currentUser', rest);
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
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">Manage your users</p>
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
                  <p className="user-device">
                    {(() => {
                      const defaultDeviceId = user.defaultDevice;
                      if (defaultDeviceId) {
                        const device = pairedDevices.find(d => String(d.id) === String(defaultDeviceId));
                        if (device) {
                          return (
                            <>
                              {getDeviceIcon(device.deviceType)}
                              <span>{device.name}</span>
                            </>
                          );
                        }
                      }
                      return <span style={{ color: '#94a3b8' }}>No device paired</span>;
                    })()}
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
                  await persistDefaultUserSelection(users, e.target.value);
                  notifyUserChange();
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

      {/* Add/Edit Member Modal (no device selection in edit) */}
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

      {/* Manage Devices Modal */}
      {showManageDevicesModal && managingUserIndex !== null && (() => {
        const user = users[managingUserIndex];
        if (!user) return null;

        // Create a Map for O(1) device lookups
        const devicesMap = new Map(pairedDevices.map(d => [String(d.id), d]));
        const userDevices = (user.devices || [])
          .map(deviceId => devicesMap.get(String(deviceId)))
          .filter(Boolean);

        const handleAddDevice = async (device) => {
          // Only allow assigning already-paired devices, not pairing new ones
          const deviceIdStr = String(device.id);
          const updatedUsers = users.map((u, idx) => {
            if (idx === managingUserIndex) {
              const newDevices = [...(u.devices || [])];
              if (!newDevices.includes(deviceIdStr)) {
                newDevices.push(deviceIdStr);
              }
              return {
                ...u,
                devices: newDevices,
                defaultDevice: u.defaultDevice || deviceIdStr
              };
            }
            return u;
          });

          await saveUsers(updatedUsers);
        };

        const handleRemoveDevice = async (deviceId) => {
          if (!window.confirm('Remove this device from the user?')) return;

          const updatedUsers = users.map((u, idx) => {
            if (idx === managingUserIndex) {
              const newDevices = (u.devices || []).filter(id => String(id) !== String(deviceId));
              let newDefaultDevice = u.defaultDevice;
              
              // If removing the default device, set new default
              if (String(u.defaultDevice) === String(deviceId)) {
                newDefaultDevice = newDevices.length > 0 ? newDevices[0] : null;
              }
              
              return {
                ...u,
                devices: newDevices,
                defaultDevice: newDefaultDevice
              };
            }
            return u;
          });

          await saveUsers(updatedUsers);
        };

        const handleSetDefaultDevice = async (deviceId) => {
          const updatedUsers = users.map((u, idx) => {
            if (idx === managingUserIndex) {
              return { ...u, defaultDevice: String(deviceId) };
            }
            return u;
          });

          await saveUsers(updatedUsers);
        };

        const handleCloseManageDevices = () => {
          setShowManageDevicesModal(false);
          // Reopen edit modal
          if (managingUserIndex !== null) {
            setEditingIndex(managingUserIndex);
            setModalMode('edit');
            setModalOpen(true);
          }
          setManagingUserIndex(null);
        };

        // Available paired devices to add.
        // Exclude any devices already assigned to any user — we must not
        // show devices that belong to another user when pairing to this one.
        const assignedDeviceIds = new Set((users || []).flatMap(u => (u.devices || []).map(id => String(id))));
        const availablePairedDevices = pairedDevices.filter(d => !assignedDeviceIds.has(String(d.id)));

        return (
          <div className="modal-overlay" onClick={handleCloseManageDevices}>
            <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <h3>Manage Devices</h3>
                  <p className="modal-subtitle">Devices for {user.name}</p>
                </div>
                <button className="modal-close-btn" onClick={handleCloseManageDevices} aria-label="Close">
                  X
                </button>
              </div>

              {/* Current devices list */}
              <div style={{ marginBottom: '20px' }}>
                {userDevices.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                    No paired devices for this user
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {userDevices.map(device => (
                      <div
                        key={device.id}
                        style={{
                          padding: '16px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: String(device.id) === String(user.defaultDevice) ? '#f0f9ff' : '#fff'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                            {device.name}
                            {String(device.id) === String(user.defaultDevice) && (
                              <span style={{ 
                                marginLeft: '8px', 
                                padding: '2px 8px', 
                                background: '#667eea', 
                                color: 'white', 
                                borderRadius: '4px', 
                                fontSize: '12px' 
                              }}>
                                Default
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {device.model} • {device.brand}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {String(device.id) !== String(user.defaultDevice) && (
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '14px' }}
                              onClick={() => handleSetDefaultDevice(device.id)}
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            className="btn-delete"
                            style={{ padding: '6px 12px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleRemoveDevice(device.id)}
                            title="Remove device"
                            aria-label="Remove device"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Only show available paired devices, not unpaired ones */}
              {availablePairedDevices.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        marginBottom: '12px',
                        color: '#475569' 
                      }}>
                        Available Devices
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {availablePairedDevices.map(device => (
                      <div
                        key={device.id}
                        style={{
                          padding: '16px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: '#fff'
                        }}
                        onClick={() => handleAddDevice(device)}
                      >
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                            {device.name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {device.model} • {device.brand}
                          </div>
                        </div>
                        <button
                          className="btn-primary btn-compact"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddDevice(device);
                          }}
                        >
                          Pair
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-buttons" style={{ marginTop: '16px' }}>
                <button className="btn-primary btn-submit" onClick={handleCloseManageDevices}>
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Users;
