// Intro e fechamento da marca (5 s cada), em 9:16 e 16:9.
// Mesmo padrão das vinhetas do BetMind10: moldura de painel técnico, partículas que formam
// o símbolo da marca, logo com linhas de velocidade e frase entrando palavra por palavra.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { cor, mono, sans } from './marca';

export const DURACAO_VINHETA = 150; // 5 s a 30 fps

const limitar = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// escala relativa: 1 = 1080 px no lado menor
function useEscala() {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 1080;
}

const Som: React.FC<{ em: number; nome: string; volume?: number }> = ({ em, nome, volume = 1 }) => (
  <Sequence from={em} layout="none">
    <Audio src={staticFile(`sons/${nome}.wav`)} volume={volume} />
  </Sequence>
);

// ---------- moldura de painel técnico ----------

const Moldura: React.FC<{ secao: string }> = ({ secao }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useEscala();
  const m = 40 * s; // margem
  const t = 26 * s; // tamanho dos cantos
  const texto: React.CSSProperties = { position: 'absolute', font: `400 ${17 * s}px ${mono}`, letterSpacing: 1.5 * s, color: cor.cinza, textTransform: 'uppercase' };
  const canto = (top: boolean, left: boolean): React.CSSProperties => ({
    position: 'absolute', width: t, height: t,
    [top ? 'top' : 'bottom']: m, [left ? 'left' : 'right']: m,
    [`border${top ? 'Top' : 'Bottom'}`]: `${2 * s}px solid ${cor.cinza}`,
    [`border${left ? 'Left' : 'Right'}`]: `${2 * s}px solid ${cor.cinza}`,
  });
  const dois = (n: number) => String(Math.floor(n)).padStart(2, '0');
  const tempo = `00:00:${dois(frame / fps)}:${dois(frame % fps)}`;
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [0, 10], [0, 0.9], limitar) }}>
      {[true, false].flatMap((top) => [true, false].map((left) => <div key={`${top}${left}`} style={canto(top, left)} />))}
      <span style={{ ...texto, top: m + 4 * s, left: m + t + 14 * s }}>
        <b style={{ color: cor.papel }}>marcusodev</b> · projetos reais com IA
      </span>
      <span style={{ ...texto, top: m + 4 * s, right: m + t + 14 * s }}>{secao}</span>
      <span style={{ ...texto, bottom: m + 4 * s, left: m + t + 14 * s }}>{tempo}</span>
      <span style={{ ...texto, bottom: m + 4 * s, right: m + t + 14 * s }}>
        30 fps · <span style={{ color: cor.laranja, opacity: Math.floor(frame / 15) % 2 ? 0.3 : 1 }}>●</span> rec
      </span>
    </AbsoluteFill>
  );
};

const Fundo: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useEscala();
  const brilho = interpolate(frame, [0, 30], [0, 1], limitar);
  return (
    <AbsoluteFill style={{ background: cor.terminal }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(217,119,87,${0.16 * brilho}), transparent ${700 * s}px)` }} />
      {/* grade sutil, como nas telas de painel */}
      <AbsoluteFill
        style={{
          opacity: 0.05,
          backgroundImage: `linear-gradient(${cor.papel} 1px, transparent 1px), linear-gradient(90deg, ${cor.papel} 1px, transparent 1px)`,
          backgroundSize: `${60 * s}px ${60 * s}px`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- partículas que formam o símbolo >_ ----------

type Ponto = { x: number; y: number; laranja: boolean };

// pontos no grid 512×512 do símbolo (mesmo desenho de marca/logo/simbolo.svg)
const PONTOS: Ponto[] = (() => {
  const pontos: Ponto[] = [];
  const segmentos = [[136, 156, 236, 256], [236, 256, 136, 356]];
  for (let i = 0; i < 300; i++) {
    const [x1, y1, x2, y2] = segmentos[i % 2];
    const t = random(`t${i}`);
    // espessura do traço na direção perpendicular a cada braço do ">"
    const comprimento = Math.hypot(x2 - x1, y2 - y1);
    const nx = -(y2 - y1) / comprimento;
    const ny = (x2 - x1) / comprimento;
    const desvio = (random(`d${i}`) - 0.5) * 40;
    pontos.push({ x: x1 + (x2 - x1) * t + nx * desvio, y: y1 + (y2 - y1) * t + ny * desvio, laranja: true });
  }
  for (let i = 0; i < 120; i++) {
    pontos.push({ x: 264 + random(`cx${i}`) * 120, y: 334 + random(`cy${i}`) * 44, laranja: false });
  }
  return pontos;
})();

const Particulas: React.FC<{ inicio: number; tamanho: number; centroY?: number; some?: number }> = ({ inicio, tamanho, centroY = 0.5, some }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = useEscala();
  const cx = width / 2;
  const cy = height * centroY;
  const opacidadeFinal = some === undefined ? 1 : interpolate(frame, [some, some + 10], [1, 0], limitar);
  return (
    <AbsoluteFill style={{ opacity: opacidadeFinal }}>
      {PONTOS.map((p, i) => {
        const atraso = Math.floor(random(`a${i}`) * 22);
        const k = spring({ frame: frame - inicio - atraso, fps, config: { damping: 18, mass: 0.8 } });
        const angulo = random(`ang${i}`) * Math.PI * 2;
        const raio = (300 + random(`r${i}`) * 500) * s;
        const ox = cx + Math.cos(angulo) * raio;
        const oy = cy + Math.sin(angulo) * raio;
        const tx = cx + ((p.x - 256) / 512) * tamanho;
        const ty = cy + ((p.y - 256) / 512) * tamanho;
        const r = (2.2 + random(`s${i}`) * 2.6) * s;
        const brilho = 0.55 + 0.45 * Math.sin(frame / 5 + i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: ox + (tx - ox) * k - r, top: oy + (ty - oy) * k - r,
              width: r * 2, height: r * 2, borderRadius: '50%',
              background: p.laranja ? cor.laranja : cor.papel,
              opacity: interpolate(frame - inicio - atraso, [0, 8], [0, 1], limitar) * brilho,
              boxShadow: `0 0 ${8 * s}px ${p.laranja ? cor.laranja : cor.papel}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ponto que vira anel, antes das partículas
const PontoEAnel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useEscala();
  const ponto = spring({ frame: frame - 4, fps, config: { damping: 12 } });
  const anel = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  const some = interpolate(frame, [34, 46], [1, 0], limitar);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: some }}>
      <div style={{ position: 'absolute', width: 120 * s * anel, height: 120 * s * anel, borderRadius: '50%', border: `${2 * s}px solid ${cor.laranja}`, opacity: 0.6 }} />
      <div style={{ width: 16 * s * ponto, height: 16 * s * ponto, borderRadius: '50%', background: cor.laranja, boxShadow: `0 0 ${20 * s}px ${cor.laranja}` }} />
    </AbsoluteFill>
  );
};

