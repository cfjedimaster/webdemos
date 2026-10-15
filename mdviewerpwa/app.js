document.addEventListener('DOMContentLoaded', () => {

    mermaid.initialize({ startOnLoad: false });

    marked.use({
        renderer: {
            code({ text, lang }) {
                if (lang === 'mermaid') {
                    // Return a raw container that Mermaid can target later
                    return `<pre class="mermaid">${text}</pre>`;
                }
                // Fall back to default behavior for all other code languages (js, python, etc.)
                return false; 
                }
        }
    });

    const fileNameEl = document.getElementById('file-name');
    const toggleBtn = document.getElementById('toggle-btn');
    const copyBtn = document.getElementById('copy-btn');
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

    const renderMarkdown = async content => {
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
        await mermaid.run({
            querySelector: '.mermaid',
            suppressErrors: true
        });
        
        sourceEl.textContent = content;

        emptyState.style.display = 'none';
        renderedEl.style.display = 'block';
        sourceEl.style.display = 'none';
        toggleBtn.style.display = 'inline-block';
        copyBtn.style.display = 'none';
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
            copyBtn.style.display = 'inline-block';
        } else {
            renderedEl.style.display = 'block';
            sourceEl.style.display = 'none';
            toggleBtn.textContent = 'View Source';
            copyBtn.style.display = 'none';
        }
        copyBtn.textContent = 'Copy Source';
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(rawContent);
            copyBtn.textContent = 'Copied!';
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            copyBtn.textContent = 'Copy failed';
        }
        setTimeout(() => copyBtn.textContent = 'Copy Source', 2000);
    });

    document.addEventListener('keydown', e => {
        if (!showingSource) return;
        if (e.key !== 'a' || !(e.metaKey || e.ctrlKey) || e.altKey) return;
        e.preventDefault();
        const range = document.createRange();
        range.selectNodeContents(sourceEl);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
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
