import { Socket } from "socket.io-client";

export interface Vec2 {
  x: number;
  y: number;
}

export interface IPlayer {
  nickname: string;
  idx: number;
  centerPos: Vec2;
  rotateRadian: number;
  volume: number;
}

class Me implements IPlayer {
  // IPlayer
  nickname: string;
  idx: number;
  centerPos: Vec2;
  rotateRadian: number;
  volume: number;
  //
  div: HTMLDivElement;
  velocity: number;
  normalizedDirectionVector: Vec2;
  touchStartPos: Vec2;
  touchingPos: Vec2;
  isMoving: boolean;

  analyser: AnalyserNode;
  constructor(
    nickname: string,
    idx: number,
    centerPos: Vec2,
    velocity: number,
    stream: MediaStream,
    divContainer: HTMLDivElement
  ) {
    this.nickname = nickname;
    this.idx = idx;
    this.centerPos = centerPos;
    this.velocity = velocity;
    this.normalizedDirectionVector = { x: 0, y: 1 };
    this.rotateRadian = 0;
    this.volume = 0;
    this.touchStartPos = { x: 0, y: 0 };
    this.touchingPos = { x: 0, y: 0 };
    this.isMoving = false;

    this.div = document.createElement("div") as HTMLDivElement;
    this.div.className = "canvasOverlay";
    this.div.innerText = this.nickname;
    divContainer.appendChild(this.div);

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    this.analyser = audioContext.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.4;
    this.analyser.fftSize = 1024;
    source.connect(this.analyser);
  }

  update(millis: number) {
    if (this.isMoving) {
      const newDir: Vec2 = {
        x: this.touchingPos.x - this.touchStartPos.x,
        y: this.touchingPos.y - this.touchStartPos.y,
      };
      if (newDir.x === 0 && newDir.y === 0) return;

      const len = Math.sqrt(Math.pow(newDir.x, 2) + Math.pow(newDir.y, 2));
      newDir.x = newDir.x / len;
      newDir.y = newDir.y / len;
      this.normalizedDirectionVector = newDir;

      this.centerPos.x +=
        this.velocity * this.normalizedDirectionVector.x * millis;
      this.centerPos.y +=
        this.velocity * this.normalizedDirectionVector.y * millis;
      this.div.style.left = Math.floor(this.centerPos.x) + "px";
      this.div.style.top = Math.floor(this.centerPos.y + 100) + "px";
    }

    const array = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(array);
    this.volume =
      array.reduce((acc, cur) => {
        return acc + cur;
      }, 0) / array.length;

    this.rotateRadian = Math.atan2(
      this.normalizedDirectionVector.x,
      this.normalizedDirectionVector.y
    );
  }
}

interface OfferAnswerDto {
  fromClientId: string;
  toClientId: string;
  sdp: RTCSessionDescriptionInit;
}

interface IceDto {
  fromClientId: string;
  toClientId: string;
  ice: RTCIceCandidate;
}

export class Peer extends RTCPeerConnection implements IPlayer {
  connectedClientSocketId: string;
  socketId: string;
  dc: RTCDataChannel;
  connectedAudioElement: HTMLAudioElement;
  div: HTMLDivElement;
  maxSoundDistance: number;
  //IPlayer
  nickname: string;
  idx: number;
  centerPos: Vec2;
  rotateRadian: number;
  volume: number;
  //

  isDeleted: boolean;

  constructor(
    connectedClientSocketId: string,
    socketId: string,
    audioContainer: Element,
    divContainer: HTMLDivElement,
    pcConfig?: RTCConfiguration
  ) {
    super(pcConfig);
    this.connectedClientSocketId = connectedClientSocketId;
    this.socketId = socketId;
    this.isDeleted = false;
    this.maxSoundDistance = 500;
    // div setting
    this.div = document.createElement("div") as HTMLDivElement;
    this.div.className = "canvasOverlay";
    divContainer.append(this.div);

    //IPlayer
    this.centerPos = { x: 0, y: 0 };
    this.nickname = "Anonymous";
    this.idx = 0;
    this.rotateRadian = 0;
    this.volume = 0;
    //
    this.dc = this.createDataChannel("dc");
    this.ondatachannel = (event) => {
      const receviedDC = event.channel;
      receviedDC.onmessage = (event) => {
        const data = JSON.parse(event.data) as IPlayer;
        this.centerPos = data.centerPos;
        this.nickname = data.nickname;
        this.idx = data.idx;
        this.rotateRadian = data.rotateRadian;
        this.volume = data.volume;
        this.div.innerText = data.nickname;
      };
      receviedDC.onopen = (event) => {
        console.log("dataChannel created");
      };
      receviedDC.onclose = () => {
        console.log("dataChannel closed");
      };
    };

    // audio setting
    this.connectedAudioElement = document.createElement(
      "audio"
    ) as HTMLAudioElement;
    this.connectedAudioElement.autoplay = true;

    audioContainer.appendChild(this.connectedAudioElement);
    //
  }

  updateSoundFromVec2(pos: Vec2) {
    const distance = Math.sqrt(
      Math.pow(this.centerPos.x - pos.x, 2) +
        Math.pow(this.centerPos.y - pos.y, 2)
    );
    this.connectedAudioElement.volume = Math.max(
      0,
      1 - distance / this.maxSoundDistance
    );
  }
}

