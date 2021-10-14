import {Avatar, AvatarParts, avatarName} from './Avatar';
import {DisplayContainer} from './DisplayContainer';
import {GameData} from './GameData';
import {World} from './World';

export class PeerAvatar extends DisplayContainer implements Avatar {
  public avatar: number;
  public partRotateDegree: number;
  public socketID: string;

  constructor(world: World, socketID: string) {
    super(world);

    const avatar = GameData.getPeerAvatar(socketID);
    if (avatar === undefined) {
      console.error("Error: This Peer's Avatar undefined");
    }
    this.avatar = avatar || 0;
    this.partRotateDegree = 0;
    this.socketID = socketID;

    const centerPos = GameData.getPeerCenterPos(socketID);
    if (centerPos === undefined) {
      console.error("Error: This Peer's CenterPos undefined");
    }
    this.position.set(centerPos?.x, centerPos?.y);

    //this.addChild(part)
    const partsTextureNames = [
      avatarName[this.avatar] + 'Arm',
      avatarName[this.avatar] + 'Arm',
      avatarName[this.avatar] + 'Body',
      avatarName[this.avatar] + 'Arm',
      avatarName[this.avatar] + 'Arm',
      avatarName[this.avatar] + 'Head',
    ];
    this.addParts(partsTextureNames);
    this.parts.forEach(value => {
      this.addChild(value);
    });

    this.setPartsPosition();
  }

  //setter
  private setPartsPosition() {
    this.parts[AvatarParts.HEAD].anchor.set(0.45, 0.95);
    this.parts[AvatarParts.BODY].anchor.set(0.5, 0);

    this.parts[AvatarParts.LEFT_ARM].anchor.set(0.5, 0.2);
    this.parts[AvatarParts.LEFT_ARM].position.set(8, 5);

    this.parts[AvatarParts.LEFT_LEG].anchor.set(0.5, 0.2);
    this.parts[AvatarParts.LEFT_LEG].position.set(9, 42);

    this.parts[AvatarParts.RIGHT_ARM].anchor.set(0.5, 0.2);
    this.parts[AvatarParts.RIGHT_ARM].position.set(-8, 5);

    this.parts[AvatarParts.RIGHT_LEG].anchor.set(0.5, 0.2);
    this.parts[AvatarParts.RIGHT_LEG].position.set(-8, 42);
  }

  update(framesPassed: number): void {
    //Peer의 centerPos, rotateDegree를 변경해준다
    this.changePosition();
    this.changePartRotationDegree();
    //Peer의 Avatar번호가 바뀌었으면 바꾸어준다. 아바타를
    // Peer의 scale을 받아서 얼굴에 적용한다.
    // Peer의 AvatarFace를 받아서 얼굴에 적용한다.
  }

  private changePosition(): void {
    const centerPos = GameData.getPeerCenterPos(this.socketID);
    this.position.set(centerPos?.x, centerPos?.y);
  }

  private changePartRotationDegree(): void {
    const partRotateDegree = GameData.getPeerPartRotateDegree(this.socketID);
    this.partRotateDegree = partRotateDegree || 0;
  }
}
