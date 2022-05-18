class PDFEmbed extends HTMLElement {

    constructor() {

        super();

        const shadow = this.attachShadow({
            mode: 'open'
        });
		
        const wrapper = document.createElement('div');

		let url;
		if(this.hasAttribute('url')) url = this.getAttribute('url');
		
		let key;
		if(this.hasAttribute('key')) key = this.getAttribute('key');

		// if no url, safe to just return?
		if(!url) {
			console.error('pdf-embed: No url attribute passed.');
			return;
		}

		// Ditto for key
		if(!key) {
			console.error('pdf-embed: No key attribute passed.');
			return;
		}

        const style = document.createElement('style');
        style.textContent = `
div {
	width: 500px;
	height: 500px;
	background-color: red;
}
    `;
        shadow.appendChild(style);

		const script = document.createElement('script');
		script.type = 'text/javascript';

		script.src='https://documentcloud.adobe.com/view-sdk/main.js';
		// could we possibly remember that we've added it to the parent dom once and not repeat this?
		wrapper.appendChild(script);

        shadow.appendChild(wrapper);

	}

	connectedCallback() {
		console.log('connected callback');
		console.log('window.AdobeDC', window.AdobeDC);
		document.addEventListener('adobe_dc_view_sdk.ready', () => {
			console.log('loaded?');
		});
	}
}

// Define the new element
customElements.define('pdf-embed', PDFEmbed);