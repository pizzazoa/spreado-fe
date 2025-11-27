import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import OAuth2Redirect from './pages/OAuth2Redirect';
import MainPage from './pages/MainPage';
import MeetingPage from './pages/MeetingPage';
import MeetingOnGoingPage from './pages/MeetingOnGoingPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/invite/:inviteCode" element={<MainPage />} />
          <Route path="/meeting/:meetingId" element={<MeetingPage />} />
          <Route path="/meeting-live/:meetingId" element={<MeetingOnGoingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
