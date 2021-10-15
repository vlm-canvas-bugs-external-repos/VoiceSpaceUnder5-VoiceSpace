import {Sprite} from '@pixi/sprite';
import {AvatarPartImageEnum} from '../ImageMetaData';
import {Avatar, AvatarParts, newAvatar, swapFace} from './Avatar';
import {DisplayContainer} from './DisplayContainer';
import {GameData} from './GameData';
import {World} from './World';

export class PeerAvatar extends DisplayContainer implements Avatar {
  public avatar: number;
  public avatarFace: AvatarPartImageEnum;
  public avatarFaceScale: number;
  public partRotateDegree: number[];
  public socketID: string;

  constructor(world: World, socketID: string) {
    super(world);

    const avatar = GameData.getPeerAvatar(socketID);
    if (avatar === undefined) {
      console.error("Error: This Peer's Avatar undefined");
    }
    this.avatar = avatar || 0;
    this.avatarFace = AvatarPartImageEnum.FACE_MUTE;
    this.avatarFaceScale = 1.0;
    this.partRotateDegree = Array.from({length: 6}, () => 0);
    this.socketID = socketID;

    const centerPos = GameData.getPeerCenterPos(socketID);
    if (centerPos === undefined) {
      console.error("Error: This Peer's CenterPos undefined");
    }
    this.position.set(centerPos?.x, centerPos?.y);

    //this.addChild(part)
    newAvatar(this, this.avatar);
  }

  update(framesPassed: number): void {
    //Peer의 centerPos, rotateDegree를 변경해준다
    this.changePosition();
    this.changeZIndex();
    this.changePartRotationDegree();
    this.changeLookDirection();
    this.changeAvatarFace();
    this.changeAvatarFaceScale();
    //Peer의 Avatar번호가 바뀌었으면 바꾸어준다. 아바타를
    // Peer의 scale을 받아서 얼굴에 적용한다.
    // Peer의 AvatarFace를 받아서 얼굴에 적용한다.
  }

  private changePosition(): void {
    const centerPos = GameData.getPeerCenterPos(this.socketID);
    this.position.set(centerPos?.x, centerPos?.y);
  }

  private changeZIndex(): void {
    this.zIndex = this.y + this.height / 2;
  }

  private changePartRotationDegree(): void {
    const partRotateDegree = GameData.getPeerPartRotateDegree(this.socketID);
    if (partRotateDegree !== undefined)
      this.partRotateDegree = partRotateDegree;
    if (partRotateDegree)
      for (let i = 0; i < 6; ++i) {
        this.parts[i].angle = partRotateDegree[i];
      }
  }

  private changeLookDirection(): void {
    const lookLeft = GameData.getPeerAvatarLookLeft(this.socketID);
    if (lookLeft === undefined) return;
    this.scale.x = lookLeft ? -1 : 1;
  }

  private changeAvatarFace(): void {
    const avatarFace = GameData.getPeerAvatarFace(this.socketID);
    if (avatarFace === undefined) return;
    this.avatarFace = avatarFace;
    swapFace(
      this.avatar,
      this.children[AvatarParts.FACE] as Sprite,
      this.avatarFace,
    );
  }

  private changeAvatarFaceScale(): void {
    const avatarFaceScale = GameData.getPeerAvatarFaceScale(this.socketID);
    if (avatarFaceScale === undefined) return;
    this.avatarFaceScale = avatarFaceScale;
    this.parts[AvatarParts.FACE].scale.set(this.avatarFaceScale);
  }
}
