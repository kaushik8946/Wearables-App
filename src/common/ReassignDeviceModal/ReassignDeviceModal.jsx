import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ReassignDeviceModal.css';

const ReassignDeviceModal = ({ device, currentUserId, users, onReassign, onUnassign, onClose, requireAssignment = false, onCancelDuringPair }) => {
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

  // If this modal was opened after pairing a new device (requireAssignment),
  // the caller expects the device to be assigned. We'll prevent saving when
  // no user is selected (hasChanged will be false if no selection made), and
  // if the user cancels/closes the modal without assigning we will call
  // onCancelDuringPair to allow the parent to unpair the device.

  const handleClose = () => {
    // If we require assignment and user hasn't picked anyone (still unassigned)
    // then notify parent to cancel pairing (unpair the device).
    if (requireAssignment && (!selectedUserId || selectedUserId === '')) {
      if (typeof onCancelDuringPair === 'function') {
        try { onCancelDuringPair(device.id); } catch (e) { /* swallow */ }
      }
    }

    // Always call onClose so parent can hide the modal
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content reassign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Pair Device</h3>
            <p className="modal-subtitle">Pair {device?.name}</p>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
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
            <label htmlFor="userSelect">Pair with User</label>
            <select
              id="userSelect"
              className="form-input"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">-----</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || 'Unnamed'} {user.self ? '(Self)' : ''}
                </option>
              ))}
            </select>
          </div>


          {currentUserId && selectedUserId === '' && (
            <div className="warning-message">
              This device will be unpaired from all users.
            </div>
          )}
        </div>

        <div className="modal-buttons">
          <button 
            className="btn-secondary" 
            onClick={() => {
              // If assignment is required, cancelling means unpair the device
              if (requireAssignment && (!selectedUserId || selectedUserId === '')) {
                if (typeof onCancelDuringPair === 'function') onCancelDuringPair(device.id);
              }
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="btn-primary btn-submit" 
            onClick={handleSubmit}
            disabled={!hasChanged || isSubmitting || (requireAssignment && !selectedUserId)}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
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
  onClose: PropTypes.func.isRequired,
  requireAssignment: PropTypes.bool,
  onCancelDuringPair: PropTypes.func
};

export default ReassignDeviceModal;
