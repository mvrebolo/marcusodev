// Gera um MP4 1080×1350 animado para cada slide de um post (carrossel de vídeos).
//
// Uso:   npm run videos -- 03-o-que-e-claude-code
// Saída: posts/03-o-que-e-claude-code/videos/01.mp4, 02.mp4, ...
//
// Os slides animados ficam descritos em video/posts/<id>.ts.
// Para ver e ajustar ao vivo no navegador: npx remotion studio video/index.ts
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const id = process.argv[2];
if (!id) {
  console.error('Uso: npm run videos -- <id-do-post>   (ex.: 03-o-que-e-claude-code)');
  process.exit(1);
}

const navegador = process.env.CHROME_PATH ? { browserExecutable: process.env.CHROME_PATH } : {};
const saida = resolve('posts', id, 'videos');

console.log('Preparando o projeto de vídeo...');
const serveUrl = await bundle({ entryPoint: resolve('video/index.ts') });
const composicoes = (await getCompositions(serveUrl, navegador)).filter((c) => c.id.startsWith(`${id}-`));
if (composicoes.length === 0) throw new Error(`Nenhum slide para "${id}". Registre o post em video/posts/index.ts.`);

await rm(saida, { recursive: true, force: true });
await mkdir(saida, { recursive: true });

for (const composicao of composicoes) {
  const arquivo = join(saida, `${composicao.id.slice(id.length + 1)}.mp4`);
  await renderMedia({
    serveUrl,
    composition: composicao,
    codec: 'h264',
    outputLocation: arquivo,
    enforceAudioTrack: true, // faixa de áudio silenciosa: o Instagram lida melhor com vídeos que têm áudio
    ...navegador,
  });
  console.log(`✓ ${arquivo} (${(composicao.durationInFrames / composicao.fps).toFixed(1)} s)`);
}

console.log(`\n${composicoes.length} vídeos gerados em ${saida}`);
