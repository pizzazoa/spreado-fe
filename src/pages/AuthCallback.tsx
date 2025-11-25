import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        alert('로그인에 실패했습니다. 다시 시도해주세요.');
        navigate('/');
        return;
      }

      if (code) {
        try {
          await login(code);
          // 로그인 성공 후 닉네임 설정 페이지로 이동
          navigate('/signup');
        } catch (error) {
          console.error('Login failed:', error);
          alert('로그인에 실패했습니다. 다시 시도해주세요.');
          navigate('/');
        }
      } else {
        navigate('/');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      로그인 처리 중...
    </div>
  );
}
