// Tokens da marca para os vídeos (mesmos valores de templates/carrossel/estilo.css).
// As fontes ficam em public/fonts, então o vídeo renderiza igual com ou sem internet.
import { continueRender, delayRender, staticFile } from 'remotion';

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

const fontes = [
  { familia: 'JetBrains Mono', arquivo: 'jetbrains-mono', opcoes: { weight: '400 700' } },
  { familia: 'Inter', arquivo: 'inter', opcoes: { weight: '400 600' } },
  // quadro "Aprende o Óbvio": letra larga e pesada + serifa itálica
  { familia: 'Archivo', arquivo: 'archivo-larga', opcoes: { weight: '900', stretch: '125%' } },
  { familia: 'Instrument Serif', arquivo: 'instrument-serif-italico', opcoes: { style: 'italic' } },
].flatMap(({ familia, arquivo, opcoes }) => [
  new FontFace(familia, `url(${staticFile(`fonts/${arquivo}-latin.woff2`)})`, { ...opcoes, unicodeRange: LATIN }),
  new FontFace(familia, `url(${staticFile(`fonts/${arquivo}-latin-ext.woff2`)})`, { ...opcoes, unicodeRange: LATIN_EXT }),
]);

const espera = delayRender('Carregando as fontes da marca');
Promise.all(fontes.map((f) => f.load().then(() => document.fonts.add(f)))).then(() => continueRender(espera));

export const mono = "'JetBrains Mono', ui-monospace, monospace";
export const sans = 'Inter, system-ui, sans-serif';
export const larga = "Archivo, 'Arial Black', sans-serif";
export const serifa = "'Instrument Serif', Georgia, serif";

export const cor = {
  terminal: '#0D0D0D',
  grafite: '#1A1A1A',
  barra: '#222222',
  borda: '#262626',
  papel: '#F5F5F0',
  laranja: '#D97757',
  verde: '#3FB950',
  vermelho: '#F85149',
  amarelo: '#E3B341',
  cinza: '#8B8B85',
};

export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1350;
