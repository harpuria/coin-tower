import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import manifest from '../src/game/art-manifest.json' with { type: 'json' };

interface GeneratedArt {
  source: string;
  output: string;
  sourceSha256: string;
  outputSha256: string;
  maxEdge: number | null;
}

/** 보존 원본을 업로드하지 않고 해시가 맞는 배포 자산만 복사한다. */
export function packageArt(): Plugin {
  let root = '';
  let output = '';
  let crazygames = false;
  return {
    name: 'coin-tower-runtime-art',
    configResolved(config) {
      root = config.root;
      output = resolve(root, config.build.outDir);
      crazygames = config.mode === 'crazygames';
    },
    writeBundle() {
      const sourceRoot = join(root, 'public/assets/coin-tower');
      const report = JSON.parse(
        readFileSync(join(root, 'src/game/art-generated.json'), 'utf8'),
      ) as { files: GeneratedArt[]; encoding: typeof manifest.encoding };
      if (JSON.stringify(report.encoding) !== JSON.stringify(manifest.encoding))
        throw new Error('Art encoding changed. Run npm run assets:optimize.');
      for (const spec of manifest.files) {
        const generated = report.files.find(
          (item) => item.source === spec.source,
        );
        const expected = spec.source.replace(/\.png$/, '.webp');
        const hash = (file: string) =>
          existsSync(join(sourceRoot, file))
            ? createHash('sha256')
                .update(readFileSync(join(sourceRoot, file)))
                .digest('hex')
            : null;
        if (
          !generated ||
          generated.output !== expected ||
          generated.maxEdge !== ('maxEdge' in spec ? spec.maxEdge : null) ||
          generated.sourceSha256 !== hash(spec.source) ||
          generated.outputSha256 !== hash(expected)
        )
          throw new Error(
            `Stale optimized art: ${spec.source}. Run npm run assets:optimize.`,
          );
        if (crazygames && 'standaloneOnly' in spec && spec.standaloneOnly)
          continue;
        const destination = join(output, 'assets/coin-tower', expected);
        mkdirSync(dirname(destination), { recursive: true });
        copyFileSync(join(sourceRoot, expected), destination);
      }
      for (const file of ['stack.wav', 'game-over.wav', 'arcade-sparkle.m4a'])
        copyFileSync(
          join(sourceRoot, file),
          join(output, 'assets/coin-tower', file),
        );
      copyFileSync(
        join(root, 'public/favicon.svg'),
        join(output, 'favicon.svg'),
      );
      const bytes = (folder: string): number =>
        readdirSync(folder).reduce((total, file) => {
          const path = join(folder, file);
          return (
            total +
            (statSync(path).isDirectory() ? bytes(path) : statSync(path).size)
          );
        }, 0);
      const total = bytes(output);
      console.log(
        `Upload bundle: ${total.toLocaleString()} bytes (${(total / 1_000_000).toFixed(2)} MB)`,
      );
      if (crazygames && total >= 20_000_000)
        throw new Error(
          'CrazyGames upload bundle must be below 20,000,000 bytes.',
        );
    },
  };
}
