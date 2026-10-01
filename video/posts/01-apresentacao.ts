import type { Post } from '../tipos';

const post: Post = {
  id: '01-apresentacao',
  slides: [
    { tipo: 'capa', etiqueta: 'Comece aqui', titulo: 'Aqui você aprende a construir projetos *reais* com IA', comentario: 'deixa eu me apresentar 👋' },
    {
      tipo: 'terminal',
      titulo: 'Prazer, sou o Marcus',
      barra: '~/marcus',
      linhas: [
        { t: 'whoami', tipo: 'prompt' },
        { t: 'marcusodev', tipo: 'saida' },
        { t: '// projetos reais com IA', tipo: 'comentario' },
      ],
      texto: 'Dev apaixonado por programação e *IA*.',
    },
    { tipo: 'texto', titulo: 'A IA mudou *completamente* como eu programo', apoio: 'E dá para mudar o seu jeito também.' },
    {
      tipo: 'comparacao',
      ruim: { titulo: 'O que eu vejo', texto: 'IA usada só para gerar trecho de código solto. O projeto nunca sai do papel.' },
      bom: { titulo: 'O que eu mostro', texto: 'Projeto completo, do zero até estar no ar.' },
    },
    {
      tipo: 'lista',
      titulo: 'Aqui você vai ver',
      itens: ['Projetos reais, do zero ao ar', 'Claude Code e LLMs na prática', 'Dicas rápidas de programação', 'Bastidores, inclusive os erros'],
    },
    {
      tipo: 'texto',
      etiqueta: 'Código aberto',
      titulo: 'Projetos com o código no *GitHub*',
      apoio: 'Quando um projeto fica pronto, ele vem pra cá com o repositório aberto.',
    },
    { tipo: 'cta', titulo: 'Qual projeto você quer tirar do papel?', texto: 'Me segue e comenta aqui embaixo 👇', botao: 'Bora codar' },
  ],
};

export default post;
