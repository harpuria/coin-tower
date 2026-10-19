import type Phaser from 'phaser';
import { artFile } from './art';
import { deferredImages, installAssetFrames } from './assets';
import { skinById, skins, type SkinId } from './skins';

/** 장면 로더의 수명을 따르는 선택 자산. 실패해도 첫 플레이와 저장은 유지한다. */
export class DeferredAssets {
  private load?: Phaser.Loader.LoaderPlugin;
  private textures?: Phaser.Textures.TextureManager;
  private requested = new Set<string>();
  private pending = new Set<string>();
  private failed = new Set<string>();

  constructor(private changed: () => void) {}

  attach(
    load: Phaser.Loader.LoaderPlugin,
    textures: Phaser.Textures.TextureManager,
  ) {
    this.detach();
    this.load = load;
    this.textures = textures;
    load.setPath(`${import.meta.env.BASE_URL}assets/coin-tower/`);
    load.maxParallelDownloads = 2;
    load.on('filecomplete', this.complete);
    load.on('loaderror', this.failure);
    this.queue();
    this.changed();
  }

  detach = () => {
    this.load?.off('filecomplete', this.complete);
    this.load?.off('loaderror', this.failure);
    this.load = undefined;
    this.textures = undefined;
    this.pending.clear();
  };

  isSkinReady(id: SkinId) {
    return this.textures?.exists(skinById(id).texture) ?? false;
  }

  skinFailed(id: SkinId) {
    return this.failed.has(skinById(id).texture);
  }

  get hasSkinFailures() {
    return skins.some((skin) => this.skinFailed(skin.id));
  }

  requestSkins() {
    this.request(
      skins.filter((skin) => skin.id !== 'gold').map((skin) => skin.texture),
    );
  }

  prefetch() {
    this.failed.clear();
    this.request(Object.keys(deferredImages));
  }

  retry() {
    this.failed.clear();
    this.queue();
    this.changed();
  }

  private request(keys: string[]) {
    for (const key of keys) this.requested.add(key);
    this.queue();
  }

  private queue() {
    if (!this.load || !this.textures) return;
    let added = false;
    for (const key of this.requested) {
      if (
        this.textures.exists(key) ||
        this.pending.has(key) ||
        this.failed.has(key)
      )
        continue;
      this.pending.add(key);
      this.load.image(key, artFile(deferredImages[key]!));
      added = true;
    }
    if (added && !this.load.isLoading()) this.load.start();
  }

  private complete = (key: string) => {
    if (!this.pending.delete(key) || !this.textures) return;
    installAssetFrames(this.textures);
    this.changed();
  };

  private failure = (file: Phaser.Loader.File) => {
    if (!this.pending.delete(file.key)) return;
    this.failed.add(file.key);
    this.changed();
  };
}
