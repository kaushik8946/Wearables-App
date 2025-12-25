import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorageItem, getStorageJSON, setStorageJSON, getUserById, getDefaultDeviceForUser } from '../../service';
import WarningModal from '../../common/WarningModal/WarningModal';
import SuccessModal from '../../common/SuccessModal/SuccessModal';
import './ShareDetails.css';

const ShareDetails = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [mobileError, setMobileError] = useState('');
    const [shareDuration, setShareDuration] = useState('');
    const [userMobile, setUserMobile] = useState('');
    const [shareRequests, setShareRequests] = useState([]);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [warningTitle, setWarningTitle] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [pendingShare, setPendingShare] = useState(null);

    const durationLabels = {
        '1day': '1 Day',
        '2days': '2 Days',
        '1week': '1 Week',
        'forever': 'Forever'
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get active user
                let activeId = await getStorageItem('activeUserId');
                if (!activeId) {
                    activeId = await getStorageItem('defaultUserId');
                }

                if (activeId) {
                    const user = await getUserById(activeId);
                    if (user) {
                        setUserName(user.name || 'Unknown User');
                        setUserMobile(user.mobile || user.phone || '');

                        // Get user's default device
                        const device = await getDefaultDeviceForUser(activeId);
                        if (device) {
                            setDeviceName(device.name || 'Unknown Device');
                        }
                    }
                }

                // Load existing share requests
                const existingRequests = await getStorageJSON('shareRequests', []);
                setShareRequests(existingRequests);
            } catch (err) {
                console.error('Failed to load data', err);
            }
        };

        loadData();
    }, []);

    const handleMobileChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
        if (value.length <= 10) {
            setMobileNumber(value);
            if (value.length === 10) {
                setMobileError('');
            } else if (value.length > 0) {
                setMobileError('Must be exactly 10 digits');
            } else {
                setMobileError('');
            }
        }
    };

    const handleSendRequest = async () => {
        // Check if sharing to self
        if (userMobile && mobileNumber === userMobile) {
            setWarningTitle('Cannot Share to Self');
            setWarningMessage('You cannot share your health data with your own mobile number.');
            setShowWarningModal(true);
            return;
        }

        // Check if already shared to this number
        const existingShare = shareRequests.find(req => req.recipientMobile === mobileNumber);
        if (existingShare) {
            setWarningTitle('Already Shared');
            setWarningMessage(`You have already shared your data with ${mobileNumber}. Do you want to update the sharing duration?`);
            setPendingShare({ update: true, existingId: existingShare.id });
            setShowWarningModal(true);
            return;
        }

        // Save new share request
        await saveShareRequest();
    };

    const saveShareRequest = async (updateExistingId = null) => {
        try {
            const newRequest = {
                id: updateExistingId || Date.now().toString(),
                recipientMobile: mobileNumber,
                duration: shareDuration,
                durationLabel: durationLabels[shareDuration],
                userName,
                deviceName,
                status: Math.random() > 0.5 ? 'accepted' : 'yet to accept',
                createdAt: new Date().toISOString()
            };

            let updatedRequests;
            if (updateExistingId) {
                updatedRequests = shareRequests.map(req =>
                    req.id === updateExistingId ? newRequest : req
                );
            } else {
                updatedRequests = [...shareRequests, newRequest];
            }

            await setStorageJSON('shareRequests', updatedRequests);
            setShareRequests(updatedRequests);
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Failed to save share request', err);
            alert('Failed to save share request. Please try again.');
        }
    };

    const handleWarningConfirm = async () => {
        setShowWarningModal(false);
        if (pendingShare?.update) {
            await saveShareRequest(pendingShare.existingId);
        }
        setPendingShare(null);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigate('/dashboard');
    };

    return (
        <div className="share-details-bg">
            <div className="share-details-root">
                <div className="share-details-container">
                    {/* Header */}
                    <div className="share-details-header">
                        <div className="share-details-header-text">
                            <h1 className="share-details-title">Share Details</h1>
                            <p className="share-details-desc">Share your health data with others</p>
                        </div>
                    </div>

                    {/* User and Device Info */}
                    <div className="share-details-info-card">
                        <div className="share-details-info-row">
                            <span className="share-details-info-label">User</span>
                            <span className="share-details-info-value">{userName || 'Loading...'}</span>
                        </div>
                        <div className="share-details-info-row">
                            <span className="share-details-info-label">Device</span>
                            <span className="share-details-info-value">{deviceName || 'No device'}</span>
                        </div>
                    </div>

                    {/* Recipient Mobile Number */}
                    <div className="share-details-form-card">
                        <div className="share-details-form-group">
                            <label className="share-details-form-label">
                                Recipient Mobile Number <span className="required">*</span>
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className={`share-details-input ${mobileError ? 'error' : ''}`}
                                placeholder="Enter 10-digit mobile number"
                                value={mobileNumber}
                                onChange={handleMobileChange}
                                maxLength={10}
                            />
                            {mobileError && (
                                <span className="share-details-error">{mobileError}</span>
                            )}
                        </div>

                        {/* Share Duration */}
                        <div className="share-details-form-group">
                            <label className="share-details-form-label">
                                Share Duration <span className="required">*</span>
                            </label>
                            <select
                                className="share-details-select"
                                value={shareDuration}
                                onChange={(e) => setShareDuration(e.target.value)}
                            >
                                <option value="">Select duration</option>
                                <option value="1day">1 Day</option>
                                <option value="2days">2 Days</option>
                                <option value="1week">1 Week</option>
                                <option value="forever">Forever</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="share-details-actions">
                        <button
                            className="share-details-btn cancel"
                            onClick={() => navigate('/dashboard')}
                        >
                            Cancel
                        </button>
                        <button
                            className="share-details-btn submit"
                            disabled={mobileNumber.length !== 10 || !shareDuration}
                            onClick={handleSendRequest}
                        >
                            Send Share Request
                        </button>
                    </div>
                </div>
            </div>

            {/* Warning Modal */}
            <WarningModal
                show={showWarningModal}
                title={warningTitle}
                message={warningMessage}
                buttonText={pendingShare?.update ? "Update" : "OK"}
                onClose={() => {
                    setShowWarningModal(false);
                    setPendingShare(null);
                }}
                secondaryButtonText={pendingShare?.update ? "Cancel" : null}
                onSecondaryAction={pendingShare?.update ? () => {
                    setShowWarningModal(false);
                    setPendingShare(null);
                } : null}
                onConfirm={pendingShare?.update ? handleWarningConfirm : null}
            />

            {/* Success Modal */}
            <SuccessModal
                show={showSuccessModal}
                title="Share Request Sent"
                message={`Your health data will be shared with ${mobileNumber} for ${durationLabels[shareDuration] || shareDuration}.`}
                buttonText="Done"
                onClose={handleSuccessClose}
            />
        </div>
    );
};

export default ShareDetails;
