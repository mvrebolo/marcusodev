import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { cor, mono, sans } from './marca';
import type { Linha, Slide } from './tipos';

// ---------- ritmo ----------

const INICIO = 6; // quadro em que o título começa a entrar
const INTERVALO_PALAVRA = 3; // quadros entre uma palavra e a próxima
const VELOCIDADE_DIGITACAO = 1.4; // caracteres por quadro no terminal
const PAUSA_LINHA = 6; // quadros entre linhas do terminal
const DURACAO_MINIMA = 150; // 5 s a 30 fps
const RESPIRO_FINAL = 60; // 2 s parado no fim, para dar tempo de ler

// ---------- sons (gerados por scripts/gerar-sons.mjs) ----------

type NomeDoSom = 'tecla-1' | 'tecla-2' | 'tecla-3' | 'tic' | 'pop' | 'acorde';

const Som: React.FC<{ em: number; nome: NomeDoSom; volume?: number }> = ({ em, nome, volume = 1 }) => (
  <Sequence from={Math.round(em)} layout="none">
    <Audio src={staticFile(`sons/${nome}.wav`)} volume={volume} />
  </Sequence>
);

// ---------- texto com *destaque* ----------

type Palavra = { p: string; destaque: boolean };

function palavras(texto: string): Palavra[] {
  return texto.split('*').flatMap((trecho, i) =>
    trecho.split(/\s+/).filter(Boolean).map((p) => ({ p, destaque: i % 2 === 1 })),
  );
}

const fimDoTitulo = (titulo: string, inicio = INICIO) => inicio + palavras(titulo).length * INTERVALO_PALAVRA + 12;

function useEntrada(inicio: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - inicio, fps, config: { damping: 200 } });
}

const Cursor: React.FC<{ aparece: number; colado?: boolean }> = ({ aparece, colado }) => {
  const frame = useCurrentFrame();
  if (frame < aparece) return null;
  return (
    <span style={{ color: cor.laranja, marginLeft: colado ? '-0.28em' : 0, opacity: Math.floor((frame - aparece) / 15) % 2 ? 0 : 1 }}>_</span>
  );
};

const PalavraAnimada: React.FC<{ palavra: Palavra; inicio: number }> = ({ palavra, inicio }) => {
  const p = useEntrada(inicio);
  return (
    <span
      style={{
        display: 'inline-block',
        marginRight: '0.28em',
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
        color: palavra.destaque ? cor.laranja : undefined,
      }}
    >
      {palavra.p}
    </span>
  );
};

const Titulo: React.FC<{ texto: string; inicio?: number; tamanho?: number; cursor?: boolean; centro?: boolean }> = ({
  texto,
  inicio = INICIO,
  tamanho = 80,
  cursor,
  centro,
}) => {
  const lista = palavras(texto);
  return (
    <h1
      style={{
        margin: 0,
        font: `700 ${tamanho}px/1.12 ${mono}`,
        letterSpacing: -2,
        color: cor.papel,
        textAlign: centro ? 'center' : 'left',
      }}
    >
      {lista.map((palavra, i) => (
        <React.Fragment key={i}>
          <PalavraAnimada palavra={palavra} inicio={inicio + i * INTERVALO_PALAVRA} />
          <Som em={inicio + i * INTERVALO_PALAVRA} nome="tic" volume={1} />
        </React.Fragment>
      ))}
      {cursor && <Cursor aparece={inicio + lista.length * INTERVALO_PALAVRA} colado />}
    </h1>
  );
};

