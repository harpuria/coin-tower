import Phaser from 'phaser';

/** One transition per source scene; listeners are removed by Scene shutdown. */
export function transition(
  scene: Phaser.Scene,
  target: string,
  duration: number,
): boolean {
  if (scene.registry.get('transitioning')) return false;
  scene.registry.set('transitioning', true);
  const finish = () => {
    scene.registry.set('transitioning', false);
    scene.scene.start(target);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
    scene.registry.set('transitioning', false),
  );
  if (duration === 0) finish();
  else {
    // Fade to the game background so the transition matches any configured theme.
    const { red, green, blue } = scene.game.config.backgroundColor;
    scene.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      finish,
    );
    scene.cameras.main.fadeOut(duration, red, green, blue);
  }
  return true;
}
