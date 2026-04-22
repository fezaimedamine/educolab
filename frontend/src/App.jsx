import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DirectoryPage from './pages/DirectoryPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import MeetingsPage from './pages/MeetingsPage';
import LiveMeetPage from './pages/LiveMeetPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';
import TeacherPage from './pages/TeacherPage';

const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected */}
            <Route path="/directory" element={<P><DirectoryPage /></P>} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:id" element={<ChatPage />} />
            <Route path="/announcements" element={<P><AnnouncementsPage /></P>} />
            <Route path="/meetings" element={<P><MeetingsPage /></P>} />
            <Route path="/meet/:id" element={<P><LiveMeetPage /></P>} />
            <Route path="/notifications" element={<P><NotificationsPage /></P>} />
            <Route path="/admin" element={<P><AdminPage /></P>} />
            <Route path="/teacher" element={<P><TeacherPage /></P>} />

            {/* Default */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
