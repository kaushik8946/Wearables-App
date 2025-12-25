import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorageJSON, setStorageJSON, removeStorageItem } from '../../service';
import WarningModal from '../../common/WarningModal/WarningModal';
import SuccessModal from '../../common/SuccessModal/SuccessModal';
import './MedPlusPairing.css';

const MedPlusPairing = () => {
    const navigate = useNavigate();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [isLinked, setIsLinked] = useState(false);
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

    const accountOpeningDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            // Check if already linked
            const existingLink = await getStorageJSON('medPlusCustomer', null);
            if (existingLink) {
                setIsLinked(true);
                setCustomerName(existingLink.customerName || 'Surya Kaushik');
            } else {
                // If not linked, pick a random name for demo
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
            }
        };

        loadData();
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

        // Emit event to update Sidebar immediately
        window.dispatchEvent(new CustomEvent('medplus-status-changed'));

        // Show success modal (don't update isLinked yet - wait for modal close)
        setShowSuccessModal(true);
    };

    const handleUnlinkClick = () => {
        setShowUnlinkConfirm(true);
    };

    const confirmUnlink = async () => {
        await removeStorageItem('medPlusCustomer');

        // Emit event to update Sidebar
        window.dispatchEvent(new CustomEvent('medplus-status-changed'));

        setIsLinked(false);
        setShowUnlinkConfirm(false);
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        setIsLinked(true);
        // navigate('/manage-account'); // Stay in present screen
    };

    return (
        <div className="medplus-pairing-bg">
            <div className="medplus-pairing-root">
                <div className="medplus-pairing-container">
                    {/* Header */}
                    <div className="medplus-header">
                        <div className="medplus-header-text">
                            <h1 className="medplus-pairing-title">{isLinked ? 'Linked Account' : 'Available Account'}</h1>
                            <p className="medplus-pairing-desc">{isLinked ? 'Your MedPlus ID is linked' : 'Link your MedPlus ID to sync health data'}</p>
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
                                <span className="medplus-account-label">Status</span>
                                <span className="medplus-account-value medplus-status-active">Active</span>
                            </div>
                        </div>
                        <div className="medplus-btn-wrapper">
                            {isLinked ? (
                                <button
                                    className="medplus-link-btn"
                                    type="button"
                                    onClick={handleUnlinkClick}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#ef4444',
                                        width: '100%',
                                        marginTop: '16px'
                                    }}
                                >
                                    Unlink
                                </button>
                            ) : (
                                <>
                                    <button className="medplus-cancel-btn" type="button" onClick={handleCancel}>
                                        Cancel
                                    </button>
                                    <button className="medplus-link-btn" type="button" onClick={handleLink}>
                                        Link
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <SuccessModal
                show={showSuccessModal}
                title="Linked Successfully!"
                message="Your MedPlus Customer ID has been linked"
                buttonText="Close"
                onClose={handleCloseSuccess}
            />

            {/* Unlink Warning Modal */}
            <WarningModal
                show={showUnlinkConfirm}
                title="Unlink MedPlus ID?"
                message="Are you sure you want to unlink your MedPlus Customer ID? You can link it again later."
                buttonText="Unlink"
                onClose={() => confirmUnlink()}
                secondaryButtonText="Cancel"
                onSecondaryAction={() => setShowUnlinkConfirm(false)}
            />
        </div>
    );
};

export default MedPlusPairing;
