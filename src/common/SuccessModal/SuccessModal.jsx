import React from 'react';
import './SuccessModal.css';

/**
 * SuccessModal - A reusable success modal with green checkmark
 * @param {boolean} show - Whether to show the modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} buttonText - Text for the button (default: "OK")
 * @param {function} onClose - Callback when modal is closed
 */
const SuccessModal = ({ show, title, message, buttonText = 'OK', onClose }) => {
    if (!show) return null;

    return (
        <div className="success-modal-overlay" onClick={onClose}>
            <div className="success-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="success-modal-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#10b981" />
                        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3 className="success-modal-title">{title}</h3>
                <p className="success-modal-message">{message}</p>
                <button className="success-modal-btn" onClick={onClose}>
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
