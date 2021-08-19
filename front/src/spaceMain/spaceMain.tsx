import React, {useEffect, useRef, useContext} from 'react';
import {RouteComponentProps} from 'react-router-dom';
import ImageInfoProvider from './ImageInfoProvider';
import GLHelper, {
  DrawInfo,
  Camera,
  resizeCanvasToDisplaySize,
} from './webGLUtils';
import io from 'socket.io-client';
import PeerManager from './RTCGameUtils';
import Navigation from './Navigation';
import Joystick from './Joystick';
import './spaceMain.css';
import {AnimalImageEnum} from './ImageMetaData';
import GlobalContext from './GlobalContext';

const qs = require('query-string');

interface SpaceMainQuery {
  roomId: string;
  nickname: string;
  avatarIdx: number;
}

const SpaceMain = (props: RouteComponentProps) => {
  const query = qs.parse(props.location.search) as SpaceMainQuery; // URL에서 쿼리 부분 파싱하여 roomId, nickname, avatarIdx 를 가진 SpaceMainQuery 객체에 저장
  const canvasRef = useRef<HTMLCanvasElement>(null); //canvas DOM 선택하기
  const peerManagerRef = useRef<PeerManager>();
  const globalContext = useContext(GlobalContext);
  globalContext.initialInfo = [query.avatarIdx, query.nickname];

  // 랜더링할 때 처음 한번만 실행.
  const onProfileChangeButtonClick = (
    newAvatarIdx: number,
    newNickname: string,
  ) => {
    if (peerManagerRef.current !== undefined) {
      peerManagerRef.current.me.animal = newAvatarIdx;
      peerManagerRef.current.me.div.innerText = newNickname;
      peerManagerRef.current.me.nickname = newNickname;
    }
  };

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('set canvas HTML Error');
      return;
    }
    const canvas = canvasRef.current;
    // webgl을 사용하기 위해 Context를 가져옴 아몰랑
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('getContext Error');
      return;
    }
    const imageInfoProvider = new ImageInfoProvider(gl, 0); // image와 관련된 정보들을 모두 저장
    if (!imageInfoProvider) {
      console.error('makeImageInfoProvider fail');
      return;
    }

    const backgroundImageInfo = imageInfoProvider.objectsArray[0][0];

    //카메라 객체 초기화
    const camera = new Camera(
      {width: canvas.clientWidth, height: canvas.clientHeight},
      backgroundImageInfo.centerPos,
      backgroundImageInfo.size,
    );

    //webGL관련 작업 처리(그리기 전 준비 끝리
    const glHelper = new GLHelper(gl, camera);
    if (!glHelper) {
      console.error('make GLHelper fail');
      return;
    }

    //내 오디오 연결 가져오고,
    navigator.mediaDevices
      .getUserMedia({video: false, audio: true}) // 오디오 연결
      .then((stream: MediaStream) => {
        const audioContainer = document.querySelector('#audioContainer');
        if (!audioContainer) {
          console.error('audioContainer can not found');
          return;
        }
        // 이름표
        const divContainer = document.querySelector(
          '#divContainer',
        ) as HTMLDivElement;
        if (!divContainer) {
          console.error('divContainer can not found');
          return;
        }
        // 백엔드와 연결, socket을 통해 백엔드와 소통
        // const socket = io("http://localhost:8080");
        const socket = io('https://under5.site:8080');
        if (!socket) {
          console.error('socket connection fail');
          return;
        }

        // 나, 너 그리고 우리를 관리하는 객체
        globalContext.peerManager = new PeerManager(
          socket,
          stream,
          query.nickname,
          AnimalImageEnum.BROWN_BEAR,
          audioContainer,
          divContainer,
          {
            x: backgroundImageInfo.size.width / 2,
            y: backgroundImageInfo.size.height / 2,
          },
          query.roomId,
        );
        const peerManager = globalContext.peerManager;

        if (peerManager === undefined) {
          console.error('PeerManager undefined');
          return;
        }

        /////////////////////////////////////////////////
        // event setting start //////////////////////////
        window.addEventListener('resize', e => {
          //to - do
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
          camera.originSize = {
            width: canvas.clientWidth,
            height: canvas.clientHeight,
          };
          camera.size = {...camera.originSize};
          camera.scale = 1;
          gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        });

        window.addEventListener('keydown', e => {
          if (e.key === '+') {
            camera.upScale(0.1);
          } else if (e.key === '-') {
            camera.upScale(-0.1);
          }
        });
        //for Desktop
        divContainer.addEventListener('mousedown', e => {
          e.preventDefault();
          peerManager.me.isMoving = true;
          peerManager.me.touchStartPos = {
            x: e.clientX,
            y: e.clientY,
          };
          revealJoystickBase();
        });

        divContainer.addEventListener('mousemove', e => {
          e.preventDefault();
          peerManager.me.touchingPos = {
            x: e.clientX,
            y: e.clientY,
          };
          moveJoystick();
        });

        divContainer.addEventListener('mouseup', e => {
          e.preventDefault();
          peerManager.me.isMoving = false;
          hideJoystickBase();
        });

        //for Phone
        divContainer.addEventListener('touchstart', e => {
          e.preventDefault();
          peerManager.me.isMoving = true;
          peerManager.me.touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
          revealJoystickBase();
        });

        divContainer.addEventListener('touchmove', e => {
          e.preventDefault();
          peerManager.me.touchingPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
          moveJoystick();
        });

        divContainer.addEventListener('touchend', e => {
          e.preventDefault();
          peerManager.me.isMoving = false;
          hideJoystickBase();
        });

        const drawBackground = () => {
          glHelper.drawImage({
            ...backgroundImageInfo,
            scale: 1,
            rotateRadian: 0,
          });
        };

        //계속해서 화면에 장면을 그려줌
        const requestAnimation = () => {
          drawBackground();
          peerManager.me.update(
            Date.now() - peerManager.lastUpdateTimeStamp,
            imageInfoProvider,
            glHelper,
          );
          peerManager.peers.forEach(peer => {
            if (peer.dc.readyState === 'open')
              peer.dc.send(JSON.stringify(peerManager.me));
            glHelper.drawAnimal(imageInfoProvider, peer, peer.div);
            peer.updateSoundFromVec2(peerManager.me.centerPos);
          });
          peerManager.lastUpdateTimeStamp = Date.now();
          camera.updateCenterPosFromPlayer(peerManager.me);
          glHelper.drawAnimal(
            imageInfoProvider,
            peerManager.me,
            peerManager.me.div,
          );
          // console.log(peerManager.me.centerPos);
          requestAnimationFrame(requestAnimation);
        };
        peerManager.lastUpdateTimeStamp = Date.now();
        requestAnimationFrame(requestAnimation);
      })
      .catch(error => {
        console.error(`mediaStream error :${error.toString()}`);
      });
  }, []);

  const revealJoystickBase = () => {
    const peerManager = globalContext.peerManager;
    if (peerManager === undefined) {
      return;
    }
    const posX = peerManager.me.touchStartPos.x;
    const posY = peerManager.me.touchStartPos.y;
    const joystickBase = document.querySelector(
      '.joystickBase',
    ) as HTMLImageElement;
    const joystick = document.querySelector('.joystick') as HTMLImageElement;
    if (joystickBase === null) {
      return;
    }
    if (joystick === null) {
      return;
    }
    joystickBase.style.left = String(posX - joystickBase.width / 2) + 'px';
    joystickBase.style.top = String(posY - joystickBase.height / 2) + 'px';
    joystickBase.style.visibility = 'visible';
    joystick.style.left = String(posX - joystick.width / 2) + 'px';
    joystick.style.top = String(posY - joystick.height / 2) + 'px';
    joystick.style.visibility = 'visible';
  };
  const hideJoystickBase = () => {
    const joystickBase = document.querySelector(
      '.joystickBase',
    ) as HTMLImageElement;
    const joystick = document.querySelector('.joystick') as HTMLImageElement;
    if (joystickBase === null) {
      return;
    }
    if (joystick === null) {
      return;
    }
    joystickBase.style.visibility = 'hidden';
    joystick.style.visibility = 'hidden';
  };
  const moveJoystick = () => {
    const peerManager = globalContext.peerManager;

    const joystick = document.querySelector('.joystick') as HTMLImageElement;
    const joystickBase = document.querySelector(
      '.joystickBase',
    ) as HTMLImageElement;

    if (peerManager === undefined) {
      return;
    }
    const startPosX = peerManager.me.touchStartPos.x;
    const startPosY = peerManager.me.touchStartPos.y;
    const endPosX = peerManager.me.touchingPos.x;
    const endPosY = peerManager.me.touchingPos.y;
    if (joystick === null) {
      return;
    }
    if (joystickBase === null) {
      return;
    }
    const dist2 = Math.sqrt(
      Math.pow(endPosX - startPosX, 2) + Math.pow(endPosY - startPosY, 2),
    );
    const dist1 = joystickBase.width / 2 - joystick.width / 2;

    if (dist2 <= dist1) {
      const x = endPosX - joystick.width / 2;
      const y = endPosY - joystick.height / 2;
      joystick.style.left = String(x) + 'px';
      joystick.style.top = String(y) + 'px';
    } else {
      joystick.style.left =
        String(
          (dist1 * (endPosX - startPosX)) / dist2 +
            startPosX -
            joystick.width / 2,
        ) + 'px';
      joystick.style.top =
        String(
          (dist1 * (endPosY - startPosY)) / dist2 +
            startPosY -
            joystick.height / 2,
        ) + 'px';
    }
  };
  const onClickMicOnOff = (isOn: boolean) => {
    if (peerManagerRef.current !== undefined) {
      peerManagerRef.current.localStream.getAudioTracks()[0].enabled = isOn;
    }
  };

  return (
    <>
      <canvas
        width={window.innerWidth.toString() + 'px'}
        height={window.innerHeight.toString() + 'px'}
        ref={canvasRef}
      ></canvas>
      <div id="divContainer"></div>
      <div id="audioContainer" style={{width: '0', height: '0'}}></div>
      <Navigation
        initialInfo={[query.avatarIdx, query.nickname]}
        peerManager={peerManagerRef.current}
        myMicToggle={onClickMicOnOff}
        onProfileChange={onProfileChangeButtonClick}
      />
      <Joystick />
    </>
  );
};

export default SpaceMain;
