class WcOne extends HTMLElement {

    constructor() {
        super();
		this.attachShadow({mode:'open'});
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = '<b>This is SR WC</b>';
	}

}

customElements.define('wc-one', WcOne);
