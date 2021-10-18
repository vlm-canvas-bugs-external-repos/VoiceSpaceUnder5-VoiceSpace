import {AvatarPartImageEnum} from '../ImageMetaData';
import PeerManager, {Vec2, Peer} from '../RTCGameUtils';
import {Avatar} from './Avatar';
import {MyAvatar} from './MyAvatar';
import {World} from './World';

export class GameData {
  private static peerManager: PeerManager;

  public static setPeerManager(peerManager: PeerManager): void {
    this.peerManager = peerManager;
  }

  //test용 - 삭제 예정
  public static testPrint(): void {
    // console.log(this.peerManager);
    console.log(this.peerManager.peers);
  }

  public static getMyAvatar(): number {
    return this.peerManager.me.avatar;
  }
  public static getMyAvatarFace(): AvatarPartImageEnum {
    return this.peerManager.me.audioAnalyser.getAvatarFaceDtoByAudioAnalysis()
      .avatarFace;
  }

  public static getMyAvatarFaceScale(): number {
    return this.peerManager.me.audioAnalyser.getAvatarFaceDtoByAudioAnalysis()
      .avatarFaceScale;
  }

  public static updatePlayerDto(player: MyAvatar): void {
    const me = this.peerManager.me;

    me.centerPos.x = player.x;
    me.centerPos.y = player.y;
    me.partRotatedegree = player.partRotateDegree;
    me.lookLeft = player.scale.x < 0;
    me.avatarFace = player.avatarFace;
    me.avatarFaceScale = player.avatarFaceScale;
  }

  public static sendMyDto(): void {
    const me = this.peerManager.me;
    const peers = this.peerManager.peers;

    const data = JSON.stringify({type: 0, data: me.getPlayerDto()});
    peers.forEach(peer => {
      peer.transmitUsingDataChannel(data);
    });
  }

  public static getPeerNickName(socketID: string): string | undefined {
    if (this.peerManager.peers.get(socketID) === undefined) {
      console.error("Error: There's No matching Peer ID");
      return undefined;
    }
    return this.peerManager.peers.get(socketID)?.nickname;
  }

  public static getPeerCenterPos(socketID: string): Vec2 | undefined {
    if (this.peerManager.peers.get(socketID) === undefined) {
      console.error("Error: There's No matching Peer ID");
      return undefined;
    }
    return this.peerManager.peers.get(socketID)?.centerPos;
  }

  public static getPeerPartRotateDegree(
    socketID: string,
  ): number[] | undefined {
    if (this.peerManager.peers.get(socketID) === undefined) {
      console.error("Error: There's No matching Peer ID");
      return undefined;
    }
    return this.peerManager.peers.get(socketID)?.partRotatedegree;
  }

  public static getPeerAvatar(socketID: string): number | undefined {
    if (this.peerManager.peers.get(socketID) === undefined) {
      console.error("Error: There's No matching Peer ID");
      return undefined;
    }
    return this.peerManager.peers.get(socketID)?.avatar;
  }

  public static getPeerAvatarFace(
    socketID: string,
  ): AvatarPartImageEnum | undefined {
    if (!this.peerManager.peers.has(socketID)) {
      console.error("Error: There's No matching Peer ID");
      return undefined;
    }
    return this.peerManager.peers.get(socketID)?.avatarFace;
  }

  public static getPeerAvatarFaceScale(socketID: string): number | undefined {
    if (!this.peerManager.peers.has(socketID)) {
      console.error("Error: There's No matching Peer ID");
      return undefined;
    }
    return this.peerManager.peers.get(socketID)?.avatarFaceScale;
  }

  public static getPeerAvatarLookLeft(socketID: string): boolean | undefined {
    if (!this.peerManager.peers.has(socketID)) {
      console.error("Error: There's No matching Peer ID");
      return undefined;
    }
    return this.peerManager.peers.get(socketID)?.lookLeft;
  }

  public static getPeerAvatarNicknameDiv(
    socketID: string,
  ): HTMLDivElement | undefined {
    if (!this.peerManager.peers.has(socketID)) {
      console.error("Error: There's No matching Peer ID");
      return undefined;
    }
    return this.peerManager.peers.get(socketID)?.nicknameDiv;
  }

  public static getPeerAvatarTextMessageDiv(
    socketID: string,
  ): HTMLDivElement | undefined {
    if (!this.peerManager.peers.has(socketID)) {
      console.error("Error: There's No matching Peer ID");
      return undefined;
    }
    return this.peerManager.peers.get(socketID)?.textMessageDiv;
  }

