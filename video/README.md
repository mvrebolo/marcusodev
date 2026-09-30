# Carrossel animado (Remotion)

Cada slide do carrossel vira um vídeo curto (1080×1350, cerca de 5 s) com as animações e os sons da marca:

- títulos entrando palavra por palavra, com um "tic" suave em cada palavra;
- comandos **digitados no terminal**, com som de teclado;
- listas, comparações ✗/✓ e avisos surgindo com um "pop";
- o símbolo `>_` se desenhando no último slide, com um acorde no botão;
- uma base ambiente bem baixa ao fundo.

Os sons são sintetizados por código (`npm run sons`), sem samples de terceiros. As fontes ficam em `public/fonts` (licença OFL).

## Criar um post animado

1. Crie `video/posts/<id>.ts` descrevendo os slides (veja `03-o-que-e-claude-code.ts`). Em títulos e textos, `*palavras entre asteriscos*` ficam em laranja.
2. Registre o post em `video/posts/index.ts`.
3. Gere os vídeos: `npm run videos -- <id>`. Eles ficam em `posts/<id>/videos/`.
4. Commit + push e publique: `npm run publicar -- posts/<id> --publicar`. Se o post tiver a pasta `videos/`, sai carrossel animado; se não, carrossel de imagens.

Para ver e ajustar ao vivo no navegador: `npx remotion studio video/index.ts`.

## Tipos de slide

| Tipo | Campos |
|---|---|
| `capa` | `etiqueta?`, `titulo`, `comentario?` |
| `texto` | `etiqueta?`, `titulo`, `texto?`, `apoio?` (cinza) |
| `lista` | `etiqueta?`, `titulo`, `itens` |
| `terminal` | `titulo?`, `barra?`, `linhas` (`{ t, tipo?: 'prompt' \| 'comentario' \| 'ok' \| 'erro' }`), `texto?` |
| `comparacao` | `ruim: { titulo, texto }`, `bom: { titulo, texto }` |
| `aviso` | `titulo`, `texto` |
| `cta` | `titulo`, `texto?`, `botao` |

> Sem o Chrome do Remotion instalado, aponte para um Chrome headless com `CHROME_PATH`.
