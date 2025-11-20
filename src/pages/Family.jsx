import { useEffect, useMemo, useState } from 'react';
import { MdPerson, MdPersonOutline, MdEdit, MdDelete, MdAdd, MdWatch } from 'react-icons/md';
import { GiRing } from 'react-icons/gi';
import { FaWeight } from 'react-icons/fa';
import { idbGet, idbGetJSON, idbSet, idbSetJSON, emitUserChange } from '../data/db';
import { idbGetJSON as idbGetJSONDevices } from '../data/db';
import { availableDevices as mockAvailableDevices } from '../data/mockData';
import DevicesMenu from '../components/DevicesMenu';
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
  const [showDeviceAssignmentForEdit, setShowDeviceAssignmentForEdit] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [pendingEditUser, setPendingEditUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
  const [pendingNewUser, setPendingNewUser] = useState(null);

  const sanitizeUserForStorage = (user) => {
    if (!user) return null;
    const { self, ...rest } = user;
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
    await idbSet('defaultUserId', resolvedId);
    const defaultUserData = resolvedId ? sanitizeUserForStorage(userList.find(u => u.id === resolvedId)) : null;
    await idbSetJSON('defaultUser', defaultUserData);
    return resolvedId;
  };

  const unassignedDevices = useMemo(() => {
    const assignedIds = new Set(
      users
        .map(u => (u.deviceId ? String(u.deviceId) : ''))
        .filter(Boolean)
    );
    // If no paired devices, show all available devices for pairing
    const sourceDevices = pairedDevices.length === 0 ? mockAvailableDevices : pairedDevices;
    return sourceDevices.filter(device => !assignedIds.has(String(device.id)));
  }, [users, pairedDevices]);

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

        // Default user logic persisted
        await persistDefaultUserSelection(hydratedUsers, storedDefaultUserId);

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
      await idbSetJSON('users', onlyUsers);
      setUsers(updatedUsers);
      await persistDefaultUserSelection(updatedUsers);

      // Persist user-device mapping in IndexedDB
      // Build mapping: { [userId]: deviceId }
      const userDeviceMap = {};
      updatedUsers.forEach(u => {
        if (u.deviceId) {
          userDeviceMap[u.id] = u.deviceId;
        }
      });
      await idbSetJSON('userDeviceMap', userDeviceMap);

      emitUserChange();
    } catch (err) {
      console.error('Failed to persist users list', err);
    }
  };

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
    setEditingUserId(users[idx]?.id);
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
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` 
    };
    
    // Store pending user and show device selection
    setPendingNewUser(newUser);
    closeModal();
    setShowDeviceSelectionModal(true);
  };

  const handleDeviceSelected = async (device) => {
    if (!pendingNewUser) return;

    const isPaired = pairedDevices.some(d => String(d.id) === String(device.id));
    let newPairedDevices = pairedDevices;
    if (!isPaired) {
      // Pair the device (add to pairedDevices and persist)
      newPairedDevices = [...pairedDevices, device];
      setPairedDevices(newPairedDevices);
      await idbSetJSON('pairedDevices', newPairedDevices);
    }

    // Assign device to the new user
    const newUserWithDevice = { ...pendingNewUser, deviceId: String(device.id) };

    // Remove this device from any other user
    const updatedUsers = users.map(u =>
      String(u.deviceId) === String(device.id) ? { ...u, deviceId: '' } : u
    );
    updatedUsers.push(newUserWithDevice);

    await saveUsers(updatedUsers);
    setShowDeviceSelectionModal(false);
    setPendingNewUser(null);
  };

  const handleSkipDeviceSelection = async () => {
    if (!pendingNewUser) return;
    
    const updatedUsers = [...users, pendingNewUser];
    await saveUsers(updatedUsers);
    setShowDeviceSelectionModal(false);
    setPendingNewUser(null);
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
      const { self, ...rest } = editedUser;
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
                  <p className="user-device">
                    {(() => {
                      if (user.deviceId) {
                        const device = pairedDevices.find(d => String(d.id) === String(user.deviceId));
                        if (device) {
                          return (
                            <>
                              {getDeviceIcon(device.deviceType)}
                              <span>{device.name}</span>
                            </>
                          );
                        }
                        // Device id is set but device not found in pairedDevices (likely unpaired)
                        return <span style={{ color: '#94a3b8' }}>No device assigned</span>;
                      }
                      return <span style={{ color: '#94a3b8' }}>No device assigned</span>;
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
                  emitUserChange();
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

            {modalMode === 'edit' && users[editingIndex] && (
              <div className="form-group">
                {(() => {
                  const deviceId = users[editingIndex].deviceId;
                  const assignedDevice = deviceId ? pairedDevices.find(d => String(d.id) === String(deviceId)) : null;
                  if (deviceId && assignedDevice) {
                    // Device assigned and found
                    return (
                      <>
                        <label>Assigned Device</label>
                        <div className="device-action-col">
                          <span className="device-action-label">
                            {`${assignedDevice.name} (${assignedDevice.model})`}
                          </span>
                          <div className="device-action-row">
                            <button
                              className="btn-submit device-action-btn"
                              onClick={() => {
                                setPendingEditUser(users[editingIndex]);
                                setShowDeviceAssignmentForEdit(true);
                                setModalOpen(false);
                              }}
                            >
                              Switch
                            </button>
                            <button
                              className="btn-delete device-action-btn"
                              onClick={async () => {
                                // Unassign device from user
                                const updatedUsers = users.map((u, idx) =>
                                  idx === editingIndex ? { ...u, deviceId: '' } : u
                                );
                                await saveUsers(updatedUsers);
                                setUsers(updatedUsers);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  } else {
                    // No device assigned or device not found
                    return (
                      <button
                        className="btn-submit device-action-btn"
                        onClick={() => {
                          setPendingEditUser(users[editingIndex]);
                          setShowDeviceAssignmentForEdit(true);
                          setModalOpen(false);
                        }}
                      >
                        Assign Device
                      </button>
                    );
                  }
                })()}
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

      {/* Device Selection Modal for New User */}
      {showDeviceSelectionModal && pendingNewUser && (() => {
        // Devices already paired but not assigned to any user
        const assignedIds = new Set(users.map(u => u.deviceId).filter(Boolean).map(String));
        const unassignedPairedDevices = pairedDevices.filter(d => !assignedIds.has(String(d.id)));
        // Devices in mockAvailableDevices that are not yet paired (not in pairedDevices by id)
        const pairedIds = new Set(pairedDevices.map(d => String(d.id)));
        const unpairedAvailableDevices = mockAvailableDevices.filter(d => !pairedIds.has(String(d.id)));
        return (
          <div className="modal-overlay" onClick={handleSkipDeviceSelection}>
            <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <h3>Assign Device (Optional)</h3>
                  <p className="modal-subtitle">Select a device for {pendingNewUser.name}</p>
                </div>
                <button className="modal-close-btn" onClick={handleSkipDeviceSelection} aria-label="Skip">
                  X
                </button>
              </div>
              <DevicesMenu
                pairedDevices={unassignedPairedDevices}
                availableDevices={unpairedAvailableDevices}
                onPairDevice={handleDeviceSelected}
                onCardClick={handleDeviceSelected}
                variant="modal"
                isCloseButtonRequired={false}
                showPairedSection={true}
                showAvailableSection={true}
              />
              <div className="modal-buttons">
                <button 
                  className="btn-primary btn-submit" 
                  style={{ background: '#94a3b8' }}
                  onClick={handleSkipDeviceSelection}
                >
                  Skip & Add User
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Device Assignment Modal for Edit User */}
      {showDeviceAssignmentForEdit && pendingEditUser && (() => {
        // Devices already paired but not assigned to any user (except this user)
        const assignedIds = new Set(users.filter(u => u.id !== pendingEditUser.id).map(u => u.deviceId).filter(Boolean).map(String));
        const unassignedPairedDevices = pairedDevices.filter(d => !assignedIds.has(String(d.id)));
        // Devices in mockAvailableDevices that are not yet paired (not in pairedDevices by id)
        const pairedIds = new Set(pairedDevices.map(d => String(d.id)));
        const unpairedAvailableDevices = mockAvailableDevices.filter(d => !pairedIds.has(String(d.id)));

        // Handler for assigning device to edited user
        const handleDeviceSelectedForEdit = async (device) => {
          if (!pendingEditUser) return;
          // If user already had a device, unassign it
          const prevDeviceId = pendingEditUser.deviceId;
          let newPairedDevices = pairedDevices;
          // If device is not already paired, add to pairedDevices
          const isPaired = pairedDevices.some(d => String(d.id) === String(device.id));
          if (!isPaired) {
            newPairedDevices = [...pairedDevices, device];
            setPairedDevices(newPairedDevices);
            await idbSetJSON('pairedDevices', newPairedDevices);
          }
          // Assign device to user, unassign from any other user
          const updatedUsers = users.map(u => {
            if (u.id === pendingEditUser.id) {
              return { ...u, deviceId: String(device.id) };
            } else if (u.deviceId && String(u.deviceId) === String(device.id)) {
              return { ...u, deviceId: '' };
            }
            return u;
          });
          await saveUsers(updatedUsers);
          setShowDeviceAssignmentForEdit(false);
          // Reopen edit modal for the same user
          const idx = users.findIndex(u => u.id === pendingEditUser.id);
          if (idx !== -1) {
            setEditingIndex(idx);
            setEditingUserId(users[idx]?.id);
            setModalMode('edit');
            setModalOpen(true);
          }
          setPendingEditUser(null);
        };

        // Handler for skipping device assignment in edit
        const handleSkipDeviceAssignmentForEdit = async () => {
          setShowDeviceAssignmentForEdit(false);
          // Reopen edit modal for the same user
          if (pendingEditUser) {
            const idx = users.findIndex(u => u.id === pendingEditUser.id);
            if (idx !== -1) {
              setEditingIndex(idx);
              setEditingUserId(users[idx]?.id);
              setModalMode('edit');
              setModalOpen(true);
            }
          }
          setPendingEditUser(null);
        };

        return (
          <div className="modal-overlay" onClick={handleSkipDeviceAssignmentForEdit}>
            <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <h3>Assign Device (Optional)</h3>
                  <p className="modal-subtitle">Select a device for {pendingEditUser.name}</p>
                </div>
                <button className="modal-close-btn" onClick={handleSkipDeviceAssignmentForEdit} aria-label="Skip">
                  X
                </button>
              </div>
              <DevicesMenu
                pairedDevices={unassignedPairedDevices}
                availableDevices={unpairedAvailableDevices}
                onPairDevice={handleDeviceSelectedForEdit}
                onCardClick={handleDeviceSelectedForEdit}
                variant="modal"
                isCloseButtonRequired={false}
                showPairedSection={true}
                showAvailableSection={true}
              />
              <div className="modal-buttons">
                <button 
                  className="btn-primary btn-submit" 
                  style={{ background: '#94a3b8' }}
                  onClick={handleSkipDeviceAssignmentForEdit}
                >
                  Skip
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
