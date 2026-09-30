// Publica um post no Instagram @marcusodev pela API oficial (graph.instagram.com).
//
// Uso:
//   npm run publicar -- posts/03-o-que-e-claude-code              → modo de teste (não publica nada)
//   npm run publicar -- posts/03-o-que-e-claude-code --publicar   → publica de verdade
//
// Lê as imagens de <post>/slides/*.jpg e a legenda + hashtags do <post>/roteiro.md.
// O repositório é público: a Meta baixa as imagens direto do GitHub (raw.githubusercontent.com),
// fixadas no commit atual. Por isso os slides precisam estar commitados e enviados (git push) antes.
//
// Variáveis de ambiente (configure no ambiente, nunca no código):
//   INSTAGRAM_ACCESS_TOKEN     token da API do Instagram (permissão instagram_business_content_publish)
//   INSTAGRAM_API_VERSION      opcional, padrão "v23.0"
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
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

const dirSlides = join(dirPost, 'slides');
const imagens = (await readdir(dirSlides)).filter((f) => /\.jpe?g$/i.test(f)).sort();
if (imagens.length === 0) throw new Error(`Nenhum JPEG em ${dirSlides}. Rode antes: npm run slides -- ${pasta}/carrossel.html`);
if (imagens.length > MAX_ITENS_CARROSSEL) throw new Error(`${imagens.length} imagens; o carrossel aceita até ${MAX_ITENS_CARROSSEL}.`);

console.log(`Post: ${nomePost}`);
console.log(`Imagens (${imagens.length}): ${imagens.join(', ')}`);
console.log(`Legenda (${legenda.length} caracteres):\n${'-'.repeat(40)}\n${legenda}\n${'-'.repeat(40)}`);

// ---------- links públicos no GitHub ----------

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const commit = git('rev-parse', 'HEAD');
const repo = git('remote', 'get-url', 'origin').match(/github\.com[:/](.+?)(\.git)?$/)?.[1];
if (!repo) throw new Error('O remote "origin" não aponta para o GitHub.');

const alterados = git('status', '--porcelain', '--', dirSlides);
if (alterados) throw new Error(`Há slides não commitados em ${dirSlides}. Faça commit e push antes de publicar.`);
if (!git('branch', '-r', '--contains', commit)) throw new Error(`O commit ${commit.slice(0, 7)} ainda não foi enviado. Rode git push antes de publicar.`);

const raiz = git('rev-parse', '--show-toplevel');
const links = imagens.map((f) => `https://raw.githubusercontent.com/${repo}/${commit}/${relative(raiz, join(dirSlides, f))}`);

console.log('\nConferindo os links das imagens...');
for (const link of links) {
  const resposta = await fetch(link, { method: 'HEAD' });
  const tipo = resposta.headers.get('content-type') ?? '';
  if (!resposta.ok || !tipo.startsWith('image/jpeg')) throw new Error(`Imagem indisponível (${resposta.status} ${tipo}): ${link}`);
  console.log(`  ✓ ${link}`);
}

if (!publicar) {
  console.log('\nModo de teste: nada foi publicado. Para publicar, rode de novo com --publicar.');
  process.exit(0);
}

// ---------- configuração ----------

function variavel(nome, padrao) {
  const valor = process.env[nome] ?? padrao;
  if (!valor) throw new Error(`Variável de ambiente ${nome} não configurada.`);
  return valor;
}

const token = variavel('INSTAGRAM_ACCESS_TOKEN');
const graph = `https://graph.instagram.com/${variavel('INSTAGRAM_API_VERSION', 'v23.0')}`;

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
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    const { status_code } = await instagram(`/${id}`, { fields: 'status_code' }, 'GET');
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Container ${id} falhou: ${status_code}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Container ${id} não ficou pronto a tempo.`);
}

// ---------- publicação ----------

const { user_id: usuario, username } = await instagram('/me', { fields: 'user_id,username' }, 'GET');
console.log(`\nConta: @${username}`);

let criacao;
if (links.length === 1) {
  ({ id: criacao } = await instagram(`/${usuario}/media`, { image_url: links[0], caption: legenda }));
} else {
  console.log('Criando itens do carrossel...');
  const filhos = [];
  for (const link of links) {
    const { id } = await instagram(`/${usuario}/media`, { image_url: link, is_carousel_item: 'true' });
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
const { id: midia } = await instagram(`/${usuario}/media_publish`, { creation_id: criacao });
const { permalink } = await instagram(`/${midia}`, { fields: 'permalink' }, 'GET');
console.log(`\n✓ Publicado: ${permalink}`);
