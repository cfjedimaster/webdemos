const fileNameEl = document.getElementById('file-name');
const toggleBtn = document.getElementById('toggle-btn');
const openBtn = document.getElementById('open-btn');
const emptyOpenBtn = document.getElementById('empty-open-btn');
const emptyState = document.getElementById('empty-state');
const renderedEl = document.getElementById('rendered');
const sourceEl = document.getElementById('source');

let showingSource = false;
let rawContent = '';

function renderMarkdown(content) {
  rawContent = content;
  renderedEl.innerHTML = marked.parse(content);
  sourceEl.textContent = content;

  emptyState.style.display = 'none';
  renderedEl.style.display = 'block';
  sourceEl.style.display = 'none';
  toggleBtn.style.display = 'inline-block';
  showingSource = false;
  toggleBtn.textContent = 'View Source';
}

toggleBtn.addEventListener('click', () => {
  showingSource = !showingSource;
  if (showingSource) {
    renderedEl.style.display = 'none';
    sourceEl.style.display = 'block';
    toggleBtn.textContent = 'View Rendered';
  } else {
    renderedEl.style.display = 'block';
    sourceEl.style.display = 'none';
    toggleBtn.textContent = 'View Source';
  }
});

openBtn.addEventListener('click', () => window.mdviewer.openFileDialog());
emptyOpenBtn.addEventListener('click', () => window.mdviewer.openFileDialog());

window.mdviewer.onFileOpened(({ fileName, content }) => {
  fileNameEl.textContent = fileName;
  renderMarkdown(content);
});
