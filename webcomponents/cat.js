class PlaceCat extends HTMLElement {

    constructor() {

        super();

        const shadow = this.attachShadow({
            mode: 'open'
        });
		
        const wrapper = document.createElement('div');

		let width = 500;
		let height = 500;

		if(this.hasAttribute('width')) width = this.getAttribute('width');
		if(this.hasAttribute('height')) height = this.getAttribute('height');

		const img = document.createElement('img');
		img.setAttribute('src', `https://placekitten.com/${width}/${height}`);
		wrapper.appendChild(img);

        shadow.appendChild(wrapper);

	}

}

customElements.define('place-cat', PlaceCat);