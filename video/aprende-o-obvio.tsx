// Quadro "Aprende o Óbvio": transições no estilo motion reel (fundos chapados, letra gigante
// batendo na tela, serifa itálica) em volta da gravação real do episódio.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { cor, larga, mono, serifa } from './marca';
import { Fechamento } from './vinhetas';

const LIMA = '#D4F53C';
const CREME = '#F2EEE3';
const limitar = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export type Episodio = { episodio: number; titulo: string };

const Som: React.FC<{ em: number; nome: string; volume?: number }> = ({ em, nome, volume = 1 }) => (
  <Sequence from={Math.round(em)} layout="none">
    <Audio src={staticFile(`sons/${nome}.wav`)} volume={volume} />
  </Sequence>
);

// moldura de painel técnico, na cor do fundo de cada cena
const Moldura: React.FC<{ secao: string; tinta: string }> = ({ secao, tinta }) => {
  const frame = useCurrentFrame();
  const texto: React.CSSProperties = { position: 'absolute', font: `400 18px ${mono}`, letterSpacing: 1.5, color: tinta, opacity: 0.75, textTransform: 'uppercase' };
  const canto = (top: boolean, left: boolean): React.CSSProperties => ({
    position: 'absolute', width: 26, height: 26, [top ? 'top' : 'bottom']: 40, [left ? 'left' : 'right']: 40,
    [`border${top ? 'Top' : 'Bottom'}`]: `2px solid ${tinta}`, [`border${left ? 'Left' : 'Right'}`]: `2px solid ${tinta}`, opacity: 0.75,
  });
  return (
    <AbsoluteFill>
      {[true, false].flatMap((t) => [true, false].map((l) => <div key={`${t}${l}`} style={canto(t, l)} />))}
      <span style={{ ...texto, top: 44, left: 80 }}><b>aprende o óbvio</b> · marcusodev</span>
      <span style={{ ...texto, top: 44, right: 80 }}>{secao}</span>
      <span style={{ ...texto, bottom: 44, left: 80 }}>00:00:{String(Math.floor(frame / 30)).padStart(2, '0')}:{String(frame % 30).padStart(2, '0')}</span>
      <span style={{ ...texto, bottom: 44, right: 80 }}>30 fps · <span style={{ opacity: Math.floor(frame / 15) % 2 ? 0.3 : 1 }}>●</span> rec</span>
    </AbsoluteFill>
  );
};

