// Adiciona numeração (01/08), assinatura "> marcusodev_" e seta "→" em todos os slides.
// Use data-sem-numero no slide para esconder o número e data-sem-seta para esconder a seta.
document.querySelectorAll('.slide').forEach((slide, i, todos) => {
  const total = String(todos.length).padStart(2, '0');
  const atual = String(i + 1).padStart(2, '0');
  const ultimo = i === todos.length - 1;

  if (!slide.hasAttribute('data-sem-numero')) {
    slide.insertAdjacentHTML('beforeend', `<span class="num">${atual}/${total}</span>`);
  }
  slide.insertAdjacentHTML('beforeend', '<span class="assinatura"><b>&gt;</b> marcusodev<b>_</b></span>');
  if (!ultimo && !slide.hasAttribute('data-sem-seta')) {
    slide.insertAdjacentHTML('beforeend', '<span class="seta">→</span>');
  }
});
