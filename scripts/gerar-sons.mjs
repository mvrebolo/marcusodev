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

await mkdir(DIR, { recursive: true });
const sons = {
  'tecla-1': tecla(7, 180), 'tecla-2': tecla(42, 210), 'tecla-3': tecla(99, 160),
  tic, pop, acorde, whoosh,
};
for (const [nome, amostras] of Object.entries(sons)) {
  await writeFile(`${DIR}/${nome}.wav`, wav(amostras));
  console.log(`✓ ${DIR}/${nome}.wav`);
}