// palavra gigante que entra batendo, com borrão de movimento proporcional à velocidade
const Bate: React.FC<{ texto: string; inicio: number; de: 'esquerda' | 'direita'; tamanho: number; tinta: string }> = ({ texto, inicio, de, tamanho, tinta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const posicao = (f: number) => 1 - spring({ frame: f - inicio, fps, config: { damping: 14, mass: 0.6, stiffness: 180 } });
  const p = posicao(frame);
  const velocidade = Math.abs(p - posicao(frame - 1));
  const lado = de === 'esquerda' ? -1 : 1;
  if (frame < inicio) return null;
  return (
    <div
      style={{
        font: `900 ${tamanho}px/0.95 ${larga}`, fontStretch: '125%', color: tinta, whiteSpace: 'nowrap', letterSpacing: -tamanho * 0.02,
        transform: `translateX(${p * 1200 * lado}px) skewX(${-lado * p * 18}deg)`, filter: `blur(${Math.min(24, velocidade * 260)}px)`,
      }}
    >
      {texto}
    </div>
  );
};

// ---------- 1. abertura (150 quadros) ----------

const Abertura: React.FC<Episodio> = ({ episodio, titulo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const CORTE = 34;
  const ponto = spring({ frame: frame - 2, fps, config: { damping: 12 } });
  const raios = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const subtitulo = spring({ frame: frame - 58, fps, config: { damping: 200 } });
  const zoom = interpolate(frame, [CORTE, 130], [1, 1.05], limitar);
  const saida = interpolate(frame, [128, 146], [0, 1], limitar);
  const ep = `ep. ${String(episodio).padStart(2, '0')}`;
  return (
    <AbsoluteFill>
      {frame < CORTE ? (
        <AbsoluteFill style={{ background: cor.terminal, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: `2px solid ${cor.papel}`, opacity: 0.35 * ponto }} />
          <div style={{ width: 34 * ponto, height: 34 * ponto, borderRadius: '50%', background: cor.laranja }} />
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', width: 16, height: 260 * raios, borderRadius: 8, background: cor.laranja,
                transform: `rotate(${i * 30 + raios * 45}deg) translateY(${-150 * raios}px)`, opacity: raios,
              }}
            />
          ))}
          <Moldura secao={ep} tinta={cor.papel} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ background: cor.laranja }}>
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${zoom})` }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ font: `400 64px ${serifa}`, fontStyle: 'italic', color: cor.terminal, opacity: subtitulo }}>{ep}</div>
              <Bate texto="APRENDE" inicio={CORTE} de="direita" tamanho={136} tinta={cor.terminal} />
              <Bate texto="O ÓBVIO" inicio={CORTE + 8} de="esquerda" tamanho={136} tinta={cor.terminal} />
              <div style={{ marginTop: 30, maxWidth: 860, textAlign: 'center', font: `400 76px/1.05 ${serifa}`, fontStyle: 'italic', color: cor.papel, opacity: subtitulo, transform: `translateY(${(1 - subtitulo) * 30}px)` }}>
                {titulo}
              </div>
            </div>
          </AbsoluteFill>
          <Moldura secao={ep} tinta={cor.terminal} />
        </AbsoluteFill>
      )}
      {/* painel limão subindo: transição para o exagero */}
      <AbsoluteFill style={{ background: LIMA, transform: `translateY(${(1 - saida) * 100}%)` }} />
      <Som em={2} nome="pop" volume={0.8} />
      <Som em={16} nome="whoosh" />
      <Som em={CORTE} nome="impacto" />
      <Som em={CORTE + 8} nome="impacto" />
      <Som em={58} nome="tic" volume={0.7} />
      <Som em={126} nome="whoosh" />
    </AbsoluteFill>
  );
};

// ---------- 2. exagero (105 quadros) ----------

const FAIXAS = ['DIFÍCIL? ', '47 PASSOS. ', 'DOCUMENTAÇÃO. ', 'ERRO. ', 'TUTORIAL DE 3H. ', 'DIFÍCIL? ', '47 PASSOS. '];

const Exagero: React.FC = () => {
  const frame = useCurrentFrame();
  const passo = Math.min(47, 1 + Math.floor(frame / 2));
  const erro = Math.floor(frame / 8) % 2 === 0;
  const saida = interpolate(frame, [95, 105], [1, 1.25], limitar);
  return (
    <AbsoluteFill style={{ background: LIMA, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${saida}) rotate(-4deg)`, justifyContent: 'center', gap: 6 }}>
        {FAIXAS.map((faixa, i) => {
          const direcao = i % 2 ? 1 : -1;
          const vazado = i % 2 === 1;
          return (
            <div
              key={i}
              style={{
                font: `900 170px/1 ${larga}`, fontStretch: '125%', whiteSpace: 'nowrap', marginLeft: -400,
                transform: `translateX(${direcao * ((frame * 9 + i * 300) % 900)}px)`,
                color: vazado ? 'transparent' : cor.terminal, WebkitTextStroke: vazado ? `3px ${cor.terminal}` : undefined,
              }}
            >
              {faixa.repeat(6)}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: cor.terminal, borderRadius: 24, padding: '40px 56px', font: `700 64px ${mono}`, color: cor.papel, textAlign: 'center' }}>
          passo <span style={{ color: cor.laranja }}>{String(passo).padStart(2, '0')}</span> de 47
          <div style={{ font: `400 40px ${mono}`, color: cor.vermelho, marginTop: 14, opacity: erro ? 1 : 0.25 }}>✗ erro: permission denied</div>
        </div>
      </AbsoluteFill>
      <Moldura secao="o jeito difícil" tinta={cor.terminal} />
      {Array.from({ length: 12 }, (_, i) => <Som key={i} em={i * 8} nome="tic" volume={0.5} />)}
    </AbsoluteFill>
  );
};

// ---------- 3. virada (45 quadros) ----------

const Virada: React.FC = () => {
  const frame = useCurrentFrame();
  const letras = ['.', '.', '.', 'o', 'u', '.'];
  return (
    <AbsoluteFill style={{ background: cor.terminal, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ font: `400 300px ${serifa}`, fontStyle: 'italic', color: cor.papel }}>
        {letras.map((l, i) => (
          <span key={i} style={{ opacity: frame >= 10 + i * 4 ? 1 : 0, color: i === letras.length - 1 ? cor.laranja : undefined }}>{l}</span>
        ))}
      </div>
      <Moldura secao="..." tinta={cor.papel} />
      {letras.map((_, i) => <Som key={i} em={10 + i * 4} nome="tic" volume={0.6} />)}
    </AbsoluteFill>
  );
};

// ---------- 4. o óbvio (180 quadros): aqui entra a gravação real ----------

