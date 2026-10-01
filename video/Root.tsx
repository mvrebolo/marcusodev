import React from 'react';
import { Composition } from 'remotion';
import { SlideAnimado, duracaoDoSlide } from './componentes';
import { ALTURA, FPS, LARGURA } from './marca';
import { posts } from './posts';
import { DURACAO_VINHETA, Fechamento, Intro } from './vinhetas';

const FORMATOS = [
  { nome: '9x16', width: 1080, height: 1920 },
  { nome: '16x9', width: 1920, height: 1080 },
];

export const Root: React.FC = () => (
  <>
    {/* carrosséis animados: uma composição por slide, "<post>-01", "<post>-02", ... */}
    {posts.flatMap((post) =>
      post.slides.map((slide, i) => (
        <Composition
          key={`${post.id}-${i}`}
          id={`${post.id}-${String(i + 1).padStart(2, '0')}`}
          component={SlideAnimado}
          defaultProps={{ slide, numero: i + 1, total: post.slides.length }}
          durationInFrames={duracaoDoSlide(slide)}
          fps={FPS}
          width={LARGURA}
          height={ALTURA}
        />
      )),
    )}
    {/* vinhetas da marca: "intro-9x16", "fechamento-16x9", ... */}
    {FORMATOS.flatMap(({ nome, width, height }) => [
      <Composition key={`intro-${nome}`} id={`intro-${nome}`} component={Intro} durationInFrames={DURACAO_VINHETA} fps={FPS} width={width} height={height} />,
      <Composition key={`fechamento-${nome}`} id={`fechamento-${nome}`} component={Fechamento} durationInFrames={DURACAO_VINHETA} fps={FPS} width={width} height={height} />,
    ])}
  </>
);
