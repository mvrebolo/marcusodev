// Webhook do Instagram: quando alguém comenta a palavra-chave de um post,
// manda o link no direct da pessoa (Private Reply) e responde o comentário.
//
// Segredos (Supabase → Edge Functions → Secrets):
//   IG_ACCESS_TOKEN  token da conta, com instagram_business_manage_comments
//                    e instagram_business_manage_messages
//   IG_APP_SECRET    "Instagram app secret" do app na Meta
//   IG_VERIFY_TOKEN  uma senha qualquer, a mesma que você digita na tela de Webhooks
// Opcional: IG_API_VERSION (padrão v23.0)

import { GATILHOS } from "./gatilhos.ts";
import { acharGatilho, assinaturaValida, type Comentario, extrairComentarios } from "./logica.ts";

const TOKEN = Deno.env.get("IG_ACCESS_TOKEN") ?? "";
const APP_SECRET = Deno.env.get("IG_APP_SECRET") ?? "";
const VERIFY_TOKEN = Deno.env.get("IG_VERIFY_TOKEN") ?? "";
const GRAPH = `https://graph.instagram.com/${Deno.env.get("IG_API_VERSION") ?? "v23.0"}`;

async function chamar(caminho: string, corpo: unknown) {
  const r = await fetch(`${GRAPH}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(corpo),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${caminho} ${r.status} ${JSON.stringify(json)}`);
  return json;
}

async function tratar(c: Comentario) {
  // Ignora comentários da própria conta (evita responder a si mesmo).
  if (c.autorId && c.autorId === c.contaId) return;
  const g = acharGatilho(c.texto, c.mediaId, GATILHOS);
  if (!g) return;

  // 1) Direct para quem comentou. A Meta só deixa 1 por comentário,
  //    então um webhook repetido não gera DM duplicada.
  await chamar(`/${c.contaId}/messages`, {
    recipient: { comment_id: c.comentarioId },
    message: { text: g.dm },
  });

  // 2) Resposta pública (só se a DM saiu, e não em respostas de respostas).
  if (g.resposta.length > 0 && !c.ehResposta) {
    const texto = g.resposta[Math.floor(Math.random() * g.resposta.length)];
    await chamar(`/${c.comentarioId}/replies`, { message: texto });
  }
  console.log(`ok: "${g.palavra}" para @${c.autorUsuario ?? c.autorId} (comentário ${c.comentarioId})`);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Verificação do webhook (a Meta chama uma vez, quando você salva a URL).
  if (req.method === "GET") {
    const ok =
      url.searchParams.get("hub.mode") === "subscribe" &&
      VERIFY_TOKEN !== "" &&
      url.searchParams.get("hub.verify_token") === VERIFY_TOKEN;
    return ok
      ? new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 })
      : new Response("forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const bruto = await req.text();
  if (!(await assinaturaValida(bruto, req.headers.get("x-hub-signature-256"), APP_SECRET))) {
    console.warn("assinatura inválida, ignorado");
    return new Response("invalid signature", { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = JSON.parse(bruto);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const trabalho = Promise.allSettled(extrairComentarios(corpo).map(tratar)).then((rs) => {
    for (const r of rs) if (r.status === "rejected") console.error("erro:", String(r.reason));
  });

  // Responde 200 na hora para a Meta não reenviar; o envio continua em segundo plano.
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(trabalho);
  else await trabalho;
  return new Response("ok", { status: 200 });
});
