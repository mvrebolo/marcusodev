// Descrição dos slides animados. Em títulos e textos, *palavras entre asteriscos* ficam em laranja.

export type Linha = { t: string; tipo?: 'prompt' | 'saida' | 'comentario' | 'ok' | 'erro' };

export type Slide =
  | { tipo: 'capa'; etiqueta?: string; titulo: string; comentario?: string }
  | { tipo: 'texto'; etiqueta?: string; titulo: string; texto?: string; apoio?: string }
  | { tipo: 'lista'; etiqueta?: string; titulo: string; itens: string[] }
  | { tipo: 'terminal'; titulo?: string; barra?: string; linhas: Linha[]; texto?: string }
  | { tipo: 'comparacao'; ruim: { titulo: string; texto: string }; bom: { titulo: string; texto: string } }
  | { tipo: 'aviso'; titulo: string; texto: string }
  | { tipo: 'cta'; titulo: string; texto?: string; botao: string };

export type Post = { id: string; slides: Slide[] };
