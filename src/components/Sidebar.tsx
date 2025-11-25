import type { Group } from '../types';
import logoImage from '../assets/spreado_logo.png';
import './Sidebar.css';

interface SidebarProps {
  groups: Group[];
  selectedGroupId: number | null;
  onSelectGroup: (groupId: number | null) => void;
  onCreateGroup: () => void;
  onMyProfile: () => void;
}

export default function Sidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onMyProfile,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <button className="my-profile-button" onClick={onMyProfile}>
        내 프로필
      </button>

      <img src={logoImage} alt="SpreaDo" className="sidebar-logo" />

      <div className="divider-top" />

      <div className="group-list">
        {groups.map((group) => (
          <div
            key={group.groupId}
            className={`group-item ${selectedGroupId === group.groupId ? 'selected' : ''}`}
            onClick={() => onSelectGroup(group.groupId)}
          >
            <div className="group-avatar">{group.name.charAt(0).toUpperCase()}</div>
            <div className="group-name">{group.name}</div>
          </div>
        ))}
      </div>

      <div className="divider-bottom" />

      <button className="create-group-button" onClick={onCreateGroup}>
        + 새 그룹 생성
      </button>
    </div>
  );
}
