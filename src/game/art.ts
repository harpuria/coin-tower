import manifest from './art-manifest.json';

const sources = new Set(manifest.files.map((file) => file.source));
export const standaloneArt = new Set(
  manifest.files
    .filter((file) => 'standaloneOnly' in file && file.standaloneOnly)
    .map((file) => file.source),
);

/** 원본 이름을 배포용 파일명으로 연결해 HTML·Phaser 경로를 맞춘다. */
export function artFile(source: string): string {
  if (!sources.has(source)) throw new Error(`Unregistered game art: ${source}`);
  return source.replace(/\.png$/, '.webp');
}

export function artUrl(source: string): string {
  return `${import.meta.env.BASE_URL}assets/coin-tower/${artFile(source)}`;
}
