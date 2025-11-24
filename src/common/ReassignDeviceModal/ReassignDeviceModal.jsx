import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ReassignDeviceModal.css';

const ReassignDeviceModal = ({ device, currentUserId, users, onReassign, onUnassign, onClose }) => {
  const [selectedUserId, setSelectedUserId] = useState(currentUserId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedUserId(currentUserId || '');
  }, [currentUserId]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      if (selectedUserId === '') {
        // Unassign device
        await onUnassign(device.id);
      } else if (selectedUserId !== currentUserId) {
        // Reassign to different user
        await onReassign(device.id, selectedUserId);
      }
      onClose();
    } catch (error) {
      console.error('Failed to reassign device:', error);
      alert('Failed to reassign device. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanged = selectedUserId !== (currentUserId || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content reassign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Reassign Device</h3>
            <p className="modal-subtitle">Change user assignment for {device?.name}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="reassign-modal-body">
          <div className="device-info">
            <div className="device-info-label">Device</div>
            <div className="device-info-name">{device?.name}</div>
            <div className="device-info-model">{device?.model}</div>
          </div>

          <div className="form-group">
            <label htmlFor="userSelect">Assign to User</label>
            <select
              id="userSelect"
              className="form-input"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">-- Unassigned --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || 'Unnamed'} {user.self ? '(Self)' : ''}
                </option>
              ))}
            </select>
          </div>

          {currentUserId && selectedUserId === '' && (
            <div className="warning-message">
              This device will be unassigned from all users.
            </div>
          )}
        </div>

        <div className="modal-buttons">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="btn-primary btn-submit" 
            onClick={handleSubmit}
            disabled={!hasChanged || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

ReassignDeviceModal.propTypes = {
  device: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    model: PropTypes.string
  }).isRequired,
  currentUserId: PropTypes.string,
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    self: PropTypes.bool
  })).isRequired,
  onReassign: PropTypes.func.isRequired,
  onUnassign: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReassignDeviceModal;