const Obvio: React.FC = () => {
  const frame = useCurrentFrame();
  const pedido = 'instala essa skill pra mim e me manda o link';
  const digitados = Math.max(0, Math.min(pedido.length, Math.floor((frame - 12) * 1.2)));
  const linha = (inicio: number, conteudo: React.ReactNode, tinta: string) =>
    frame >= inicio && <div style={{ color: tinta, marginTop: 18 }}>{conteudo}</div>;
  return (
    <AbsoluteFill style={{ background: cor.terminal, alignItems: 'center', justifyContent: 'center', padding: 70 }}>
      <div style={{ position: 'absolute', top: 140, font: `400 26px ${mono}`, color: cor.laranja, border: `2px dashed ${cor.laranja}`, borderRadius: 999, padding: '10px 26px' }}>
        aqui entra a sua gravação real ↓
      </div>
      <div style={{ width: '100%', background: cor.grafite, borderRadius: 24, border: `1px solid ${cor.borda}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14, padding: '24px 28px', background: cor.barra }}>
          {[cor.vermelho, cor.amarelo, cor.verde].map((c) => <i key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, display: 'block' }} />)}
        </div>
        <div style={{ padding: '40px 44px', font: `400 38px/1.5 ${mono}`, color: cor.papel, minHeight: 620 }}>
          <div><span style={{ color: cor.laranja }}>&gt; </span>{pedido.slice(0, digitados)}{digitados < pedido.length && <span style={{ color: cor.laranja }}>_</span>}</div>
          {linha(75, '● instalando a skill…', cor.cinza)}
          {linha(100, '✓ skill instalada', cor.verde)}
          {linha(116, <>✓ pronto: <span style={{ textDecoration: 'underline' }}>github.com/…/skill</span></>, cor.verde)}
        </div>
      </div>
      <Moldura secao="o óbvio" tinta={cor.papel} />
      {Array.from({ length: Math.ceil(pedido.length / 2) }, (_, i) => <Som key={i} em={12 + (i * 2) / 1.2} nome={`tecla-${(i % 3) + 1}`} volume={0.8} />)}
      <Som em={100} nome="pop" />
      <Som em={116} nome="pop" />
      <Som em={124} nome="acorde" volume={0.9} />
    </AbsoluteFill>
  );
};

// ---------- 5. moral (105 quadros) ----------

const Moral: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frase = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  const traco = interpolate(frame, [38, 54], [1, 0], limitar);
  return (
    <AbsoluteFill style={{ background: CREME, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <Bate texto="APRENDE O ÓBVIO:" inicio={4} de="esquerda" tamanho={64} tinta={cor.terminal} />
        <div style={{ font: `400 150px/1 ${serifa}`, fontStyle: 'italic', color: cor.terminal, textAlign: 'center', opacity: frase, transform: `translateY(${(1 - frase) * 40}px)` }}>
          antes de sofrer,
          <div style={{ position: 'relative', color: cor.laranja, marginTop: 10 }}>
            pede.
            <svg viewBox="0 0 400 40" width={400} height={40} style={{ position: 'absolute', left: '50%', bottom: -30, transform: 'translateX(-50%)' }}>
              <path d="M10 25 C 110 5, 250 5, 390 22" fill="none" stroke={cor.laranja} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={traco} />
            </svg>
          </div>
        </div>
      </div>
      <Moldura secao="a moral" tinta={cor.terminal} />
      <Som em={4} nome="impacto" />
      <Som em={38} nome="acorde" volume={0.9} />
    </AbsoluteFill>
  );
};

// ---------- episódio de demonstração ----------

export const CENAS = [
  { nome: 'abertura', duracao: 150 },
  { nome: 'exagero', duracao: 105 },
  { nome: 'virada', duracao: 45 },
  { nome: 'obvio', duracao: 180 },
  { nome: 'moral', duracao: 105 },
  { nome: 'fechamento', duracao: 150 },
] as const;
export const DURACAO_DEMO = CENAS.reduce((total, c) => total + c.duracao, 0);

// início de cada cena, em quadros
const inicioDa = (nome: (typeof CENAS)[number]['nome']) => {
  let t = 0;
  for (const cena of CENAS) {
    if (cena.nome === nome) return t;
    t += cena.duracao;
  }
  return t;
};

// batida de fundo: entra na abertura, some na virada (silêncio dramático), volta no óbvio e sai no fim
const volumeDaBatida = (f: number) => {
  const virada = inicioDa('virada');
  const obvio = inicioDa('obvio');
  return interpolate(
    f,
    [0, 34, virada - 6, virada, obvio, obvio + 10, DURACAO_DEMO - 20, DURACAO_DEMO],
    [0, 0.9, 0.9, 0, 0, 0.65, 0.65, 0],
    limitar,
  );
};

export const AprendeOObvio: React.FC<Episodio> = (ep) => {
  let inicio = 0;
  const componentes: Record<(typeof CENAS)[number]['nome'], React.ReactNode> = {
    abertura: <Abertura {...ep} />, exagero: <Exagero />, virada: <Virada />, obvio: <Obvio />, moral: <Moral />, fechamento: <Fechamento />,
  };
  return (
    <AbsoluteFill style={{ background: cor.terminal }}>
      <Audio src={staticFile('sons/batida.wav')} loop volume={volumeDaBatida} />
      {CENAS.map((cena) => {
        const sequencia = (
          <Sequence key={cena.nome} from={inicio} durationInFrames={cena.duracao}>
            {componentes[cena.nome]}
          </Sequence>
        );
        inicio += cena.duracao;
        return sequencia;
      })}
    </AbsoluteFill>
  );
};
