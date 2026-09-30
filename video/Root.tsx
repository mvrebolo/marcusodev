import React from 'react';
import { Composition } from 'remotion';
import { SlideAnimado, duracaoDoSlide } from './componentes';
import { ALTURA, FPS, LARGURA } from './marca';
import { posts } from './posts';

// Uma composição por slide: "<post>-01", "<post>-02", ...
export const Root: React.FC = () => (
  <>
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
  </>
);
