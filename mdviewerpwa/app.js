document.addEventListener('DOMContentLoaded', () => {

    const fileNameEl = document.getElementById('file-name');
    const toggleBtn = document.getElementById('toggle-btn');
    const openBtn = document.getElementById('open-btn');
    const emptyOpenBtn = document.getElementById('empty-open-btn');
    const emptyState = document.getElementById('empty-state');
    const renderedEl = document.getElementById('rendered');
    const sourceEl = document.getElementById('source');
    const fileInput = document.getElementById('file-input');

    let showingSource = false;
    let rawContent = '';

    if("launchQueue" in window) {
        console.log('Launch Queue API is supported, setting up consumer');
        window.launchQueue.setConsumer(launchParams => {
            if (!launchParams.files.length) {
                return;
            }
            const fileHandle = launchParams.files[0];
            console.log('File launched:', fileHandle);
            fileHandle.getFile().then(file => {
                const reader = new FileReader();
                reader.onload = e => {
                    const content = e.target.result;
                    fileNameEl.textContent = file.name;
                    renderMarkdown(content);
                };
                reader.readAsText(file);
            }).catch(error => {
                console.error('Error reading file:', error);
            });
        });
    }

    const renderMarkdown = content => {
        rawContent = content;
        /*
        Special tweak for frontmatter. If our content starts with '---' and 
        contains '---' again, we assume it's frontmatter and wrap it in and
        swap the --- to ```.
        */
        contentToRender = content.trim();
        // also, making a copy so we can keep the View Source version working
        if (contentToRender.startsWith('---')) {
            console.log('detected frontmatter, applying special formatting');
            const parts = content.split('---');
            if (parts.length >= 3) {
                const frontmatter = parts[1];
                const rest = parts.slice(2).join('---');
                contentToRender = `\`\`\`yaml${frontmatter}\`\`\`\n\n${rest}`;
                console.log(contentToRender);
            }
        }
        renderedEl.innerHTML = marked.parse(contentToRender);
        sourceEl.textContent = content;

        emptyState.style.display = 'none';
        renderedEl.style.display = 'block';
        sourceEl.style.display = 'none';
        toggleBtn.style.display = 'inline-block';
        showingSource = false;
        toggleBtn.textContent = 'View Source';

        document.title = `MD Viewer — ${fileNameEl.textContent}`;
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

    openBtn.addEventListener('click', () => fileInput.click());
    emptyOpenBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                const content = e.target.result;
                fileNameEl.textContent = file.name;
                renderMarkdown(content);
            };
            reader.readAsText(file);
        }
    });

    /*
    window.mdviewer.onFileOpened(({ fileName, content }) => {
    fileNameEl.textContent = fileName;
    renderMarkdown(content);
    });
    */
});
