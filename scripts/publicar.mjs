// Publica um post no Instagram @marcusodev pela API oficial (graph.instagram.com).
//
// Uso:
//   npm run publicar -- posts/03-o-que-e-claude-code              → modo de teste (não publica nada)
//   npm run publicar -- posts/03-o-que-e-claude-code --publicar   → publica de verdade
//
// Lê a mídia e a legenda + hashtags do <post>/roteiro.md. A mídia vem de <post>/videos/
// (carrossel animado gerado com npm run videos: capa em .jpg + slides em .mp4) ou, se essa
// pasta não existir, de <post>/slides/*.jpg.
// O repositório é público: a Meta baixa as imagens direto do GitHub (raw.githubusercontent.com),
// fixadas no commit atual. Por isso os slides precisam estar commitados e enviados (git push) antes.
//
// Token (nunca neste repositório, que é público):
//   1. variável de ambiente INSTAGRAM_ACCESS_TOKEN, se existir;
//   2. senão, o arquivo instagram/marcusodev.env do repositório privado mvrebolo/sc,
//      clonado ao lado deste (../sc) ou no caminho de INSTAGRAM_TOKEN_FILE.
// Opcional: INSTAGRAM_API_VERSION (padrão "v23.0").
import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

process.on('uncaughtException', (erro) => {
  console.error(`\n✗ ${erro.message}`);
  process.exit(1);
});

const MAX_ITENS_CARROSSEL = 10;

const args = process.argv.slice(2);
const publicar = args.includes('--publicar');
const pasta = args.find((a) => !a.startsWith('--'));
if (!pasta) {
  console.error('Uso: npm run publicar -- posts/<pasta-do-post> [--publicar]');
  process.exit(1);
}

const dirPost = resolve(pasta);
const nomePost = basename(dirPost);

// ---------- conteúdo do post ----------

