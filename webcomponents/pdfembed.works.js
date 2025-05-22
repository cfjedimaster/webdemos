 import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

class PDFEmbed extends HTMLElement {


    constructor() {

        super();

		this.divid = uuidv4();

        const wrapper = document.createElement('div');
		wrapper.id = this.divid;

		if(this.hasAttribute('url')) this.url = this.getAttribute('url');		
		if(this.hasAttribute('key')) this.key = this.getAttribute('key');

		if(this.hasAttribute('width')) this.width = this.getAttribute('width');
		else this.width = '500px';

		if(this.hasAttribute('height')) this.height = this.getAttribute('height');
		else this.height = '500px';

		// if no url, safe to just return?
		if(!this.url) {
			console.error('pdf-embed: No url attribute passed.');
			return;
		}

		// Ditto for key
		if(!this.key) {
			console.error('pdf-embed: No key attribute passed.');
			return;
		}

		this.name = this.url.split('/').pop();

		wrapper.style = `width: ${this.width}; height: ${this.height}`;
		this.parentNode.insertBefore(wrapper, this.nextSibling);

	}

	loadPDF() {
		console.log('loadPDF', this.url, this.key);
		var adobeDCView = new AdobeDC.View({clientId: this.key, divId: this.divid });
		adobeDCView.previewFile({
			content:{location: {url: this.url }},
			metaData:{fileName: this.name}
		}, {embedMode: "SIZED_CONTAINER"});	

	}

	connectedCallback() {
		console.log('connected callback');

		// todo, only add once
		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.src='https://documentservices.adobe.com/view-sdk/viewer.js';
		document.head.appendChild(script);

		if(window.AdobeDC) this.loadPDF();
		else document.addEventListener('adobe_dc_view_sdk.ready', () => this.loadPDF());
		
	}

}

customElements.define('pdf-embed', PDFEmbed);