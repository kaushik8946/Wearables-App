import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMedplusUsers, getStorageJSON, setStorageJSON } from '../../service';
import SuccessModal from '../../common/SuccessModal/SuccessModal';
import './PatientLinking.css';

const PatientLinking = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [patientUserMappings, setPatientUserMappings] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
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

                // Filter out already mapped patients (by userId - patients whose userId is already mapped)
                const mappedUserIds = Object.values(mappings);
                const unmappedPatients = (medplusUsers || []).filter(
                    patient => !mappedUserIds.includes(patient.userId)
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

    const handlePatientClick = (patient) => {
        setSelectedPatient(patient);
        setShowUserModal(true);
    };

    const handleUserSelect = async (user) => {
        if (!selectedPatient) return;

        try {
            // Create mapping: patientId -> userId
            const newMappings = {
                ...patientUserMappings,
                [selectedPatient.patientId]: user.id
            };

            // Save to IndexedDB
            await setStorageJSON('patientUserMappings', newMappings);
            setPatientUserMappings(newMappings);

            // Remove the mapped patient from the list
            setPatients(prev => prev.filter(p => p.patientId !== selectedPatient.patientId));

            // Show success modal
            setSuccessMessage(`${selectedPatient.name} linked to ${user.name}`);
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Failed to save mapping', err);
        }

        setShowUserModal(false);
        setSelectedPatient(null);
    };

    const closeModal = () => {
        setShowUserModal(false);
        setSelectedPatient(null);
    };

    // Get users that are not already mapped
    const getAvailableUsers = () => {
        const mappedUserIds = Object.values(patientUserMappings);
        return users.filter(user => !mappedUserIds.includes(user.id));
    };

    return (
        <div className="patient-linking-bg">
            <div className="patient-linking-root">
                <div className="patient-linking-container">
                    {/* Header with Back Button */}
                    <div className="patient-linking-header">
                        <button
                            className="patient-linking-back-btn"
                            onClick={() => navigate('/users')}
                            aria-label="Go back"
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <div className="patient-linking-header-text">
                            <h1 className="patient-linking-title">Patient Linking</h1>
                            <p className="patient-linking-desc">Click on a patient to link them to a user</p>
                        </div>
                    </div>

                    {/* Patients List */}
                    {loading ? (
                        <div className="patient-linking-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading patients...</p>
                        </div>
                    ) : patients.length === 0 ? (
                        <div className="patient-linking-empty">
                            <div className="patient-linking-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M16 11l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 className="patient-linking-empty-title">No Patients Available to Link</h2>
                        </div>
                    ) : (
                        <div className="patient-list">
                            {patients.map((patient, index) => (
                                <div
                                    key={patient.patientId || index}
                                    className="patient-card"
                                    onClick={() => handlePatientClick(patient)}
                                >
                                    <div className="patient-avatar">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="patient-info">
                                        <h3 className="patient-name">{patient.name}</h3>
                                        <div className="patient-details">
                                            {patient.age && <span className="patient-age">{patient.age} years</span>}
                                            {patient.gender && <span className="patient-gender">{patient.gender}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* User Selection Modal */}
            {showUserModal && (
                <div className="user-modal-overlay" onClick={closeModal}>
                    <div className="user-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="user-modal-header">
                            <h2>Select User</h2>
                            <p>Link <strong>{selectedPatient?.name}</strong> to:</p>
                            <button className="user-modal-close" onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <div className="user-modal-list">
                            {getAvailableUsers().length === 0 ? (
                                <div className="no-users-message">
                                    <p>No available users to link</p>
                                </div>
                            ) : (
                                getAvailableUsers().map((user, index) => (
                                    <div
                                        key={user.id || index}
                                        className="user-option"
                                        onClick={() => handleUserSelect(user)}
                                    >
                                        <div className="user-option-avatar">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div className="user-option-info">
                                            <h4 className="user-option-name">{user.name}</h4>
                                            <div className="user-option-details">
                                                {user.age && <span>{user.age} years</span>}
                                                {user.gender && <span>{user.gender}</span>}
                                                {user.isRegistered && <span className="registered-badge">Self</span>}
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
            )}

            {/* Success Modal */}
            <SuccessModal
                show={showSuccessModal}
                title="Linked Successfully!"
                message={successMessage}
                onClose={() => setShowSuccessModal(false)}
            />
        </div>
    );
};

export default PatientLinking;
