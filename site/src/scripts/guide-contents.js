const article = document.querySelector('[data-guide-article]');
const contents = document.querySelector('[data-guide-contents]');
if (article && contents) {
  const list = contents.querySelector('ol');
  const headings = [...article.querySelectorAll('h2')].filter(h => !h.closest('.more'));
  headings.forEach((heading, i) => {
    if (!heading.id) heading.id = `guide-section-${i + 1}`;
    const link = document.createElement('a');
    link.href = `#${heading.id}`; link.textContent = heading.textContent;
    const item = document.createElement('li'); item.append(link); list.append(item);
  });
  contents.hidden = !headings.length;
}