// ---------- logo e frase ----------

const Logotipo: React.FC<{ inicio: number; tamanho: number }> = ({ inicio, tamanho }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useEscala();
  const k = spring({ frame: frame - inicio, fps, config: { damping: 16, mass: 0.7 } });
  const sublinhado = interpolate(frame, [inicio + 8, inicio + 22], [0, 1], limitar);
  const linhas = interpolate(frame, [inicio, inicio + 14], [1, 0], limitar);
  return (
    <div style={{ position: 'relative', display: 'inline-block', transform: `translateX(${(1 - k) * -260 * s}px) skewX(${(1 - k) * -12}deg)`, opacity: Math.min(1, k * 2) }}>
      {/* linhas de velocidade */}
      {[0.32, 0.5, 0.68].map((y, i) => (
        <div
          key={y}
          style={{
            position: 'absolute', right: '102%', top: `${y * 100}%`, height: 5 * s, borderRadius: 4 * s,
            width: (70 + i * 30) * s * (0.3 + linhas), background: cor.laranja, opacity: 0.25 + linhas * 0.75,
          }}
        />
      ))}
      <span style={{ font: `700 ${tamanho}px ${mono}`, letterSpacing: -0.03 * tamanho, color: cor.papel, whiteSpace: 'nowrap' }}>
        <span style={{ color: cor.laranja }}>&gt;</span> marcusodev
        <span style={{ color: cor.laranja, opacity: frame > inicio + 20 && Math.floor(frame / 15) % 2 ? 0 : 1 }}>_</span>
      </span>
      <div style={{ height: 6 * s, marginTop: 10 * s, borderRadius: 4 * s, background: cor.laranja, width: `${sublinhado * 100}%` }} />
    </div>
  );
};

// frase entrando palavra por palavra; *palavras entre asteriscos* ficam em laranja
const Frase: React.FC<{ texto: string; inicio: number; tamanho: number; larguraMaxima?: number }> = ({ texto, inicio, tamanho, larguraMaxima }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palavras = texto.split('*').flatMap((trecho, i) => trecho.split(/\s+/).filter(Boolean).map((p) => ({ p, destaque: i % 2 === 1 })));
  return (
    <div style={{ font: `400 ${tamanho}px/1.3 ${sans}`, color: cor.papel, textAlign: 'center', maxWidth: larguraMaxima, whiteSpace: larguraMaxima ? 'normal' : 'nowrap' }}>
      {palavras.map((w, i) => {
        const k = spring({ frame: frame - inicio - i * 4, fps, config: { damping: 200 } });
        return (
          <span key={i} style={{ display: 'inline-block', marginRight: '0.3em', opacity: k, transform: `translateY(${(1 - k) * 20}px)`, color: w.destaque ? cor.laranja : undefined, fontWeight: w.destaque ? 600 : 400 }}>
            {w.p}
          </span>
        );
      })}
    </div>
  );
};

