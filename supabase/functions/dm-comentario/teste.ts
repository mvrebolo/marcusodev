// Teste rápido da lógica: deno run teste.ts  (ou: node --experimental-strip-types teste.ts)
import { GATILHOS } from "./gatilhos.ts";
import { acharGatilho, assinaturaValida, extrairComentarios } from "./logica.ts";

let falhas = 0;
const ok = (cond: boolean, nome: string) => {
  console.log(`${cond ? "✓" : "✗"} ${nome}`);
  if (!cond) falhas++;
};

ok(!!acharGatilho("OCR", "1", GATILHOS), "OCR exato");
ok(!!acharGatilho("quero o ocr!!", "1", GATILHOS), "ocr no meio da frase");
ok(!!acharGatilho("Ócr 🙏", "1", GATILHOS), "com acento e emoji");
ok(!acharGatilho("vou procurar", "1", GATILHOS), "não casa dentro de outra palavra");
ok(!acharGatilho("top demais", "1", GATILHOS), "sem palavra-chave");
const restrito = [{ ...GATILHOS[0], posts: ["123"] }];
ok(!!acharGatilho("OCR", "123", restrito), "post certo");
ok(!acharGatilho("OCR", "999", restrito), "post errado");

const webhook = {
  object: "instagram",
  entry: [{
    id: "17841400000000000",
    time: 1,
    changes: [{
      field: "comments",
      value: {
        from: { id: "232323", username: "fulano" },
        media: { id: "123", media_product_type: "REELS" },
        id: "17865799348089039",
        text: "OCR",
      },
    }],
  }],
};
const cs = extrairComentarios(webhook);
ok(cs.length === 1 && cs[0].comentarioId === "17865799348089039" && cs[0].contaId === "17841400000000000", "lê o webhook");

const corpo = JSON.stringify(webhook);
const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode("segredo"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const hex = [...new Uint8Array(await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(corpo)))].map((b) => b.toString(16).padStart(2, "0")).join("");
ok(await assinaturaValida(corpo, `sha256=${hex}`, "segredo"), "assinatura válida");
ok(!(await assinaturaValida(corpo, `sha256=${hex}`, "outro")), "assinatura falsa");
ok(!(await assinaturaValida(corpo, null, "segredo")), "sem assinatura");

if (falhas) { console.log(`${falhas} falha(s)`); throw new Error("falhou"); }
console.log("tudo certo");