  public static isConnectionAlive(socketID: string): boolean {
    if (this.peerManager.peers.get(socketID) === undefined) return false;
    else return true;
  }

  public static addOnPeerCreatedHandler(
    handler: (createdPeerSocketID: string) => void,
  ): void {
    this.peerManager.onPeerCreated = handler;
  }

  public static addOnPeerDeletedHandler(
    handler: (deletedPeerSocketID: string) => void,
  ): void {
    this.peerManager.onPeerDeleted = handler;
  }

  public static addExistingPeers(world: World): void {
    this.peerManager.peers.forEach(peer => {
      world.addPeerAvatar(peer.connectedClientSocketID);
    });
  }

  public static setMyNicknameDivPos(player: MyAvatar, offsetY: number): void {
    const nicknameDiv = this.peerManager.me.nicknameDiv;
    const offsetX = nicknameDiv.clientWidth / 2;
    nicknameDiv.style.left = `${
      player.x * player.viewport.scale.x + player.viewport.x - offsetX
    }px`;
    nicknameDiv.style.top = `${
      (player.y - offsetY) * player.viewport.scale.y + player.viewport.y
    }px`;
  }

  public static setMyTextMessageDivPos(
    player: MyAvatar,
    offsetY: number,
  ): void {
    const textMessageDiv = this.peerManager.me.textMessageDiv;
    textMessageDiv.className = 'canvasOverlay-textMessage-bottom';
    const offsetX = textMessageDiv.clientWidth / 2;
    textMessageDiv.style.left = `${
      player.x * player.viewport.scale.x + player.viewport.x - offsetX
    }px`;
    textMessageDiv.style.top = `${
      (player.y - textMessageDiv.clientHeight - offsetY) *
        player.viewport.scale.y +
      player.viewport.y
    }px`;
  }

  public static isTextMessageExist(): boolean {
    return this.peerManager.me.textMessage !== '';
  }

  public static setDivPos(player: MyAvatar): void {
    if (this.isTextMessageExist()) {
      this.peerManager.me.nicknameDiv.style.visibility = 'hidden';
      this.peerManager.me.textMessageDiv.style.visibility = 'visible';
      this.setMyTextMessageDivPos(player, 130);
    } else {
      this.peerManager.me.nicknameDiv.style.visibility = 'visible';
      this.peerManager.me.textMessageDiv.style.visibility = 'hidden';
      this.setMyNicknameDivPos(player, 130);
    }
  }

  public static setPeersDivPos(player: MyAvatar): void {
    const peers = this.peerManager.peers;
    peers.forEach(peer => {
      if (peer.textMessage !== '') {
        this.divVisibleOnOff(peer.textMessageDiv, peer.nicknameDiv);
        this.setPeerTextMessageDivPos(player, peer, 130);
      } else {
        this.divVisibleOnOff(peer.nicknameDiv, peer.textMessageDiv);
        this.setPeerNicknameDivPos(player, peer, 130);
      }
    });
  }

  public static setPeerTextMessageDivPos(
    player: MyAvatar,
    peer: Peer,
    offsetY: number,
  ) {
    peer.textMessageDiv.className = 'canvasOverlay-textMessage-bottom';
    peer.textMessageDiv.style.left = `${
      (peer.centerPos.x - peer.textMessageDiv.clientWidth / 2) *
        player.viewport.scale.x +
      player.viewport.x
    }px`;
    peer.textMessageDiv.style.top = `${
      (peer.centerPos.y - peer.textMessageDiv.clientHeight - offsetY) *
        player.viewport.scale.y +
      player.viewport.y
    }px`;
  }
  public static setPeerNicknameDivPos(
    player: MyAvatar,
    peer: Peer,
    offsetY: number,
  ): void {
    const nicknameDiv = peer.nicknameDiv;
    nicknameDiv.style.left = `${
      (peer.centerPos.x - nicknameDiv.clientWidth / 2) *
        player.viewport.scale.x +
      player.viewport.x
    }px`;
    nicknameDiv.style.top = `${
      (peer.centerPos.y - offsetY) * player.viewport.scale.y + player.viewport.y
    }px`;
  }

  public static divVisibleOnOff(toOn: HTMLDivElement, toOff: HTMLDivElement) {
    toOn.style.visibility = 'visible';
    toOff.style.visibility = 'hidden';
  }
}
