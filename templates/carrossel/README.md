# Template de carrossel

Cada slide é uma `<section class="slide">` de 1080×1350. A numeração (`01/08`), a assinatura `> marcusodev_` e a seta `→` são adicionadas automaticamente.

## Criar um carrossel novo

```bash
mkdir posts/04-meu-post
cp templates/carrossel/modelo.html posts/04-meu-post/carrossel.html
cp templates/post.md posts/04-meu-post/roteiro.md
```

Edite o `carrossel.html` e abra no navegador para ver a prévia.

## Gerar os PNGs

Na primeira vez:
```bash
npm install
npx playwright install chromium
```

Depois, a cada post:
```bash
npm run slides -- posts/04-meu-post/carrossel.html
```

Os PNGs ficam em `posts/04-meu-post/slides/`, prontos para subir no Instagram.

> Já tem o Chrome instalado? Pule o `playwright install` e use a variável `CHROME_PATH`, por exemplo:
> `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run slides -- ...`

## Tipos de slide

| Tipo | Como usar |
|---|---|
| **Capa** | `<section class="slide capa">` com `.etiqueta`, `.titulo` e `.comentario` |
| **Texto** | `.titulo.medio` + `.texto` |
| **Lista** | `<ul class="lista">`, cada item ganha um `>` laranja |
| **Terminal** | `.terminal` com `.barra` e `<pre>`; use `.p` para o `>`, `.c` para comentário, `.ok` e `.erro` |
| **Comparação** | `.comparacao` com `.lado.ruim` (✗) e `.lado.bom` (✓) |
| **Aviso** | `.aviso` para cuidados e limitações |
| **CTA** | `<section class="slide cta">` com o símbolo, título e `.botao`. Deve ser o último slide |

## Classes de texto

- `.titulo`, `.titulo.medio`, `.titulo.pequeno`: títulos em JetBrains Mono
- `.titulo .cursor`: adiciona o `_` laranja no fim (use na capa)
- `.texto`, `.texto.pequeno`: textos em Inter
- `.comentario`: frase de apoio no estilo `// comentário`
- `.destaque` (laranja), `.ok` (verde), `.erro` (vermelho), `.apoio` (cinza)

Opções do slide: `data-sem-numero` esconde o número e `data-sem-seta` esconde a seta.

**Lembre das regras da marca:** uma coisa laranja por slide e no máximo 30 palavras.
