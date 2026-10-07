import Phaser from 'phaser';

export interface MoveBindings {
  left: string[];
  right: string[];
  up: string[];
  down: string[];
}

export const defaultMoveBindings: MoveBindings = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  up: ['UP', 'W'],
  down: ['DOWN', 'S'],
};

/** HTML 버튼·슬라이더 등에 포커스가 있으면 게임 키보드 입력을 무시한다. */
export function isTypingInControl(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLElement &&
    ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(active.tagName)
  );
}

/**
 * 키보드, 게임패드, 포인터(누르고 있는 지점 방향)를 하나의 이동 입력으로 합친다.
 * 장면의 create()에서 만들고 update()에서 `move()`를 호출한다. 키는 장면 종료 시 함께 정리된다.
 */
export class MoveInput {
  private keys: Record<keyof MoveBindings, Phaser.Input.Keyboard.Key[]>;
  private direction = new Phaser.Math.Vector2();

  constructor(
    private scene: Phaser.Scene,
    bindings: MoveBindings = defaultMoveBindings,
    private deadZone = 0.2,
  ) {
    const keyboard = scene.input.keyboard;
    const add = (names: string[]) =>
      keyboard ? names.map((name) => keyboard.addKey(name)) : [];
    this.keys = {
      left: add(bindings.left),
      right: add(bindings.right),
      up: add(bindings.up),
      down: add(bindings.down),
    };
  }

  /**
   * 길이 0 또는 1의 방향 벡터를 돌려준다. 반환 벡터는 재사용되므로 보관하지 않는다.
   * `origin`을 넘기면 캔버스를 누르고 있는 동안 그 지점을 향하는 방향을 우선한다.
   */
  move(origin?: { x: number; y: number }): Phaser.Math.Vector2 {
    const d = this.direction.set(0, 0);
    const down = (list: Phaser.Input.Keyboard.Key[]) =>
      list.some((key) => key.isDown);
    if (!isTypingInControl()) {
      if (down(this.keys.left)) d.x--;
      if (down(this.keys.right)) d.x++;
      if (down(this.keys.up)) d.y--;
      if (down(this.keys.down)) d.y++;
    }
    const pad = this.scene.input.gamepad?.pad1;
    if (pad) {
      if (pad.left) d.x--;
      if (pad.right) d.x++;
      if (pad.up) d.y--;
      if (pad.down) d.y++;
      if (pad.leftStick.length() > this.deadZone) d.add(pad.leftStick);
    }
    const pointer = this.scene.input.activePointer;
    if (
      origin &&
      pointer.isDown &&
      pointer.downElement === this.scene.game.canvas
    ) {
      d.set(pointer.worldX - origin.x, pointer.worldY - origin.y);
      if (d.length() < 8) d.set(0, 0);
    }
    return d.normalize();
  }
}