function blocoDeCodigo(markdown, titulo) {
  const secao = markdown.split(/^## /m).find((s) => s.startsWith(titulo));
  const bloco = secao?.match(/```\n?([\s\S]*?)```/);
  return bloco ? bloco[1].trim() : '';
}

const roteiro = await readFile(join(dirPost, 'roteiro.md'), 'utf8');
const legenda = [blocoDeCodigo(roteiro, 'Legenda'), blocoDeCodigo(roteiro, 'Hashtags')]
  .filter(Boolean)
  .join('\n\n');
if (!legenda) throw new Error('Não encontrei a legenda: o roteiro.md precisa de "## Legenda" com um bloco ```.');
if (legenda.length > 2200) throw new Error(`Legenda com ${legenda.length} caracteres (máximo do Instagram: 2200).`);

const listar = (dir, padrao) => readdir(dir).then((fs) => fs.filter((f) => padrao.test(f)).sort(), () => []);
const animado = await listar(join(dirPost, 'videos'), /\.(mp4|jpe?g)$/i);
const dirMidia = join(dirPost, animado.length > 0 ? 'videos' : 'slides');
const arquivos = animado.length > 0 ? animado : await listar(dirMidia, /\.jpe?g$/i);
const eVideo = (arquivo) => /\.mp4$/i.test(arquivo);
const ehVideo = arquivos.some(eVideo);
if (arquivos.length === 0) throw new Error(`Nenhuma mídia em ${dirPost}/videos ou /slides. Rode antes: npm run slides ou npm run videos.`);
if (arquivos.length > MAX_ITENS_CARROSSEL) throw new Error(`${arquivos.length} arquivos; o carrossel aceita até ${MAX_ITENS_CARROSSEL}.`);

console.log(`Post: ${nomePost}`);
console.log(`Mídia (${arquivos.length}): ${arquivos.join(', ')}`);
console.log(`Legenda (${legenda.length} caracteres):\n${'-'.repeat(40)}\n${legenda}\n${'-'.repeat(40)}`);

// ---------- links públicos no GitHub ----------

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const commit = git('rev-parse', 'HEAD');
const repo = git('remote', 'get-url', 'origin').match(/github\.com[:/](.+?)(\.git)?$/)?.[1];
if (!repo) throw new Error('O remote "origin" não aponta para o GitHub.');

const alterados = git('status', '--porcelain', '--', dirMidia);
if (alterados) throw new Error(`Há arquivos não commitados em ${dirMidia}. Faça commit e push antes de publicar.`);
if (!git('branch', '-r', '--contains', commit)) throw new Error(`O commit ${commit.slice(0, 7)} ainda não foi enviado. Rode git push antes de publicar.`);

const raiz = git('rev-parse', '--show-toplevel');
const links = arquivos.map((f) => `https://raw.githubusercontent.com/${repo}/${commit}/${relative(raiz, join(dirMidia, f))}`);
// o GitHub entrega .mp4 como application/octet-stream
const tiposAceitos = (arquivo) => (eVideo(arquivo) ? ['video/mp4', 'application/octet-stream'] : ['image/jpeg']);

console.log('\nConferindo os links...');
for (const [i, link] of links.entries()) {
  const resposta = await fetch(link, { method: 'HEAD' });
  const tipo = resposta.headers.get('content-type') ?? '';
  if (!resposta.ok || !tiposAceitos(arquivos[i]).some((t) => tipo.startsWith(t))) throw new Error(`Arquivo indisponível (${resposta.status} ${tipo}): ${link}`);
  console.log(`  ✓ ${link}`);
}

// ---------- token ----------

async function lerToken() {
  if (process.env.INSTAGRAM_ACCESS_TOKEN) return process.env.INSTAGRAM_ACCESS_TOKEN;
  const arquivo = process.env.INSTAGRAM_TOKEN_FILE ?? join(dirname(raiz), 'sc', 'instagram', 'marcusodev.env');
  const conteudo = await readFile(arquivo, 'utf8').catch(() => {
    throw new Error(`Token não encontrado: defina INSTAGRAM_ACCESS_TOKEN ou clone mvrebolo/sc em ${join(dirname(raiz), 'sc')}.`);
  });
  const token = conteudo.match(/^INSTAGRAM_ACCESS_TOKEN=(.+)$/m)?.[1]?.trim();
  if (!token) throw new Error(`INSTAGRAM_ACCESS_TOKEN não encontrado em ${arquivo}.`);
  return token;
}

const token = await lerToken();
const graph = `https://graph.instagram.com/${process.env.INSTAGRAM_API_VERSION ?? 'v23.0'}`;

// ---------- API do Instagram ----------

async function instagram(caminho, parametros = {}, metodo = 'POST') {
  const url = new URL(`${graph}${caminho}`);
  const corpo = new URLSearchParams({ ...parametros, access_token: token });
  const resposta = metodo === 'GET'
    ? await fetch(`${url}?${corpo}`)
    : await fetch(url, { method: 'POST', body: corpo });
  const dados = await resposta.json();
  if (dados.error) throw new Error(`Instagram ${caminho}: ${dados.error.message}`);
  return dados;
}

async function esperarContainer(id) {
  // vídeos levam mais tempo para a Meta processar
  for (let tentativa = 0; tentativa < (ehVideo ? 100 : 30); tentativa++) {
    const { status_code } = await instagram(`/${id}`, { fields: 'status_code' }, 'GET');
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') {
      const { status } = await instagram(`/${id}`, { fields: 'status' }, 'GET');
      throw new Error(`Container ${id} falhou: ${status_code} (${status ?? 'sem detalhes'})`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Container ${id} não ficou pronto a tempo.`);
}

// ---------- publicação ----------

const { user_id: usuario, username } = await instagram('/me', { fields: 'user_id,username' }, 'GET');
console.log(`\nConta: @${username} (token válido)`);

if (!publicar) {
  console.log('\nModo de teste: nada foi publicado. Para publicar, rode de novo com --publicar.');
  process.exit(0);
}

const midia = (i) => (eVideo(arquivos[i]) ? { media_type: 'VIDEO', video_url: links[i] } : { image_url: links[i] });

let criacao;
if (links.length === 1) {
  const unico = eVideo(arquivos[0]) ? { media_type: 'REELS', video_url: links[0] } : { image_url: links[0] };
  ({ id: criacao } = await instagram(`/${usuario}/media`, { ...unico, caption: legenda }));
} else {
  console.log('Criando itens do carrossel...');
  const filhos = [];
  for (const i of links.keys()) {
    const { id } = await instagram(`/${usuario}/media`, { ...midia(i), is_carousel_item: 'true' });
    filhos.push(id);
  }
  for (const id of filhos) await esperarContainer(id);
  ({ id: criacao } = await instagram(`/${usuario}/media`, {
    media_type: 'CAROUSEL',
    children: filhos.join(','),
    caption: legenda,
  }));
}

await esperarContainer(criacao);
const { id: publicado } = await instagram(`/${usuario}/media_publish`, { creation_id: criacao });
const { permalink } = await instagram(`/${publicado}`, { fields: 'permalink' }, 'GET');
console.log(`\n✓ Publicado: ${permalink}`);
