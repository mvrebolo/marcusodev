// Gera um episódio do quadro "Aprende o Óbvio" (9:16).
//
// Uso:   npm run obvio -- 1 "como instalar uma skill"
// Saída: quadros/aprende-o-obvio/ep-01.mp4
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const episodio = Number(process.argv[2] ?? 1);
const titulo = process.argv[3] ?? 'como instalar uma skill';
const navegador = process.env.CHROME_PATH ? { browserExecutable: process.env.CHROME_PATH } : {};
const inputProps = { episodio, titulo };

const saida = resolve('quadros', 'aprende-o-obvio');
await mkdir(saida, { recursive: true });

const serveUrl = await bundle({ entryPoint: resolve('video/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'aprende-o-obvio', inputProps, ...navegador });
const arquivo = join(saida, `ep-${String(episodio).padStart(2, '0')}.mp4`);
await renderMedia({ serveUrl, composition, inputProps, codec: 'h264', outputLocation: arquivo, enforceAudioTrack: true, ...navegador });
console.log(`✓ ${arquivo} (${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);
