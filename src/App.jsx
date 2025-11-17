import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Users from './pages/Family';

import ClassWorkout from './pages/ClassWorkout';
import ManageAccount from './pages/ManageAccount';
import './styles/global.css';

function App() {
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
}

export default App;
