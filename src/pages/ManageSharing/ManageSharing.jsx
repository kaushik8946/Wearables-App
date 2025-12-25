import React, { useState, useEffect } from 'react';
import { getStorageJSON, setStorageJSON } from '../../service';
import WarningModal from '../../common/WarningModal/WarningModal';
import './ManageSharing.css';

const ManageSharing = () => {
    const [shareRequests, setShareRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [requestToCancel, setRequestToCancel] = useState(null);

    useEffect(() => {
        loadShareRequests();
    }, []);

    const loadShareRequests = async () => {
        try {
            const requests = await getStorageJSON('shareRequests', []);
            setShareRequests(requests);
        } catch (err) {
            console.error('Failed to load share requests', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (request) => {
        setRequestToCancel(request);
        setShowWarningModal(true);
    };

    const confirmCancelSharing = async () => {
        if (!requestToCancel) return;

        try {
            const updatedRequests = shareRequests.filter(req => req.id !== requestToCancel.id);
            await setStorageJSON('shareRequests', updatedRequests);
            setShareRequests(updatedRequests);
        } catch (err) {
            console.error('Failed to cancel sharing', err);
            alert('Failed to cancel sharing. Please try again.');
        } finally {
            setShowWarningModal(false);
            setRequestToCancel(null);
        }
    };

    const getStatusClass = (status) => {
        return status === 'accepted' ? 'status-accepted' : 'status-pending';
    };

    const getStatusLabel = (status) => {
        return status === 'accepted' ? 'Accepted' : 'Yet to Accept';
    };

    return (
        <div className="manage-sharing-bg">
            <div className="manage-sharing-root">
                <div className="manage-sharing-container">
                    {/* Header */}
                    <div className="manage-sharing-header">
                        <div className="manage-sharing-header-text">
                            <h1 className="manage-sharing-title">Manage Sharing</h1>
                            <p className="manage-sharing-desc">View and manage your shared health data</p>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="manage-sharing-loading">Loading...</div>
                    ) : shareRequests.length === 0 ? (
                        <div className="manage-sharing-empty">
                            <div className="manage-sharing-empty-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08261 9.19071C7.54305 8.46214 6.6899 8 5.73077 8C4.21539 8 3 9.34315 3 11C3 12.6569 4.21539 14 5.73077 14C6.6899 14 7.54305 13.5379 8.08261 12.8093L15.0227 16.6294C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.041 14 16.1878 14.4621 15.6483 15.1907L8.70815 11.3706C8.72315 11.2492 8.73077 11.1255 8.73077 11C8.73077 10.8745 8.72315 10.7508 8.70815 10.6294L15.6483 6.80929C16.1878 7.53786 17.041 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 className="manage-sharing-empty-title">No Active Sharing</h2>
                            <p className="manage-sharing-empty-desc">
                                You haven't shared your health data with anyone yet.
                            </p>
                        </div>
                    ) : (
                        <div className="manage-sharing-list">
                            {shareRequests.map((request) => (
                                <div key={request.id} className="manage-sharing-card">
                                    <div className="manage-sharing-card-header">
                                        <span className="manage-sharing-mobile">{request.recipientMobile}</span>
                                        <span className={`manage-sharing-status ${getStatusClass(request.status)}`}>
                                            {getStatusLabel(request.status)}
                                        </span>
                                    </div>
                                    <div className="manage-sharing-card-details">
                                        <div className="manage-sharing-detail-row">
                                            <span className="manage-sharing-detail-label">Duration</span>
                                            <span className="manage-sharing-detail-value">{request.durationLabel}</span>
                                        </div>
                                        <div className="manage-sharing-detail-row">
                                            <span className="manage-sharing-detail-label">Shared On</span>
                                            <span className="manage-sharing-detail-value">
                                                {new Date(request.createdAt).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="manage-sharing-cancel-btn"
                                        onClick={() => handleCancelClick(request)}
                                    >
                                        Cancel Sharing
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Warning Modal */}
            <WarningModal
                show={showWarningModal}
                title="Cancel Sharing"
                message={`Are you sure you want to stop sharing your health data with ${requestToCancel?.recipientMobile}?`}
                buttonText="Yes, Cancel"
                onClose={confirmCancelSharing}
                secondaryButtonText="No, Keep"
                onSecondaryAction={() => {
                    setShowWarningModal(false);
                    setRequestToCancel(null);
                }}
            />
        </div>
    );
};

export default ManageSharing;
