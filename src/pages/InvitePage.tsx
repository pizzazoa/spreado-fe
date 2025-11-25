import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GroupInviteModal from '../components/GroupInviteModal';
import MainPage from './MainPage';

export default function InvitePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (!inviteCode) {
      navigate('/');
      return;
    }

    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!user) {
      // 로그인 후 다시 돌아올 수 있도록 inviteCode를 sessionStorage에 저장
      sessionStorage.setItem('pendingInvite', inviteCode);
      navigate('/', { state: { from: `/invite/${inviteCode}` } });
      return;
    }

    // 초대 링크 재구성
    const fullInviteLink = `${window.location.origin}/invite/${inviteCode}`;
    setInviteLink(fullInviteLink);

    // 그룹 이름 추출 (inviteCode에서 추출하거나 API로 가져오기)
    // 현재는 임시로 설정
    setGroupName('그룹'); // TODO: API로 그룹 정보 가져오기
    setShowInviteModal(true);
  }, [inviteCode, user, navigate]);

  const handleInviteSuccess = () => {
    navigate('/main');
  };

  const handleInviteClose = () => {
    navigate('/main');
  };

  return (
    <>
      <MainPage />
      <GroupInviteModal
        isOpen={showInviteModal}
        onClose={handleInviteClose}
        groupName={groupName}
        inviteLink={inviteLink}
        onSuccess={handleInviteSuccess}
      />
    </>
  );
}
