import React from 'react';
import './WarningModal.css';

/**
 * WarningModal - A reusable warning modal with amber exclamation icon
 * @param {boolean} show - Whether to show the modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} buttonText - Text for the button (default: "OK")
 * @param {function} onClose - Callback when modal is closed
 */
const WarningModal = ({ show, title, message, buttonText = 'OK', onClose, secondaryButtonText, onSecondaryAction }) => {
    if (!show) return null;

    return (
        <div className="warning-modal-overlay" onClick={onClose}>
            <div className="warning-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="warning-modal-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" fill="none" />
                        <path d="M12 8v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="16" r="1" fill="#f59e0b" />
                    </svg>
                </div>
                <h3 className="warning-modal-title">{title}</h3>
                <p className="warning-modal-message">{message}</p>
                <div className="warning-modal-actions" style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                    {secondaryButtonText && (
                        <button
                            className="warning-modal-btn warning-secondary-btn"
                            onClick={onSecondaryAction || onClose}
                            style={{ background: '#f3f4f6', color: '#4b5563' }}
                        >
                            {secondaryButtonText}
                        </button>
                    )}
                    <button className="warning-modal-btn" onClick={onClose}>
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WarningModal;