export default class PeerManager {
  static Config: RTCConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };
  peers: Map<string, Peer>;
  socket: Socket;
  localStream: MediaStream;
  pcConfig: RTCConfiguration | undefined;
  me: Me;
  lastUpdateTimeStamp: number;
  audioContainer: Element;
  divContainer: HTMLDivElement;
  constructor(
    socket: Socket,
    localStream: MediaStream,
    nickname: string,
    idx: number,
    audioContainer: Element,
    divContainer: HTMLDivElement,
    meCenterPos: Vec2,
    roomId?: string,
    pcConfig?: RTCConfiguration
  ) {
    this.divContainer = divContainer;
    this.me = new Me(
      nickname,
      idx,
      meCenterPos,
      0.2,
      localStream,
      divContainer
    );
    this.lastUpdateTimeStamp = Date.now();
    this.localStream = localStream;
    this.socket = socket;
    if (pcConfig) this.pcConfig = pcConfig;
    else this.pcConfig = PeerManager.Config;
    this.peers = new Map();
    this.audioContainer = audioContainer;

    socket.on("offer", (offerDto: OfferAnswerDto) => {
      if (!this.peers.has(offerDto.fromClientId)) {
        this.createPeerWithEventSetting(
          offerDto.fromClientId,
          offerDto.toClientId
        );
      }
      const offeredPeer = this.peers.get(offerDto.fromClientId)!;
      offeredPeer.setRemoteDescription(offerDto.sdp);
      offeredPeer
        .createAnswer()
        .then((sdp) => {
          offeredPeer.setLocalDescription(sdp);
          const answerDto: OfferAnswerDto = {
            fromClientId: offeredPeer.socketId,
            toClientId: offeredPeer.connectedClientSocketId,
            sdp: sdp,
          };
          this.socket.emit("answer", answerDto);
        })
        .catch((error) => {
          console.error(
            `Peer SocketId: ${
              offeredPeer.connectedClientSocketId
            } createAnswer fail=> ${error.toString()}`
          );
        });
    });

    socket.on("needToOffer", (toSocketIds: string[]) => {
      console.log("needToOfferCalled");
      toSocketIds.forEach((connectedSocketId) => {
        if (connectedSocketId !== this.socket.id) {
          const newPeer = this.createPeerWithEventSetting(
            connectedSocketId,
            this.socket.id
          );
          newPeer
            .createOffer()
            .then((sdp) => {
              newPeer.setLocalDescription(sdp);
              const offerDto: OfferAnswerDto = {
                toClientId: newPeer.connectedClientSocketId,
                fromClientId: newPeer.socketId,
                sdp: sdp,
              };
              this.socket.emit("offer", offerDto);
            })
            .catch((error) => {
              console.error(
                `Peer SocketId: ${
                  newPeer.connectedClientSocketId
                } createAnswer fail=> ${error.toString()}`
              );
            });
        }
      });
    });

    this.socket.on("answer", (answerDto: OfferAnswerDto) => {
      const answeredPeer = this.peers.get(answerDto.fromClientId);
      if (answeredPeer) {
        answeredPeer.setRemoteDescription(answerDto.sdp);
      }
    });

    this.socket.on("ice", (iceDto: IceDto) => {
      const icedPeer = this.peers.get(iceDto.fromClientId);
      if (icedPeer) {
        icedPeer
          .addIceCandidate(new RTCIceCandidate(iceDto.ice))
          .catch((error) => {
            console.error(`addIceCandidate Fail : ${error.toString()}`);
          });
      }
    });
    socket.emit("joinRoom", roomId || "honleeExample");
  }
  createPeerWithEventSetting(
    connectedClientSocketId: string,
    socketId: string
  ): Peer {
    const newPeer = new Peer(
      connectedClientSocketId,
      socketId,
      this.audioContainer,
      this.divContainer,
      this.pcConfig
    );

    this.localStream.getTracks().forEach((track) => {
      newPeer.addTrack(track, this.localStream);
    });

    this.peers.set(connectedClientSocketId, newPeer);

    newPeer.addEventListener("icecandidate", (event) => {
      const iceCandidate = event.candidate;
      if (iceCandidate) {
        const iceDto: IceDto = {
          toClientId: newPeer.connectedClientSocketId,
          fromClientId: newPeer.socketId,
          ice: iceCandidate,
        };
        this.socket.emit("ice", iceDto);
      }
    });
    newPeer.addEventListener("track", (event) => {
      newPeer.connectedAudioElement.srcObject = event.streams[0];
    });
    newPeer.addEventListener("connectionstatechange", (event) => {
      const targetPeer = event.target as Peer;
      if (
        targetPeer.connectionState === "closed" ||
        targetPeer.connectionState === "disconnected" ||
        targetPeer.connectionState === "failed"
      ) {
        this.peers.delete(targetPeer.connectedClientSocketId);
        if (!targetPeer.isDeleted) {
          this.divContainer.removeChild(targetPeer.div);
          this.audioContainer.removeChild(targetPeer.connectedAudioElement);
          targetPeer.isDeleted = true;
        }
      }
    });
    return newPeer;
  }
}