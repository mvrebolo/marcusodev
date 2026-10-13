// Sintetiza os efeitos sonoros da marca em public/sons/*.wav.
// Os sons são gerados por código (sem samples de terceiros), então não há problema de direitos autorais.
//
// Uso: npm run sons
import { mkdir, writeFile } from 'node:fs/promises';

const TAXA = 44100;
const DIR = 'public/sons';

function wav(amostras) {
  const dados = Buffer.alloc(amostras.length * 2);
  amostras.forEach((v, i) => dados.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const cab = Buffer.alloc(44);
  cab.write('RIFF', 0); cab.writeUInt32LE(36 + dados.length, 4); cab.write('WAVE', 8);
  cab.write('fmt ', 12); cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20); cab.writeUInt16LE(1, 22);
  cab.writeUInt32LE(TAXA, 24); cab.writeUInt32LE(TAXA * 2, 28); cab.writeUInt16LE(2, 32); cab.writeUInt16LE(16, 34);
  cab.write('data', 36); cab.writeUInt32LE(dados.length, 40);
  return Buffer.concat([cab, dados]);
}

function sinal(segundos, f) {
  return Array.from({ length: Math.round(segundos * TAXA) }, (_, i) => f(i / TAXA));
}

// ruído pseudoaleatório com semente, para o resultado ser sempre igual
function ruido(semente) {
  let s = semente;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 1073741824) - 1;
}

// tecla de teclado mecânico: estalo de ruído filtrado + corpo grave curto
function tecla(semente, tom) {
  const r = ruido(semente);
  let anterior = 0;
  return sinal(0.05, (t) => {
    const n = r();
    const agudo = n - anterior; // passa-altas simples
    anterior = n;
    return 0.5 * agudo * Math.exp(-t / 0.004) + 0.35 * Math.sin(2 * Math.PI * tom * t) * Math.exp(-t / 0.008);
  });
}

const tic = sinal(0.06, (t) => 0.35 * Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-t / 0.01));

const pop = sinal(0.12, (t) => {
  const f = 320 + 380 * Math.exp(-t / 0.02); // cai de 700 para 320 Hz
  return 0.6 * Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.03) * Math.min(1, t / 0.002);
});

const acorde = sinal(1.8, (t) =>
  [440, 554.37, 659.25, 880]
    .map((f, i) => (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t / (0.5 + i * 0.1)))
    .reduce((a, b) => a + b, 0) * 0.24 * Math.min(1, t / 0.01),
);

// whoosh: ruído com filtro que abre e fecha (passagem rápida, para transições)
const whoosh = (() => {
  const r = ruido(2024);
  let filtrado = 0;
  return sinal(0.6, (t) => {
    const forma = Math.sin(Math.PI * Math.min(1, t / 0.6)) ** 2; // sobe e desce
    const abertura = 0.02 + 0.25 * forma; // filtro passa-baixas que abre no meio
    filtrado += abertura * (r() - filtrado);
    return 1.6 * filtrado * forma;
  });
})();

// impacto: batida grave que cai de tom + estalo (palavras gigantes batendo na tela)
const impacto = (() => {
  const r = ruido(77);
  return sinal(0.5, (t) => {
    const f = 40 + 90 * Math.exp(-t / 0.05);
    const grave = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.16);
    const corpo = Math.sin(2 * Math.PI * (f * 3) * t) * Math.exp(-t / 0.07); // médio: aparece no alto-falante do celular
    return 0.6 * grave + 0.5 * corpo + 0.35 * r() * Math.exp(-t / 0.006);
  });
})();

// batida de fundo para Reels: 120 BPM, 4 compassos (8 s) que emendam sem corte.
// Bumbo, caixa, chimbal, baixo e acordes (Lá menor, Fá, Dó, Sol).
const batida = (() => {
  const BPM = 120, tempo = 60 / BPM, total = 16 * tempo;
  const r = ruido(5);
  const amostras = new Array(Math.round(total * TAXA)).fill(0);
  const soma = (inicio, duracao, f) => {
    const i0 = Math.round(inicio * TAXA);
    for (let i = 0; i < duracao * TAXA && i0 + i < amostras.length; i++) amostras[i0 + i] += f(i / TAXA);
  };
  const acordes = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
  const baixos = [55, 43.65, 65.41, 49];
  for (let batidaN = 0; batidaN < 16; batidaN++) {
    const t0 = batidaN * tempo;
    const compasso = Math.floor(batidaN / 4);
    // bumbo em todas as batidas
    soma(t0, 0.3, (t) => 0.9 * Math.sin(2 * Math.PI * (50 + 100 * Math.exp(-t / 0.03)) * t) * Math.exp(-t / 0.12));
    // caixa nas batidas 2 e 4
    if (batidaN % 2 === 1) soma(t0, 0.2, (t) => 0.35 * r() * Math.exp(-t / 0.05) + 0.2 * Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t / 0.04));
    // chimbal no contratempo
    let anterior = 0;
    soma(t0 + tempo / 2, 0.05, (t) => { const n = r(); const v = (n - anterior) * 0.12 * Math.exp(-t / 0.012); anterior = n; return v; });
    // baixo em colcheias
    for (const meio of [0, tempo / 2]) {
      soma(t0 + meio, tempo / 2, (t) => {
        const f = baixos[compasso];
        return 0.28 * (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(4 * Math.PI * f * t) + 0.25 * Math.sin(6 * Math.PI * f * t)) * Math.exp(-t / 0.18);
      });
    }
    // acorde no começo de cada compasso
    if (batidaN % 4 === 0) {
      soma(t0, 4 * tempo, (t) => {
        const envelope = Math.min(1, t / 0.08) * Math.exp(-t / 1.4);
        return 0.07 * envelope * acordes[compasso].reduce((a, f) => a + Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t), 0);
      });
    }
  }
  return amostras;
})();

await mkdir(DIR, { recursive: true });
const sons = {
  'tecla-1': tecla(7, 180), 'tecla-2': tecla(42, 210), 'tecla-3': tecla(99, 160),
  tic, pop, acorde, whoosh, impacto, batida,
};
// normaliza cada som para o mesmo pico, para nenhum efeito sumir no celular
const PICO = 0.9;
for (const [nome, amostras] of Object.entries(sons)) {
  const maior = amostras.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  await writeFile(`${DIR}/${nome}.wav`, wav(amostras.map((v) => (v * PICO) / maior)));
  console.log(`✓ ${DIR}/${nome}.wav`);
}
