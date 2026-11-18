// Lógica pura (sem rede), para dar para testar fora da Supabase.
import type { Gatilho } from "./gatilhos.ts";

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// A palavra precisa aparecer inteira: "OCR" casa com "ocr!!" ou "quero OCR",
// mas não com "procurar".
export function acharGatilho(
  texto: string,
  mediaId: string | undefined,
  gatilhos: Gatilho[],
): Gatilho | undefined {
  const t = normalizar(texto);
  return gatilhos.find((g) => {
    if (g.posts.length > 0 && (!mediaId || !g.posts.includes(mediaId))) return false;
    const p = normalizar(g.palavra).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${p}([^a-z0-9]|$)`).test(t);
  });
}

export type Comentario = {
  contaId: string; // a conta @marcusodev (entry.id)
  comentarioId: string;
  texto: string;
  autorId?: string;
  autorUsuario?: string;
  mediaId?: string;
  ehResposta: boolean; // é resposta a outro comentário
};

// Extrai os comentários novos do corpo do webhook da Meta.
export function extrairComentarios(corpo: any): Comentario[] {
  const lista: Comentario[] = [];
  for (const entry of corpo?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change?.field !== "comments") continue;
      const v = change.value ?? {};
      if (!v.id || typeof v.text !== "string") continue;
      lista.push({
        contaId: String(entry.id),
        comentarioId: String(v.id),
        texto: v.text,
        autorId: v.from?.id,
        autorUsuario: v.from?.username,
        mediaId: v.media?.id,
        ehResposta: Boolean(v.parent_id),
      });
    }
  }
  return lista;
}

// Confere se o webhook veio mesmo da Meta (cabeçalho X-Hub-Signature-256).
export async function assinaturaValida(
  corpoBruto: string,
  cabecalho: string | null,
  segredo: string,
): Promise<boolean> {
  if (!cabecalho?.startsWith("sha256=")) return false;
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(corpoBruto));
  const esperado = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const recebido = cabecalho.slice(7);
  if (recebido.length !== esperado.length) return false;
  let dif = 0;
  for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
  return dif === 0;
}
