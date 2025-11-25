import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

export default function OAuth2Redirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth2Redirect = async () => {
      const accessToken = searchParams.get('access');
      const refreshToken = searchParams.get('refresh');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        alert('로그인에 실패했습니다. 다시 시도해주세요.');
        navigate('/');
        return;
      }

      if (accessToken && refreshToken) {
        try {
          // 토큰 저장
          authService.saveTokens({
            accessToken,
            refreshToken,
            expiresIn: 3600, // 1시간 (실제 값은 백엔드에서 설정)
          });

          // 사용자 정보 가져오기
          await userService.getMyInfo();

          // 메인 페이지로 이동
          navigate('/main');
        } catch (error) {
          console.error('Failed to process OAuth2 redirect:', error);
          alert('로그인 처리 중 오류가 발생했습니다.');
          navigate('/');
        }
      } else {
        console.error('Missing access or refresh token');
        alert('토큰을 받지 못했습니다. 다시 시도해주세요.');
        navigate('/');
      }
    };

    handleOAuth2Redirect();
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
      }}
    >
      로그인 처리 중...
    </div>
  );
}
