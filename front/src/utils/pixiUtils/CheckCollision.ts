import {DisplayContainer} from './DisplayContainer';

export function checkCollision(
  objA: DisplayContainer,
  objB: DisplayContainer,
): boolean {
  if (!objA.collisionBox || !objB.collisionBox) return false;

  objA.collisionBox.getBounds();
  objB.collisionBox.getBounds();

  const a = objA.collisionBox._bounds;
  const b = objB.collisionBox._bounds;

  const rightmostLeft = a.minX < b.minX ? b.minX : a.minX;
  const leftmostRight = a.maxX > b.maxX ? b.maxX : a.maxX;

  if (leftmostRight <= rightmostLeft) {
    return false;
  }

  const bottommostTop = a.minY < b.minY ? b.minY : a.minY;
  const topmostBottom = a.maxY > b.maxY ? b.maxY : a.maxY;
  // console.log(Math.floor(bottommostTop), Math.floor(topmostBottom));
  return topmostBottom >= bottommostTop;
}
