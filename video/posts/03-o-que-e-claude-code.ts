import type { Post } from '../tipos';

const post: Post = {
  id: '03-o-que-e-claude-code',
  slides: [
    { tipo: 'capa', etiqueta: 'Claude Code', titulo: 'Claude Code *não* é só mais um chat de IA', comentario: 'entenda a diferença' },
    {
      tipo: 'terminal',
      titulo: 'Chat de IA comum',
      barra: 'o ciclo infinito',
      linhas: [
        { t: 'copia o código' },
        { t: 'cola no editor' },
        { t: '✗ erro', tipo: 'erro' },
        { t: 'copia o erro' },
        { t: 'cola no chat' },
        { t: '// e repete... 🔁', tipo: 'comentario' },
      ],
    },
    {
      tipo: 'texto',
      etiqueta: 'Claude Code',
      titulo: 'Um agente que trabalha *direto no seu projeto*',
      apoio: 'Roda no terminal e também no VS Code, JetBrains, desktop e web.',
    },
    { tipo: 'lista', titulo: 'O que ele faz', itens: ['Lê e entende o seu código', 'Cria e edita arquivos', 'Roda comandos e testes', 'Faz commits no Git'] },
    {
      tipo: 'terminal',
      titulo: 'CLAUDE.md',
      barra: 'CLAUDE.md',
      linhas: [
        { t: '# Meu projeto', tipo: 'comentario' },
        { t: 'App de tarefas em Next.js' },
        { t: '// comandos', tipo: 'comentario' },
        { t: 'npm run dev · npm test' },
        { t: '// regras', tipo: 'comentario' },
        { t: 'Sempre escrever testes' },
      ],
      texto: 'Você explica o projeto uma vez, e ele *lembra em toda sessão*.',
    },
    { tipo: 'lista', etiqueta: 'Plan mode', titulo: 'Primeiro o plano, depois o código', itens: ['Ele analisa e propõe um plano', 'Você revisa e aprova', 'Só então ele executa'] },
    { tipo: 'aviso', titulo: '⚠️ Mas atenção', texto: 'Ele também erra. *Revisar o código* continua sendo o seu trabalho.' },
    { tipo: 'cta', titulo: 'Salva esse post 📌', texto: 'Essa semana vou construir um projeto do zero com ele.', botao: 'Me segue' },
  ],
};

export default post;
