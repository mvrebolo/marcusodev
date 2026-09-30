// Gera o carrossel animado de um post: o slide 1 sai como imagem (capa, porque o Instagram usa
// o primeiro item como miniatura no perfil) e os demais como MP4 1080×1350 animados.
//
// Uso:   npm run videos -- 03-o-que-e-claude-code
// Saída: posts/03-o-que-e-claude-code/videos/01.jpg, 02.mp4, 03.mp4, ...
//
// Os slides animados ficam descritos em video/posts/<id>.ts.
// Para ver e ajustar ao vivo no navegador: npx remotion studio video/index.ts
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia, renderStill } from '@remotion/renderer';
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

const QUADRO_DA_CAPA = 100; // animação da capa já terminou e o cursor "_" está aceso

for (const [i, composicao] of composicoes.entries()) {
  const numero = composicao.id.slice(id.length + 1);
  if (i === 0) {
    const arquivo = join(saida, `${numero}.jpg`);
    await renderStill({
      serveUrl,
      composition: composicao,
      frame: Math.min(QUADRO_DA_CAPA, composicao.durationInFrames - 1),
      output: arquivo,
      imageFormat: 'jpeg',
      jpegQuality: 95,
      ...navegador,
    });
    console.log(`✓ ${arquivo} (capa)`);
    continue;
  }
  const arquivo = join(saida, `${numero}.mp4`);
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

console.log(`\nCapa + ${composicoes.length - 1} vídeos gerados em ${saida}`);
