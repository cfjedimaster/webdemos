 import { marked } from 'https://jspm.dev/marked';

class MarkdownRender extends HTMLElement {

    constructor() {

        super();

        const shadow = this.attachShadow({
            mode: 'closed'
        });
		
        const wrapper = document.createElement('div');
		wrapper.innerHTML = marked.parse(this.textContent);
        shadow.appendChild(wrapper);
	}	

}

customElements.define('markdown-render', MarkdownRender);