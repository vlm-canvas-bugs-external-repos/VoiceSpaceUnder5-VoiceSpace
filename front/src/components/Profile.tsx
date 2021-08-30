import React, {useState} from 'react';
import {Menu, Dropdown} from 'antd';
import {LeftCircleFilled, RightCircleFilled} from '@ant-design/icons';
import '../pages/spacePage/space.css';
import PeerManager from '../utils/RTCGameUtils';
const imgSrcs = [
  './assets/spaceMain/avatar/brownHorseFaceMute.png',
  './assets/spaceMain/avatar/brownBearFaceMute.png',
  './assets/spaceMain/avatar/pinkPigFaceMute.png',
  './assets/spaceMain/avatar/whiteRabbitFaceMute.png',
];

const animalName: string[] = ['말', '곰', '돼지', '토끼'];

interface ProfileProps {
  peerManager: PeerManager;
}

function Profile(props: ProfileProps): JSX.Element {
  const [changedName, setChangedName] = useState(props.peerManager.me.nickname);
  const [nickname, setNickname] = useState(props.peerManager.me.nickname);
  const [avatarIdx, setAvatarIdx] = useState(props.peerManager.me.avatar);
  const [changedIdx, setChangedIdx] = useState(props.peerManager.me.avatar);
  const onProfileChangeButtonClick = (
    newAvatarIdx: number,
    newNickname: string,
  ) => {
    props.peerManager.me.avatar = newAvatarIdx;
    props.peerManager.me.div.innerText = newNickname;
    props.peerManager.me.nickname = newNickname;
  };
  const notChanged = () => {
    setTimeout(() => {
      setNickname(changedName);
      setAvatarIdx(changedIdx);
    }, 500);
  };
  const profile = () => {
    const onNicknameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNickname(e.target.value);
    };
    const onLeftClick = () => {
      setAvatarIdx((avatarIdx + 3) % 4);
    };
    const onRightClick = () => {
      setAvatarIdx((avatarIdx + 1) % 4);
    };
    const onProfileChangeClick = () => {
      const anonymous = '익명의 ';
      if (nickname !== '') {
        onProfileChangeButtonClick(avatarIdx, nickname);
        setNickname(nickname);
        setChangedName(nickname);
        setChangedIdx(avatarIdx);
      } else {
        onProfileChangeButtonClick(
          avatarIdx,
          anonymous + animalName[avatarIdx],
        );
        setNickname(anonymous + animalName[avatarIdx]);
        setChangedName(anonymous + animalName[avatarIdx]);
        setChangedIdx(avatarIdx);
      }
    };
    return (
      <Menu className="navbar_profile">
        <div className="profile_title">프로필 설정</div>
        <Menu.Divider></Menu.Divider>
        <div>
          <div className="name_title">이름</div>
          <div className="profile_input">
            <input maxLength={10} value={nickname} onChange={onNicknameInput} />
          </div>
          <div className="avatar_title">아바타</div>
          <div className="profile_avatar">
            <button>
              <LeftCircleFilled onClick={onLeftClick} />
            </button>
            <img className="avatar_preview" src={imgSrcs[avatarIdx]}></img>
            <button>
              <RightCircleFilled onClick={onRightClick} />
            </button>
          </div>
        </div>
        <div className="profile_button">
          <Menu.Item className="change_button" onClick={onProfileChangeClick}>
            변경
          </Menu.Item>
        </div>
      </Menu>
    );
  };
  return (
    <Dropdown
      onVisibleChange={notChanged}
      overlay={profile}
      trigger={['click']}
    >
      <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
        <span className="navbar_button">{changedName}</span>
      </a>
    </Dropdown>
  );
}

export default Profile;
