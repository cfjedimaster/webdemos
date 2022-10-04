class InnerTest extends HTMLElement {

    constructor() {

        super();

        const shadow = this.attachShadow({
            mode: 'closed'
        });
		
        const wrapper = document.createElement('div');
		wrapper.innerText= this.textContent.split('').reverse().join('');
        shadow.appendChild(wrapper);
	}	

}

customElements.define('inner-test', InnerTest);