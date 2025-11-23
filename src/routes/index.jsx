// src/routes/index.jsx
// Central routing configuration for the application

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import Signup from '../pages/Signup/Signup';
import Layout from '../common/Layout/Layout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Devices from '../pages/Devices/Devices';
import Users from '../pages/Family/Family';
import ClassWorkout from '../pages/ClassWorkout/ClassWorkout';
import ManageAccount from '../pages/ManageAccount/ManageAccount';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/users" element={<Users />} />
          <Route path="/class-workout" element={<ClassWorkout />} />
          <Route path="/manage-account" element={<ManageAccount />} />
        </Route>

        {/* Redirect /home to /dashboard */}
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
