# Carrossel animado (Remotion)

O slide 1 sai como **imagem de capa** (`01.jpg`, já com a animação completa), porque o Instagram usa o primeiro item como miniatura no perfil e o primeiro quadro do vídeo seria vazio. Os demais slides viram vídeos curtos (1080×1350, cerca de 5 s) com as animações e os sons da marca:

- títulos entrando palavra por palavra, com um "tic" suave em cada palavra;
- comandos **digitados no terminal**, com som de teclado;
- listas, comparações ✗/✓ e avisos surgindo com um "pop";
- o símbolo `>_` se desenhando no último slide, com um acorde no botão.

Não há música ou base contínua de fundo: cada slide é um vídeo separado, e o som recomeçaria a cada troca de slide.

Os sons são sintetizados por código (`npm run sons`), sem samples de terceiros. As fontes ficam em `public/fonts` (licença OFL).

## Criar um post animado

1. Crie `video/posts/<id>.ts` descrevendo os slides (veja `03-o-que-e-claude-code.ts`). Em títulos e textos, `*palavras entre asteriscos*` ficam em laranja.
2. Registre o post em `video/posts/index.ts`.
3. Gere o carrossel: `npm run videos -- <id>`. A capa e os vídeos ficam em `posts/<id>/videos/`.
4. Commit + push e publique: `npm run publicar -- posts/<id> --publicar`. Se o post tiver a pasta `videos/`, sai carrossel animado; se não, carrossel de imagens.

Para ver e ajustar ao vivo no navegador: `npx remotion studio video/index.ts`.

## Tipos de slide

| Tipo | Campos |
|---|---|
| `capa` | `etiqueta?`, `titulo`, `comentario?` |
| `texto` | `etiqueta?`, `titulo`, `texto?`, `apoio?` (cinza) |
| `lista` | `etiqueta?`, `titulo`, `itens` |
| `terminal` | `titulo?`, `barra?`, `linhas` (`{ t, tipo?: 'prompt' \| 'saida' \| 'comentario' \| 'ok' \| 'erro' }` (`saida`, `ok` e `erro` aparecem de uma vez; o resto é digitado)), `texto?` |
| `comparacao` | `ruim: { titulo, texto }`, `bom: { titulo, texto }` |
| `aviso` | `titulo`, `texto` |
| `cta` | `titulo`, `texto?`, `botao` |

> Sem o Chrome do Remotion instalado, aponte para um Chrome headless com `CHROME_PATH`.

## Intro e fechamento da marca

Vinhetas de 5 s que abrem e fecham os vídeos (Reels, tutoriais, YouTube), no mesmo padrão das vinhetas do BetMind10:

- **Intro:** moldura de painel técnico → ponto → anel → **partículas que formam o `>_`** → logo `> marcusodev_` entrando com linhas de velocidade → sublinhado → "Projetos *reais* com IA."
- **Fechamento:** partículas formam o `>_` → `@marcusodev` → "Aprenda comigo a criar projetos reais que *geram valor.*" → pílulas *Dev com IA · Agentes de IA · SaaS* → botão **Me segue →**

Gere com `npm run vinhetas`. Os arquivos ficam em `marca/vinhetas/` (`intro-9x16.mp4`, `intro-16x9.mp4`, `fechamento-9x16.mp4`, `fechamento-16x9.mp4`). Para usar, coloque a intro no começo e o fechamento no fim do vídeo no editor.
