# DM automática por comentário ("Comenta OCR que eu te mando o repo")

Automação própria, sem ManyChat. Quando alguém comenta a palavra-chave num post do @marcusodev:

1. a pessoa recebe o link no direct (API oficial de *Private Replies* da Meta);
2. o comentário ganha uma resposta pública tipo "Te mandei no direct! 📩" (isso ajuda o alcance do Reel).

O código está em [`supabase/functions/dm-comentario/`](../supabase/functions/dm-comentario/) e roda como Edge Function na Supabase (grátis no seu volume).

| Arquivo | Para que serve |
|---|---|
| `gatilhos.ts` | **O único que você edita no dia a dia:** palavra-chave → mensagem da DM |
| `index.ts` | O webhook: recebe o comentário, manda a DM e responde |
| `logica.ts` | Achar a palavra, ler o webhook, conferir a assinatura da Meta |
| `teste.ts` | Teste rápido da lógica (`deno run teste.ts`) |

## Como funciona

```
alguém comenta "OCR" ──► Meta chama o webhook ──► Edge Function na Supabase
                                                    ├─ POST /{sua-conta}/messages  (DM com o link)
                                                    └─ POST /{comentário}/replies  (resposta pública)
```

- A palavra é encontrada inteira, sem ligar para maiúscula ou acento: `OCR`, `ocr!!`, `quero o ócr` funcionam; `procurar` não.
- Comentários da sua própria conta são ignorados (não entra em loop).
- A Meta só permite **1 DM por comentário** e só até **7 dias** depois dele. Se a mesma pessoa comentar de novo, recebe de novo.
- Respostas a outros comentários (threads) recebem a DM, mas não a resposta pública.

## Configuração (uma vez só)

Você vai usar o mesmo app da Meta do `scripts/publicar.mjs`. Nenhum segredo vai para este repositório (ele é público) nem para o chat: tudo fica nos *Secrets* da Supabase.

### 1. Permissões novas no app da Meta

Em [developers.facebook.com](https://developers.facebook.com) → seu app → **Instagram** → **API setup with Instagram login**, adicione as permissões:

- `instagram_business_basic` (já tem)
- `instagram_business_manage_comments` (ler e responder comentários)
- `instagram_business_manage_messages` (mandar a DM)

No app do Instagram, confira também: **Configurações → Mensagens e respostas a stories → Ferramentas conectadas → Permitir acesso às mensagens** ligado.

### 2. Token novo

O token atual (do `sc/instagram/marcusodev.env`) só tem permissão de publicar. Gere um token novo de longa duração na mesma tela, já com as permissões acima, e atualize o arquivo no `sc`. Ele também serve para o `publicar.mjs`, desde que inclua `instagram_business_content_publish`.

Anote também o **Instagram app secret** (na mesma tela, em *App settings*).

### 3. Subir a função na Supabase

Com a [CLI da Supabase](https://supabase.com/docs/guides/cli) instalada, na raiz deste repositório:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF

# segredos (cola os valores no seu terminal, não no chat)
supabase secrets set IG_ACCESS_TOKEN=... IG_APP_SECRET=... IG_VERIFY_TOKEN=uma-senha-que-voce-inventa

supabase functions deploy dm-comentario --no-verify-jwt
```

A URL do webhook fica: `https://SEU_PROJECT_REF.supabase.co/functions/v1/dm-comentario`

### 4. Ligar o webhook na Meta

No app → **Instagram** → **API setup with Instagram login** → **Configure webhooks**:

- **Callback URL:** a URL acima
- **Verify token:** a mesma senha do `IG_VERIFY_TOKEN`
- Clique em **Verify and save**, depois assine o campo **`comments`**.

Na seção de contas, deixe a conta @marcusodev com **webhook subscription** ligada.

### 5. Modo Live (o ponto que mais trava)

Com o app em modo **Development**, a Meta só entrega webhooks de comentários feitos por contas com papel no app (você e testadores). Para funcionar com qualquer seguidor:

1. passe `instagram_business_manage_comments` e `instagram_business_manage_messages` para **Advanced Access** (isso pede **App Review**: um vídeo curto mostrando o fluxo e o texto explicando o uso; a Meta pode pedir verificação do negócio);
2. coloque o app em modo **Live**.

Dá para testar tudo antes da revisão: adicione um segundo perfil seu como testador (Instagram → *App roles*) e comente com ele.

## Testar

1. Num post seu, comente `OCR` usando a conta testadora.
2. Veja os logs: Supabase → **Edge Functions → dm-comentario → Logs**. Deve aparecer `ok: "OCR" para @...`.
3. Se der erro, o log mostra a resposta da Meta (token sem permissão, app em Development, etc.).

## Adicionar um novo Reel

Edite `gatilhos.ts`, copie o bloco do OCR e troque `palavra`, `dm` e `resposta`. Depois:

```bash
supabase functions deploy dm-comentario --no-verify-jwt
```

Se quiser que a palavra valha só para um post, coloque o ID dele em `posts` (o ID aparece no log quando alguém comenta, ou na resposta do `publicar.mjs`).

## Manutenção

- **Token expira em 60 dias.** Quando renovar, rode de novo `supabase secrets set IG_ACCESS_TOKEN=...`. Não precisa fazer deploy.
- **Limites:** a Meta limita o volume de mensagens por hora; para o tamanho atual do perfil não faz diferença.
