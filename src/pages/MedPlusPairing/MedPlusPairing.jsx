import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorageJSON, setStorageJSON } from '../../service';
import './MedPlusPairing.css';

const MedPlusPairing = () => {
    const navigate = useNavigate();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [customerName, setCustomerName] = useState('');

    const accountOpeningDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Load random name from users or registeredUser on mount
    useEffect(() => {
        const loadRandomName = async () => {
            const users = await getStorageJSON('users', []);
            const registeredUser = await getStorageJSON('registeredUser', null);

            // Collect all names
            const allNames = [];
            if (users && users.length > 0) {
                users.forEach(user => {
                    if (user && user.name) allNames.push(user.name);
                });
            }
            if (registeredUser && registeredUser.name) {
                allNames.push(registeredUser.name);
            }

            // Pick a random name
            if (allNames.length > 0) {
                const randomName = allNames[Math.floor(Math.random() * allNames.length)];
                setCustomerName(randomName);
            } else {
                setCustomerName('Guest User');
            }
        };

        loadRandomName();
    }, []);

    const handleCancel = () => {
        navigate('/manage-account');
    };

    const handleLink = async () => {
        // Save MedPlus Customer ID to IndexedDB with name
        const medPlusData = {
            customerId: 'C001',
            customerName: customerName,
            customerSince: accountOpeningDate,
            status: 'Active',
            linkedAt: new Date().toISOString()
        };

        await setStorageJSON('medPlusCustomer', medPlusData);

        // Show success modal
        setShowSuccessModal(true);
    };

    const handleCloseSuccess = () => {
        navigate('/manage-account');
    };

    return (
        <div className="medplus-pairing-bg">
            <div className="medplus-pairing-root">
                <div className="medplus-pairing-container">
                    {/* Header with Back Button */}
                    <div className="medplus-header">
                        <button
                            className="medplus-back-btn"
                            onClick={() => navigate('/manage-account')}
                            aria-label="Go back"
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <div className="medplus-header-text">
                            <h1 className="medplus-pairing-title">Available Account</h1>
                            <p className="medplus-pairing-desc">Link your MedPlus ID to sync health data</p>
                        </div>
                    </div>

                    {/* Account Details Card */}
                    <div className="medplus-account-card">
                        <div className="medplus-account-inner">
                            <div className="medplus-account-row">
                                <span className="medplus-account-label">Name</span>
                                <span className="medplus-account-value">{customerName}</span>
                            </div>
                            <div className="medplus-account-row">
                                <span className="medplus-account-label">Customer ID</span>
                                <span className="medplus-account-value">C001</span>
                            </div>
                            <div className="medplus-account-row">
                                <span className="medplus-account-label">Customer Since</span>
                                <span className="medplus-account-value">{accountOpeningDate}</span>
                            </div>
                            <div className="medplus-account-row">
                                <span className="medplus-account-label">Status</span>
                                <span className="medplus-account-value medplus-status-active">Active</span>
                            </div>
                        </div>
                        <div className="medplus-btn-wrapper">
                            <button className="medplus-cancel-btn" type="button" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button className="medplus-link-btn" type="button" onClick={handleLink}>
                                Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="medplus-success-overlay">
                    <div className="medplus-success-modal">
                        <div className="medplus-success-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#10b981" />
                                <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="medplus-success-title">Linked Successfully!</h2>
                        <p className="medplus-success-desc">Your MedPlus Customer ID has been linked</p>
                        <button className="medplus-success-close-btn" onClick={handleCloseSuccess}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedPlusPairing;
