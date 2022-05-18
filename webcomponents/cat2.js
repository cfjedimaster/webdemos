class PlaceCat extends HTMLElement {

	getURL() {
		return `https://placekitten.com/${this.width}/${this.height}`
	}

    constructor() {

        super();

        const shadow = this.attachShadow({
            mode: 'open'
        });
		
        const wrapper = document.createElement('div');

		this.width = 500;
		this.height = 500;

		if(this.hasAttribute('width')) this.width = this.getAttribute('width');
		if(this.hasAttribute('height')) this.height = this.getAttribute('height');

		const img = document.createElement('img');
		img.setAttribute('src', this.getURL());
		wrapper.appendChild(img);

        shadow.appendChild(wrapper);

	}

	static get observedAttributes() { return ['width','height']; }

	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
		this.shadowRoot.querySelector('img').src = this.getURL();
	}

}

// Define the new element
customElements.define('place-cat', PlaceCat);