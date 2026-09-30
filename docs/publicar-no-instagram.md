# Publicar no Instagram

O script `scripts/publicar.mjs` publica um post pela **API oficial do Instagram** (`graph.instagram.com`), no mesmo modelo usado pelo betmind10.

Como este repositório é **público**, a Meta baixa as imagens direto do GitHub. Os links ficam fixados no commit, então nunca mudam. Não é preciso nenhum serviço extra de hospedagem.

## Configuração (uma vez só)

1. **Conta profissional:** no app do Instagram, vá em Configurações → Tipo de conta e mude o @marcusodev para *Criador de conteúdo* ou *Empresa*.
2. **App na Meta:** em [developers.facebook.com](https://developers.facebook.com), crie um app, adicione o produto **Instagram** (API com login do Instagram) e inclua o @marcusodev como testador. Permissões:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
3. **Token:** gere um token de longa duração (válido por 60 dias, renovável).
4. **Guardar o token:** crie a variável de ambiente `INSTAGRAM_ACCESS_TOKEN`.
   - Nas sessões do Claude Code na nuvem: menu do ambiente → **Editar** → variáveis de ambiente.
   - No seu computador: `export INSTAGRAM_ACCESS_TOKEN=...` (nunca coloque o token em um arquivo do repositório).

## Publicar um post

```bash
# 1. gerar as imagens
npm run slides -- posts/04-meu-post/carrossel.html

# 2. commit + push (a Meta baixa as imagens do GitHub)
git add posts/04-meu-post && git commit -m "Post 04" && git push

# 3. conferir (modo de teste: mostra legenda e links, não publica)
npm run publicar -- posts/04-meu-post

# 4. publicar de verdade
npm run publicar -- posts/04-meu-post --publicar
```

O script lê:
- **imagens:** `posts/<post>/slides/*.jpg`, na ordem do nome (máximo 10 por carrossel; com 1 imagem, vira post único);
- **legenda:** o bloco de código da seção `## Legenda` do `roteiro.md` + o bloco de `## Hashtags` (máximo 2200 caracteres).

Antes de publicar, ele confere se os slides estão commitados, se o commit já está no GitHub e se cada imagem responde como JPEG.

## Limites da API

- Até 100 posts publicados pela API a cada 24 horas.
- Somente imagens JPEG.
- O token expira em 60 dias: renove antes disso e atualize a variável.
