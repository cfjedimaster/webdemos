class WcOne extends HTMLElement {

    constructor() {
        super();
	}

	connectedCallback() {
		this.innerHTML = '<b>This is WC One</b>';
	}

}

customElements.define('wc-one', WcOne);
