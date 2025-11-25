import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import logoImage from '../assets/spreado_logo.png';
import loginButtonImage from '../assets/google_login_button.png';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();

  // 이미 로그인된 경우 리디렉션
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // 사용자 이름이 없으면 닉네임 설정 페이지로
      if (!user.name || user.name.trim() === '') {
        navigate('/signup');
      } else {
        // 대기 중인 초대 확인
        const pendingInvite = sessionStorage.getItem('pendingInvite');
        if (pendingInvite) {
          sessionStorage.removeItem('pendingInvite');
          navigate(`/invite/${pendingInvite}`);
        } else {
          // 메인 페이지로 이동
          navigate('/main');
        }
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleGoogleLogin = () => {
    // Google OAuth URL로 리디렉션
    const authUrl = authService.getGoogleAuthUrl();
    window.location.href = authUrl;
  };

  return (
    <div className="login-page">
      <div className="login-sheet">
        <div className="login-window" />
        <div className="login-content">
          <div className="logo-text-container">
            <div className="logo-wrapper">
              <img src={logoImage} alt="SpreaDo Logo" className="logo-image" />
            </div>
            <div className="welcome-text">
              <p>SpreaDo에 오신 것을 환영합니다</p>
              <p>&nbsp;</p>
              <p>당신의 회의록을 효율적으로 관리하세요</p>
            </div>
          </div>
          <div className="login-button-wrapper">
            <button onClick={handleGoogleLogin} className="google-login-button">
              <img src={loginButtonImage} alt="Sign in with Google" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