const Escurece: React.FC<{ apartir: number }> = ({ apartir }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: '#000', opacity: interpolate(frame, [apartir, DURACAO_VINHETA], [0, 1], limitar) }} />;
};

// ---------- intro ----------

const ASSINATURA = 'Projetos *reais* com IA.';
const CHAMADA = 'Aprenda comigo a criar projetos reais que *geram valor.*';

export const Intro: React.FC = () => {
  const s = useEscala();
  const frame = useCurrentFrame();
  const LOGO = 82;
  const sobe = interpolate(frame, [LOGO - 6, LOGO + 6], [0, 1], limitar);
  return (
    <AbsoluteFill style={{ fontFamily: sans }}>
      <Fundo />
      <PontoEAnel />
      <AbsoluteFill style={{ transform: `scale(${1 - sobe * 0.5})`, opacity: 1 - sobe }}>
        <Particulas inicio={30} tamanho={520 * s} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30 * s }}>
        {frame >= LOGO && <Logotipo inicio={LOGO} tamanho={104 * s} />}
        {frame >= LOGO + 16 && <Frase texto={ASSINATURA} inicio={LOGO + 16} tamanho={58 * s} />}
      </AbsoluteFill>
      <Moldura secao="01 · intro" />
      <Escurece apartir={DURACAO_VINHETA - 8} />
      <Som em={4} nome="pop" volume={0.8} />
      <Som em={26} nome="whoosh" volume={0.9} />
      <Som em={LOGO - 4} nome="whoosh" volume={1} />
      {[0, 1, 2, 3].map((i) => <Som key={i} em={LOGO + 16 + i * 4} nome="tic" volume={0.6} />)}
      <Som em={LOGO + 34} nome="acorde" volume={0.9} />
    </AbsoluteFill>
  );
};

// ---------- fechamento ----------

const Pilula: React.FC<{ texto: string; inicio: number }> = ({ texto, inicio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useEscala();
  const k = spring({ frame: frame - inicio, fps, config: { damping: 14 } });
  return (
    <span style={{ display: 'inline-block', transform: `scale(${k})`, font: `400 ${26 * s}px ${mono}`, color: cor.laranja, border: `${2 * s}px solid ${cor.laranja}`, borderRadius: 999, padding: `${10 * s}px ${26 * s}px` }}>
      {texto}
    </span>
  );
};

export const Fechamento: React.FC = () => {
  const s = useEscala();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;
  const k = (inicio: number) => spring({ frame: frame - inicio, fps, config: { damping: 200 } });
  const botao = spring({ frame: frame - 84, fps, config: { damping: 10 } });
  const pulso = frame > 100 ? 1 + 0.04 * Math.sin((frame - 100) / 4) : 1;
  return (
    <AbsoluteFill style={{ fontFamily: sans }}>
      <Fundo />
      <Particulas inicio={0} tamanho={(vertical ? 400 : 260) * s} centroY={vertical ? 0.3 : 0.25} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: (vertical ? 28 : 20) * s, paddingTop: (vertical ? 440 : 250) * s }}>
        <div style={{ opacity: k(30), transform: `translateY(${(1 - k(30)) * 30}px)`, font: `700 ${(vertical ? 96 : 76) * s}px ${mono}`, letterSpacing: -2 * s, color: cor.papel }}>
          @marcusodev
        </div>
        {frame >= 42 && <Frase texto={CHAMADA} inicio={42} tamanho={(vertical ? 54 : 40) * s} larguraMaxima={(vertical ? 860 : 1100) * s} />}
        <div style={{ display: 'flex', gap: 16 * s, marginTop: 8 * s }}>
          <Pilula texto="Dev com IA" inicio={64} />
          <Pilula texto="Agentes de IA" inicio={69} />
          <Pilula texto="SaaS" inicio={74} />
        </div>
        <div
          style={{
            marginTop: (vertical ? 20 : 10) * s, transform: `scale(${botao * pulso})`, font: `700 ${(vertical ? 50 : 40) * s}px ${mono}`,
            background: cor.laranja, color: cor.terminal, padding: `${(vertical ? 26 : 20) * s}px ${56 * s}px`, borderRadius: 20 * s,
          }}
        >
          Me segue →
        </div>
      </AbsoluteFill>
      <Moldura secao="99 · fim" />
      <Escurece apartir={DURACAO_VINHETA - 10} />
      <Som em={0} nome="whoosh" volume={0.9} />
      <Som em={30} nome="tic" volume={0.6} />
      {Array.from({ length: 9 }, (_, i) => <Som key={`t${i}`} em={42 + i * 4} nome="tic" volume={0.4} />)}
      {[64, 69, 74].map((f) => <Som key={f} em={f} nome="pop" volume={0.8} />)}
      <Som em={84} nome="acorde" volume={0.9} />
    </AbsoluteFill>
  );
};
