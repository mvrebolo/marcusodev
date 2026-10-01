// Gera a intro e o fechamento da marca em 9:16 (Instagram) e 16:9 (YouTube).
//
// Uso:   npm run vinhetas
// Saída: marca/vinhetas/intro-9x16.mp4, intro-16x9.mp4, fechamento-9x16.mp4, fechamento-16x9.mp4
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const navegador = process.env.CHROME_PATH ? { browserExecutable: process.env.CHROME_PATH } : {};
const saida = resolve('marca', 'vinhetas');
await mkdir(saida, { recursive: true });

const serveUrl = await bundle({ entryPoint: resolve('video/index.ts') });
const vinhetas = (await getCompositions(serveUrl, navegador)).filter((c) => /^(intro|fechamento)-/.test(c.id));

for (const composicao of vinhetas) {
  const arquivo = join(saida, `${composicao.id}.mp4`);
  await renderMedia({ serveUrl, composition: composicao, codec: 'h264', outputLocation: arquivo, enforceAudioTrack: true, ...navegador });
  console.log(`✓ ${arquivo}`);
}