const Surge: React.FC<{ inicio: number; de?: 'baixo' | 'esquerda' | 'escala'; som?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({
  inicio,
  de = 'baixo',
  som,
  children,
  style,
}) => {
  const p = useEntrada(inicio);
  const transform =
    de === 'esquerda' ? `translateX(${(1 - p) * -60}px)` : de === 'escala' ? `scale(${0.9 + p * 0.1})` : `translateY(${(1 - p) * 30}px)`;
  return (
    <div style={{ opacity: p, transform, ...style }}>
      {som && <Som em={Math.max(0, inicio)} nome="pop" volume={1} />}
      {children}
    </div>
  );
};

const Texto: React.FC<{ texto: string; cinza?: boolean; tamanho?: number; centro?: boolean }> = ({ texto, cinza, tamanho = 44, centro }) => (
  <p style={{ margin: 0, font: `400 ${tamanho}px/1.45 ${sans}`, color: cinza ? cor.cinza : cor.papel, textAlign: centro ? 'center' : 'left' }}>
    {texto.split('*').map((trecho, i) => (
      <span key={i} style={{ color: i % 2 ? cor.laranja : undefined }}>
        {trecho}
      </span>
    ))}
  </p>
);

const Comentario: React.FC<{ texto: string }> = ({ texto }) => (
  <p style={{ margin: 0, font: `400 36px/1.4 ${mono}`, color: cor.cinza }}>// {texto}</p>
);

const Etiqueta: React.FC<{ texto: string }> = ({ texto }) => (
  <Surge inicio={0} de="esquerda" style={{ alignSelf: 'flex-start' }}>
    <span style={{ display: 'inline-block', font: `400 28px ${mono}`, color: cor.laranja, border: `2px solid ${cor.laranja}`, borderRadius: 999, padding: '10px 28px' }}>
      {texto}
    </span>
  </Surge>
);

// ---------- terminal com digitação ----------

function tempoDasLinhas(linhas: Linha[], inicio: number) {
  let t = inicio;
  return linhas.map((linha) => {
    const digitada = linha.tipo !== 'ok' && linha.tipo !== 'erro';
    const comeco = t;
    t += (digitada ? linha.t.length / VELOCIDADE_DIGITACAO : 4) + PAUSA_LINHA;
    return { comeco, digitada };
  });
}

const fimDoTerminal = (linhas: Linha[], inicio: number) => {
  const tempos = tempoDasLinhas(linhas, inicio);
  const ultima = linhas.length - 1;
  return tempos[ultima].comeco + linhas[ultima].t.length / VELOCIDADE_DIGITACAO + 10;
};

const Terminal: React.FC<{ linhas: Linha[]; barra?: string; inicio: number }> = ({ linhas, barra, inicio }) => {
  const frame = useCurrentFrame();
  const tempos = tempoDasLinhas(linhas, inicio);
  const corDaLinha = { comentario: cor.cinza, ok: cor.verde, erro: cor.vermelho, prompt: cor.papel } as const;
  const atual = tempos.findLastIndex((t) => frame >= t.comeco);

  // um clique de tecla a cada 2 caracteres digitados; saídas (✓ / ✗) fazem "pop"
  const sons = linhas.flatMap((linha, i) => {
    const { comeco, digitada } = tempos[i];
    if (!digitada) return [<Som key={`s${i}`} em={comeco} nome="pop" volume={1} />];
    return Array.from({ length: Math.ceil(linha.t.length / 2) }, (_, k) => (
      <Som key={`s${i}-${k}`} em={comeco + (k * 2) / VELOCIDADE_DIGITACAO} nome={(['tecla-1', 'tecla-2', 'tecla-3'] as const)[(i + k) % 3]} volume={1} />
    ));
  });

  return (
    <Surge inicio={inicio - 10} de="escala">
      {sons}
      <div style={{ background: cor.grafite, borderRadius: 24, overflow: 'hidden', border: `1px solid ${cor.borda}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '24px 28px', background: cor.barra }}>
          {[cor.vermelho, cor.amarelo, cor.verde].map((c) => (
            <i key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, display: 'block' }} />
          ))}
          {barra && <span style={{ marginLeft: 'auto', font: `400 22px ${mono}`, color: cor.cinza }}>{barra}</span>}
        </div>
        <div style={{ padding: '40px 44px', font: `400 36px/1.65 ${mono}`, minHeight: 1.65 * 36 * linhas.length + 80 }}>
          {linhas.map((linha, i) => {
            const { comeco, digitada } = tempos[i];
            if (frame < comeco) return null;
            const visiveis = digitada ? Math.floor((frame - comeco) * VELOCIDADE_DIGITACAO) : linha.t.length;
            const texto = linha.t.slice(0, visiveis);
            return (
              <div key={i} style={{ color: corDaLinha[linha.tipo ?? 'prompt'], whiteSpace: 'pre-wrap' }}>
                {linha.tipo === 'prompt' && <span style={{ color: cor.laranja }}>&gt; </span>}
                {texto}
                {i === atual && <Cursor aparece={comeco} />}
              </div>
            );
          })}
        </div>
      </div>
    </Surge>
  );
};

// ---------- moldura do slide ----------

const Moldura: React.FC<{ numero: number; total: number; centro?: boolean; children: React.ReactNode }> = ({ numero, total, centro, children }) => {
  const frame = useCurrentFrame();
  const ultimo = numero === total;
  const dois = (n: number) => String(n).padStart(2, '0');
  return (
    <AbsoluteFill style={{ background: cor.terminal, color: cor.papel, fontFamily: sans }}>
      {numero === 1 && (
        <div
          style={{
            position: 'absolute', right: -300, top: -300, width: 800, height: 800,
            background: 'radial-gradient(circle, rgba(217,119,87,.18), transparent 65%)',
            opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        />
      )}
      <div
        style={{
          position: 'absolute', inset: 0, padding: '140px 96px 150px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40,
          alignItems: centro ? 'center' : 'stretch', textAlign: centro ? 'center' : 'left',
        }}
      >
        {children}
      </div>
      <span style={{ position: 'absolute', top: 64, right: 80, font: `400 26px ${mono}`, color: cor.cinza }}>
        {dois(numero)}/{dois(total)}
      </span>
      <span style={{ position: 'absolute', bottom: 64, left: 80, font: `400 26px ${mono}` }}>
        <b style={{ color: cor.laranja, fontWeight: 400 }}>&gt;</b> marcusodev<Cursor aparece={0} />
      </span>
      {!ultimo && (
        <span
          style={{
            position: 'absolute', bottom: 52, right: 80, font: `400 44px ${mono}`, color: cor.laranja,
            transform: `translateX(${Math.sin(frame / 8) * 8}px)`,
          }}
        >
          →
        </span>
      )}
    </AbsoluteFill>
  );
};

const Simbolo: React.FC<{ inicio: number }> = ({ inicio }) => {
  const frame = useCurrentFrame();
  const traco = interpolate(frame, [inicio, inicio + 20], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cursor = interpolate(frame, [inicio + 15, inicio + 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <svg viewBox="0 0 512 512" width={240} height={240}>
      <rect width="512" height="512" rx="96" fill={cor.terminal} />
      <polyline
        points="136,156 236,256 136,356" fill="none" stroke={cor.laranja} strokeWidth={44}
        strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={traco}
      />
      <rect x="264" y="334" width={120 * cursor} height="44" rx="8" fill={cor.papel} />
    </svg>
  );
};

// ---------- slides ----------

export function duracaoDoSlide(slide: Slide): number {
  if (slide.tipo === 'terminal') {
    const inicio = slide.titulo ? fimDoTitulo(slide.titulo) : 16;
    return Math.max(DURACAO_MINIMA, Math.ceil(fimDoTerminal(slide.linhas, inicio) + RESPIRO_FINAL));
  }
  return DURACAO_MINIMA;
}

export const SlideAnimado: React.FC<{ slide: Slide; numero: number; total: number }> = ({ slide, numero, total }) => {
  switch (slide.tipo) {
    case 'capa': {
      const fim = fimDoTitulo(slide.titulo);
      return (
        <Moldura numero={numero} total={total}>
          {slide.etiqueta && <Etiqueta texto={slide.etiqueta} />}
          <Titulo texto={slide.titulo} tamanho={100} cursor />
          {slide.comentario && <Surge inicio={fim}><Comentario texto={slide.comentario} /></Surge>}
        </Moldura>
      );
    }
    case 'texto': {
      const fim = fimDoTitulo(slide.titulo);
      return (
        <Moldura numero={numero} total={total}>
          {slide.etiqueta && <Etiqueta texto={slide.etiqueta} />}
          <Titulo texto={slide.titulo} />
          {slide.texto && <Surge inicio={fim}><Texto texto={slide.texto} /></Surge>}
          {slide.apoio && <Surge inicio={fim + 8}><Texto texto={slide.apoio} cinza /></Surge>}
        </Moldura>
      );
    }
    case 'lista': {
      const fim = fimDoTitulo(slide.titulo);
      return (
        <Moldura numero={numero} total={total}>
          {slide.etiqueta && <Etiqueta texto={slide.etiqueta} />}
          <Titulo texto={slide.titulo} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {slide.itens.map((item, i) => (
              <Surge key={i} inicio={fim + i * 10} de="esquerda" som>
                <div style={{ display: 'flex', gap: 28, font: `400 46px/1.35 ${sans}` }}>
                  <span style={{ font: `700 46px/1.35 ${mono}`, color: cor.laranja }}>&gt;</span>
                  <Texto texto={item} tamanho={46} />
                </div>
              </Surge>
            ))}
          </div>
        </Moldura>
      );
    }
    case 'terminal': {
      const inicio = slide.titulo ? fimDoTitulo(slide.titulo) : 16;
      const fim = fimDoTerminal(slide.linhas, inicio);
      return (
        <Moldura numero={numero} total={total}>
          {slide.titulo && <Titulo texto={slide.titulo} tamanho={64} />}
          <Terminal linhas={slide.linhas} barra={slide.barra} inicio={inicio} />
          {slide.texto && <Surge inicio={fim}><Texto texto={slide.texto} /></Surge>}
        </Moldura>
      );
    }
    case 'comparacao': {
      const lado = (dados: { titulo: string; texto: string }, bom: boolean, inicio: number) => (
        <Surge inicio={inicio} de="esquerda" som>
          <div style={{ background: cor.grafite, borderRadius: 24, padding: '44px 48px', borderLeft: `8px solid ${bom ? cor.verde : cor.vermelho}` }}>
            <h3 style={{ margin: '0 0 20px', font: `700 56px ${mono}` }}>
              {dados.titulo} <span style={{ color: bom ? cor.verde : cor.vermelho }}>{bom ? '✓' : '✗'}</span>
            </h3>
            <Texto texto={dados.texto} tamanho={38} />
          </div>
        </Surge>
      );
      return (
        <Moldura numero={numero} total={total}>
          {lado(slide.ruim, false, INICIO)}
          {lado(slide.bom, true, INICIO + 30)}
        </Moldura>
      );
    }
    case 'aviso':
      return (
        <Moldura numero={numero} total={total}>
          <Surge inicio={INICIO} de="escala" som>
            <div style={{ background: cor.grafite, border: `2px solid ${cor.laranja}`, borderRadius: 24, padding: '44px 48px' }}>
              <Titulo texto={slide.titulo} tamanho={64} inicio={INICIO + 6} />
              <div style={{ height: 24 }} />
              <Surge inicio={fimDoTitulo(slide.titulo, INICIO + 6)}><Texto texto={slide.texto} /></Surge>
            </div>
          </Surge>
        </Moldura>
      );
    case 'cta': {
      const inicioTitulo = 30;
      const fim = fimDoTitulo(slide.titulo, inicioTitulo);
      return (
        <Moldura numero={numero} total={total} centro>
          <Simbolo inicio={INICIO} />
          <Titulo texto={slide.titulo} inicio={inicioTitulo} centro />
          {slide.texto && <Surge inicio={fim}><Texto texto={slide.texto} cinza centro /></Surge>}
          <Som em={fim + 10} nome="acorde" volume={1} />
          <Surge inicio={fim + 10} de="escala">
            <span style={{ display: 'inline-block', font: `700 46px ${mono}`, background: cor.laranja, color: cor.terminal, padding: '28px 56px', borderRadius: 20 }}>
              {slide.botao}
            </span>
          </Surge>
        </Moldura>
      );
    }
  }
};
