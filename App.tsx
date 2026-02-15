
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Onboarding } from './pages/Onboarding';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SchedulePage } from './pages/SchedulePage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LinkedInCallback } from './pages/LinkedInCallback';
import { DevNavigation } from './components/DevNavigation';

function App() {
  return (
    <HashRouter>
      <DevNavigation />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/checkout/:planId" element={<CheckoutPage />} />
        
        {/* OAuth Callbacks */}
        <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
        
        {/* Auth Placeholder */}
        <Route path="/login" element={<Navigate to="/app/dashboard" replace />} />
        
        {/* App Routes */}
        <Route path="/app/onboarding" element={<Onboarding />} />
        <Route path="/app/dashboard" element={<UserDashboard />} />
        <Route path="/app/schedule" element={<SchedulePage />} />
        <Route path="/app/logs" element={<ActivityLogPage />} />
        <Route path="/app/settings" element={<SettingsPage />} />
        
        <Route path="/app/*" element={<Navigate to="/app/dashboard" replace />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
