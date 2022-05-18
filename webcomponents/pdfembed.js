
class PDFEmbed extends HTMLDivElement {


    constructor() {

        super();

        const shadow = this.attachShadow({
            mode: 'open'
        });
		
//        const wrapper = document.createElement('div');

//		wrapper.id = 'temp';

		if(this.hasAttribute('url')) this.url = this.getAttribute('url');
		
		if(this.hasAttribute('key')) this.key = this.getAttribute('key');

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

        const style = document.createElement('style');
        style.textContent = `
div {
	width: 500px;
	height: 500px;
}
    `;
        shadow.appendChild(style);


        //shadow.appendChild(wrapper);

	}

	loadPDF() {
		console.log('loadPDF', this.url, this.key);
		var adobeDCView = new AdobeDC.View({clientId: this.key, divId: "temp"});
		adobeDCView.previewFile({
			content:{location: {url: "https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea%20Brochure.pdf"}},
			metaData:{fileName: "Bodea Brochure.pdf"}
		}, {embedMode: "SIZED_CONTAINER"});	

	}

	connectedCallback() {
		console.log('connected callback');

		// todo, only add once
		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.src='https://documentcloud.adobe.com/view-sdk/main.js';
		document.head.appendChild(script);

		if(window.AdobeDC) this.loadPDF();
		else document.addEventListener('adobe_dc_view_sdk.ready', () => this.loadPDF());
		
	}

}

// Define the new element
customElements.define('pdf-embed', PDFEmbed, { extends:'div' });