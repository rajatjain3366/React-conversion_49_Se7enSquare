import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from './store/slices/authSlice';

// Pages
import Index from './Pages/Index';
import Landing from './Pages/Landing';
import Login from './Pages/Login';
import Terms from './Pages/Terms';
import Privacy from './Pages/Privacy';
import Pricing from './Pages/Pricing';
import Dashboard from './Pages/Dashboard';
import Chat from './Pages/Chat';
import Discovery from './Pages/Discovery';
import Events from './Pages/Events/Events';
import EventApproval from './Pages/EventApproval/EventApproval';
import EventRegistrants from './Pages/EventRegistrants/EventRegistrants';
import CreateCommunity from './Pages/CreateCommunity';
import CommunityPage from './Pages/CommunityPage';
import CommunitySettings from './Pages/CommunitySettings';
import Report from './Pages/Report';
import Appeal from './Pages/Appeal';
import ModPanel from './Pages/ModPanel';
import AdminDashboard from './Pages/AdminDashboard';
import OrganizerDashboard from './Pages/OrganizerDashboard/OrganizerDashboard';
import OwnerDashboard from './Pages/OwnerDashboard';
import ProfileSettings from './Pages/ProfileSettings';
import User from './Pages/User';
import { getHomeRoute } from './services/roleAccess';

// Protected Route wrapper with role-based access control.
// Reads the user from the Redux store, so logging in or out re-renders it.
function ProtectedRoute({ children, allowedRoles, allowOwner = false }) {
  const user = useSelector(selectCurrentUser);

  if (!user || !user.username || user.id === undefined || user.id === null) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || 'user').toLowerCase();

  // Platform owner is a statistics-only role; redirect away from generic player dashboard
  if (role === 'owner' && !allowOwner && (!allowedRoles || !allowedRoles.includes('owner'))) {
    return <Navigate to={getHomeRoute(role)} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Admin has superuser access to all operational views
    if (role === 'admin') {
      return children;
    }
    if (!allowedRoles.includes(role)) {
      return <Navigate to={getHomeRoute(role)} replace />;
    }
  }

  return children;
}


export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/landing.html" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login.html" element={<Login />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/terms.html" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/privacy.html" element={<Privacy />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/pricing.html" element={<Pricing />} />

      {/* Authenticated User Core Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard.html" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat.html" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/discovery" element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
      <Route path="/discovery.html" element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
      <Route path="/create-community" element={<ProtectedRoute><CreateCommunity /></ProtectedRoute>} />
      <Route path="/create-community.html" element={<ProtectedRoute><CreateCommunity /></ProtectedRoute>} />
      <Route path="/community-page" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/community-page.html" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/community-page/:id" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/community/:id" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/community-settings" element={<ProtectedRoute><CommunitySettings /></ProtectedRoute>} />
      <Route path="/community-settings.html" element={<ProtectedRoute><CommunitySettings /></ProtectedRoute>} />
      <Route path="/community-settings/:id" element={<ProtectedRoute><CommunitySettings /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/events.html" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/event-registrants" element={<ProtectedRoute><EventRegistrants /></ProtectedRoute>} />
      <Route path="/event-registrants.html" element={<ProtectedRoute><EventRegistrants /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      <Route path="/report.html" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      <Route path="/appeal" element={<Appeal />} />
      <Route path="/appeal.html" element={<Appeal />} />
      <Route path="/profile-settings" element={<ProtectedRoute allowOwner><ProfileSettings /></ProtectedRoute>} />
      <Route path="/profile-settings.html" element={<ProtectedRoute allowOwner><ProfileSettings /></ProtectedRoute>} />
      <Route path="/user" element={<ProtectedRoute allowedRoles={['admin']}><User /></ProtectedRoute>} />
      <Route path="/user.html" element={<ProtectedRoute allowedRoles={['admin']}><User /></ProtectedRoute>} />

      {/* Role-Specific Protected Routes */}
      <Route
        path="/admin-dashboard"
        element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
      />
      <Route
        path="/admin-dashboard.html"
        element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
      />
      <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
      <Route
        path="/owner-dashboard"
        element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/owner-dashboard.html"
        element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerDashboard /></ProtectedRoute>}
      />
      <Route path="/owner" element={<Navigate to="/owner-dashboard" replace />} />
      <Route
        path="/organizer-dashboard"
        element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><OrganizerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/organizer-dashboard.html"
        element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><OrganizerDashboard /></ProtectedRoute>}
      />
      <Route path="/organizer" element={<Navigate to="/organizer-dashboard" replace />} />
      <Route
        path="/mod-panel"
        element={<ProtectedRoute allowedRoles={['moderator', 'admin']}><ModPanel /></ProtectedRoute>}
      />
      <Route
        path="/mod-panel.html"
        element={<ProtectedRoute allowedRoles={['moderator', 'admin']}><ModPanel /></ProtectedRoute>}
      />
      <Route path="/mod" element={<Navigate to="/mod-panel" replace />} />
      <Route
        path="/event-approval"
        element={<ProtectedRoute allowedRoles={['community_manager', 'manager', 'admin']}><EventApproval /></ProtectedRoute>}
      />
      <Route
        path="/event-approval.html"
        element={<ProtectedRoute allowedRoles={['community_manager', 'manager', 'admin']}><EventApproval /></ProtectedRoute>}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
