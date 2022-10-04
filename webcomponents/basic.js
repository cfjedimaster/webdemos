
class ApplesoftBasic extends HTMLElement {

    constructor() {

        super();

        const shadow = this.attachShadow({
            mode: 'open'
        });
		
        const wrapper = document.createElement('div');
        shadow.appendChild(wrapper);		
	}	

	connectedCallback() {

		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.src='./applesoftbasic.js';
		document.head.appendChild(script);

		let interval = setInterval(() => {
			if(window.basic) {
				clearInterval(interval);
				let result = this.compile(this.textContent);
				let mydiv = this.shadowRoot.querySelector('div');
				mydiv.innerHTML = result;
			} 
		}, 250);
	}

	compile(input) {

		let result = '';
		let program = basic.compile(input);

		program.init({
			tty: {
				getCursorPosition: function() { return { x: 0, y: 0 }; },
				setCursorPosition: function() { },
				getScreenSize: function() { return { width: 80, height: 24 }; },
				writeChar: function(ch) { 
					//console.log('writeChar called with: '+ch);
					result += ch;
				},
				writeString: function(string) { 
					//console.log('writeString called with: '+string);
					result += string+'\n';
				},
				readChar: function(callback) {
					//callback(host.console.getc());
					callback('');
				},
				readLine: function(callback, prompt) {
					//host.console.puts(prompt);
					//callback(host.console.gets().replace(/[\r\n]*/, ''));
					callback('');
				}
			}
		});

		let driver = function() {
			var state;
			do {
				try {
					state = program.step(driver);
				} catch(e) {
					console.log('ERROR!',e);
					return {
						error:e
					}
				}
				// may throw basic.RuntimeError
			} while (state === basic.STATE_RUNNING);
		}
		driver(); // step until done or blocked

		return result;

	}

}

customElements.define('applesoft-basic', ApplesoftBasic);