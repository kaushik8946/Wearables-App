import { useEffect, useState } from 'react';
import { MdPerson, MdPersonOutline } from 'react-icons/md';
import '../styles/pages/Family.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
  });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const otherUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers([{ ...currentUser, self: true }, ...otherUsers]);
  }, []);

  const saveUsers = (updatedUsers) => {
    const onlyUsers = updatedUsers.filter(u => !u.self);
    localStorage.setItem('users', JSON.stringify(onlyUsers));
    setUsers(updatedUsers);
  };

  const openAddModal = () => {
    setFormData({ name: '', age: '', gender: '' });
    setModalMode('add');
    setModalOpen(true);
  };

  const openEditModal = (idx) => {
    setFormData({
      name: users[idx].name || '',
      age: users[idx].age || '',
      gender: users[idx].gender || '',
    });
    setEditingIndex(idx);
    setModalMode('edit');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (!formData.name.trim()) return alert('Name is required');
    if (!formData.age || isNaN(formData.age)) return alert('Valid age is required');
    if (!formData.gender) return alert('Gender is required');

    const newUser = { ...formData, self: false };
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    closeModal();
  };

  const handleSaveEdit = () => {
    if (!formData.name.trim()) return alert('Name is required');
    if (!formData.age || isNaN(formData.age)) return alert('Valid age is required');
    if (!formData.gender) return alert('Gender is required');

    const updatedUsers = [...users];
    const isSelf = updatedUsers[editingIndex]?.self;
    updatedUsers[editingIndex] = { ...updatedUsers[editingIndex], ...formData };
    if (isSelf) {
      // Update currentUser in localStorage as well
      localStorage.setItem('currentUser', JSON.stringify({ ...updatedUsers[editingIndex], self: undefined }));
    }
    saveUsers(updatedUsers);
    closeModal();
  };

  const handleRemove = (idx) => {
    if (users[idx].self) return alert("Can't remove default logged-in user.");
    if (!window.confirm('Remove this user?')) return;

    const updatedUsers = users.filter((_, i) => i !== idx);
    saveUsers(updatedUsers);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <h2>Manage Users</h2>

        <button className="btn-primary add-member-btn" onClick={openAddModal}>
          + Add User
        </button>

        <div className="user-list">
          {users.map((user, idx) => (
            <div className={`user-card${user.self ? ' main-user' : ''}`} key={idx}>
              <div className="user-avatar">
                {user.self ? (
                  <MdPerson size={28} style={{ fontWeight: 'bold', color: '#111' }} />
                ) : (
                  <MdPersonOutline size={28} style={{ fontWeight: 'bold', color: '#111' }} />
                )}
              </div>
              <div className="user-info">
                <p className="user-name">{user.self ? `${user.name || 'Self'} (Self)` : user.name}</p>
                <p className="user-meta">{user.age ? `Age: ${user.age}, ` : ''}{user.gender}</p>
              </div>
              <div className="user-actions">
                <button onClick={() => openEditModal(idx)}>Edit</button>
                {!user.self && (
                  <button onClick={() => handleRemove(idx)} className="remove-btn">Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal} aria-label="Close">×</button>
            <h3>{modalMode === 'add' ? 'Add User' : 'Edit User'}</h3>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              className="black-text-input"
              autoFocus
            />
            <input
              type="number"
              name="age"
              min={1}
              max={120}
              placeholder="Age"
              value={formData.age}
              onChange={handleInputChange}
              className="black-text-input"
            />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="black-text-input"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Others">Others</option>
            </select>
            <div className="modal-buttons">
              {modalMode === 'add' ? (
                <button onClick={handleAdd} className="btn-primary">Add User</button>
              ) : (
                <button onClick={handleSaveEdit} className="btn-primary">Save Changes</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
