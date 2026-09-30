// Gera um JPEG 1080×1350 para cada slide de um carrossel (formato exigido pela API do Instagram).
//
// Uso:  npm run slides -- posts/03-o-que-e-claude-code/carrossel.html
// Saída: posts/03-o-que-e-claude-code/slides/01.jpg, 02.jpg, ...
//
// Se o Playwright não encontrar o navegador, rode "npx playwright install chromium"
// ou aponte para um Chrome já instalado com a variável CHROME_PATH.
import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const arquivo = process.argv[2];
if (!arquivo) {
  console.error('Uso: npm run slides -- caminho/do/carrossel.html');
  process.exit(1);
}

const html = resolve(arquivo);
const saida = join(dirname(html), 'slides');

const navegador = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}
);
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1350 } });
await pagina.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
await pagina.evaluate(() => document.body.classList.add('exportando'));
await pagina.evaluate(() => document.fonts.ready);

const slides = await pagina.locator('.slide').all();
await rm(saida, { recursive: true, force: true });
await mkdir(saida, { recursive: true });

for (const [i, slide] of slides.entries()) {
  const nome = `${String(i + 1).padStart(2, '0')}.jpg`;
  await slide.screenshot({ path: join(saida, nome), type: 'jpeg', quality: 95 });
  console.log(`✓ ${join(saida, nome)}`);
}

await navegador.close();
console.log(`\n${slides.length} slides gerados em ${saida}`);
