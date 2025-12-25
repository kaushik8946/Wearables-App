import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMedplusUsers, getStorageJSON, setStorageJSON } from '../../service';
import SuccessModal from '../../common/SuccessModal/SuccessModal';
import WarningModal from '../../common/WarningModal/WarningModal';
import './PatientLinking.css';

const PatientLinking = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [patientUserMappings, setPatientUserMappings] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isMedPlusLinked, setIsMedPlusLinked] = useState(false);
    const [allMedplusPatients, setAllMedplusPatients] = useState([]);
    const [showLinkedView, setShowLinkedView] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [patientToUnlink, setPatientToUnlink] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Check if MedPlus is linked
                const medPlusData = await getStorageJSON('medPlusCustomer', null);
                setIsMedPlusLinked(!!medPlusData);

                if (!medPlusData) {
                    setLoading(false);
                    return;
                }

                // Load medplus patients
                const medplusUsers = await getMedplusUsers();

                // Load all users (registeredUser + users)
                const registeredUser = await getStorageJSON('registeredUser', null);
                const otherUsers = await getStorageJSON('users', []);
                const allUsers = [];
                if (registeredUser) {
                    allUsers.push({ ...registeredUser, isRegistered: true });
                }
                if (otherUsers && otherUsers.length > 0) {
                    allUsers.push(...otherUsers);
                }
                setUsers(allUsers);

                // Load existing mappings
                const mappings = await getStorageJSON('patientUserMappings', {});
                setPatientUserMappings(mappings);

                // Store all patients
                setAllMedplusPatients(medplusUsers || []);

                // Filter out patients who already have mappings for the default view
                const mappedPatientIds = Object.keys(mappings);
                const unmappedPatients = (medplusUsers || []).filter(
                    patient => !mappedPatientIds.includes(patient.patientId)
                );
                setPatients(unmappedPatients);
            } catch (err) {
                console.error('Failed to load data', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowSelectionModal(true);
    };

    const handlePatientSelect = async (patient) => {
        if (!selectedUser) return;

        try {
            // Create mapping: patientId -> userId
            const newMappings = {
                ...patientUserMappings,
                [patient.patientId]: selectedUser.id
            };

            // Save to IndexedDB
            await setStorageJSON('patientUserMappings', newMappings);
            setPatientUserMappings(newMappings);

            // Remove patient from list since they're now mapped
            setPatients(prev => prev.filter(p => p.patientId !== patient.patientId));

            // Show success modal
            setSuccessMessage(`${patient.name} linked to ${selectedUser.name}`);
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Failed to save mapping', err);
        }

        setShowSelectionModal(false);
        setSelectedUser(null);
    };

    const closeModal = () => {
        setShowSelectionModal(false);
        setSelectedUser(null);
    };

    // Get users that are not already mapped
    const getAvailableUsers = () => {
        const mappedUserIds = Object.values(patientUserMappings);
        return users.filter(user => !mappedUserIds.includes(user.id));
    };

    // Get patients that are not already mapped
    const getAvailablePatients = () => {
        const mappedPatientIds = Object.keys(patientUserMappings);
        return allMedplusPatients.filter(patient => !mappedPatientIds.includes(patient.patientId));
    };

    // Get list of linked patients with their users
    const getLinkedPatients = () => {
        return Object.entries(patientUserMappings).map(([patientId, userId]) => {
            const patient = allMedplusPatients.find(p => p.patientId === patientId);
            const user = users.find(u => u.id === userId);

            // Only return if we found both (should always be true for valid data)
            if (!patient || !user) return null;

            return { patient, user };
        }).filter(Boolean); // Filter out any nulls
    };

    const handleUnlinkClick = (patient) => {
        setPatientToUnlink(patient);
        setShowWarningModal(true);
    };

    const confirmUnlink = async () => {
        if (!patientToUnlink) return;

        try {
            const newMappings = { ...patientUserMappings };
            delete newMappings[patientToUnlink.patientId];

            await setStorageJSON('patientUserMappings', newMappings);
            setPatientUserMappings(newMappings);

            // Refilter unlinked patients list: the unlinked patient should appear back in the available list
            // However, our effect only runs on mount. We should update 'patients' state if we want immediate feedback
            // in the "Link User" view. The current logic re-calculates derived state for "available" patients
            // based on patientUserMappings, but 'patients' state was separate.
            // Since we persist 'allMedplusPatients', we can just let the view handle it, 
            // but 'patients' state is used for the unlinked view.

            // Re-add to 'patients' list if not already there
            setPatients(prev => {
                const exists = prev.some(p => p.patientId === patientToUnlink.patientId);
                if (!exists) {
                    return [...prev, patientToUnlink];
                }
                return prev;
            });

            setSuccessMessage('Unlinked successfully');
            setShowSuccessModal(true);

        } catch (err) {
            console.error("Failed to unlink", err);
        }

        setShowWarningModal(false);
        setPatientToUnlink(null);
    };

    return (
        <div className="patient-linking-bg">
            <div className="patient-linking-root">
                <div className="patient-linking-container">
                    {/* Header */}
                    <div className="patient-linking-header">
                        <div className="patient-linking-header-text">
                            <h1 className="patient-linking-title">Patient Linking</h1>
                            <p className="patient-linking-desc">
                                {showLinkedView
                                    ? "View and manage linked users"
                                    : "Click on a user to map a patient"
                                }
                            </p>
                        </div>
                        <button
                            className="patient-linking-action-btn"
                            style={{
                                marginLeft: 'auto',
                                width: 'auto',
                                minWidth: '180px',
                                textAlign: 'center',
                                padding: '0 16px'
                            }}
                            onClick={() => setShowLinkedView(!showLinkedView)}
                        >
                            {showLinkedView ? "Link New User" : "Show Linked Users"}
                        </button>
                    </div>

                    {/* Content Area */}
                    {showLinkedView ? (
                        /* Linked Patients View */
                        getLinkedPatients().length === 0 ? (
                            <div className="patient-linking-empty">
                                <h2 className="patient-linking-empty-title">No Patients Linked Yet</h2>
                                <p className="patient-linking-empty-desc">Link patients to users to see them here.</p>
                            </div>
                        ) : (
                            <div className="patient-list">
                                {getLinkedPatients().map(({ patient, user }, index) => (
                                    <div
                                        key={patient.patientId || index}
                                        className="patient-card linked-patient-card"
                                        style={{ cursor: 'default' }}
                                    >
                                        <div className="patient-avatar">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div className="patient-info">
                                            <h3 className="patient-name">{user.name}</h3>
                                            <p className="patient-details" style={{ fontSize: '13px', color: '#64748b' }}>
                                                {user.isRegistered ? 'Self' : 'Family Member'}
                                            </p>
                                        </div>
                                        <div className="linked-user-info" style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Linked to</div>
                                            <div style={{ fontWeight: '500', color: '#1e293b' }}>{patient.name}</div>
                                            <button
                                                className="patient-linking-action-btn"
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    background: '#fee2e2',
                                                    color: '#ef4444',
                                                    width: 'auto'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnlinkClick(patient);
                                                }}
                                            >
                                                Unlink
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* Unlinked Patients List (Existing) */
                        loading ? (
                            <div className="patient-linking-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading patients...</p>
                            </div>
                        ) : !isMedPlusLinked ? (
                            <div className="patient-linking-empty">
                                <div className="patient-linking-icon patient-linking-icon-warning">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
                                    </svg>
                                </div>
                                <h2 className="patient-linking-empty-title">MedPlus Not Linked</h2>
                                <p className="patient-linking-empty-desc">
                                    Please link your MedPlus Customer ID first to access patient data.
                                </p>
                                <button
                                    className="patient-linking-action-btn"
                                    onClick={() => navigate('/medplus-pairing')}
                                >
                                    Link MedPlus ID
                                </button>
                            </div>
                        ) : getAvailableUsers().length === 0 ? (
                            <div className="patient-linking-empty">
                                <div className="patient-linking-icon">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M16 11l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h2 className="patient-linking-empty-title">No Available Users to Link</h2>
                            </div>
                        ) : (
                            <div className="user-grid-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '16px' }}>
                                {getAvailableUsers().map((user, index) => (
                                    <div
                                        key={user.id || index}
                                        className="user-card"
                                        style={{
                                            background: 'white',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            border: '1px solid #e2e8f0',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => handleUserClick(user)}
                                    >
                                        <div className="user-avatar" style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#f1f5f9',
                                            color: '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div className="user-info">
                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{user.name}</h3>
                                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                                {user.isRegistered && <span style={{ background: '#dbeafe', color: '#2563eb', padding: '2px 6px', borderRadius: '4px' }}>Self</span>}
                                                {user.gender && <span>{user.gender}</span>}
                                                {user.age && <span>{user.age}y</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                </div>
            </div>

            {/* Patient Selection Modal */}
            {
                showSelectionModal && (
                    <div className="user-modal-overlay" onClick={closeModal}>
                        <div className="user-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="user-modal-header">
                                <h2>Select Patient</h2>
                                <p>Link <strong>{selectedUser?.name}</strong> to:</p>
                                <button className="user-modal-close" onClick={closeModal}>
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className="user-modal-list">
                                {getAvailablePatients().length === 0 ? (
                                    <div className="no-users-message">
                                        <p>No available patients to link</p>
                                    </div>
                                ) : (
                                    getAvailablePatients().map((patient, index) => (
                                        <div
                                            key={patient.patientId || index}
                                            className="user-option"
                                            onClick={() => handlePatientSelect(patient)}
                                        >
                                            <div className="user-option-avatar">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                            <div className="user-option-info">
                                                <h4 className="user-option-name">{patient.name}</h4>
                                                <div className="user-option-details">
                                                    <span>{patient.patientId}</span>
                                                    {patient.age && <span>{patient.age}y</span>}
                                                </div>
                                            </div>
                                            <div className="user-option-arrow">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Success Modal */}
            <SuccessModal
                show={showSuccessModal}
                title="Linked Successfully!"
                message={successMessage}
                onClose={() => setShowSuccessModal(false)}
            />

            {/* Warning Modal */}
            <WarningModal
                show={showWarningModal}
                title="Unlink Patient?"
                message={`Are you sure you want to unlink ${patientToUnlink?.name}?`}
                buttonText="Cancel"
                secondaryButtonText="Unlink"
                onClose={() => setShowWarningModal(false)}
                onSecondaryAction={confirmUnlink}
            />
        </div >
    );
};

export default PatientLinking;
