// Palavras-chave dos posts. Para um novo Reel, copie um bloco e troque os textos.
//
// palavra:  o que a pessoa precisa comentar (maiúscula, minúscula ou acento não importam).
// posts:    IDs dos posts onde vale. Deixe [] para valer em qualquer post.
// dm:       a mensagem enviada no direct da pessoa.
// resposta: respostas públicas no comentário (sorteia uma). Deixe [] para não responder.

export type Gatilho = {
  palavra: string;
  posts: string[];
  dm: string;
  resposta: string[];
};

export const GATILHOS: Gatilho[] = [
  {
    palavra: "OCR",
    posts: [],
    dm:
      "Fala! Aqui está o repositório do projeto de OCR que mostrei no Reel:\n\n" +
      "https://github.com/mvrebolo/TROCAR-PELO-REPO-DO-OCR\n\n" +
      "Se curtir, deixa uma estrela lá ⭐",
    resposta: [
      "Te mandei no direct! 📩",
      "Enviado no direct, confere lá 🚀",
      "Mandei o link na sua DM 👊",
    ],
  },
];
