class VideoBGShadowComponent extends HTMLElement {
	
	constructor() {
		super();
	}
	
	connectedCallback() {
		console.log('connected like a g6');
		this.videoEl = this.querySelector('video');
		if(!this.videoEl) {
			console.warn('No <video> element found.');
			return;
		}

        console.log('src', this.videoEl.querySelector('source').src);
		// wrap the video in a new div
		this.wrapper = document.createElement('div');
		this.videoEl.parentNode.insertBefore(this.wrapper, this.videoEl);
		this.wrapper.appendChild(this.videoEl);
		this.wrapper.style.display = 'inline-block';
		this.videoEl.style.verticalAlign = 'bottom';

		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.src='https://unpkg.com/colorthief@3/dist/umd/color-thief.global.js';
		document.head.appendChild(script);
		script.onload = () => {
			this.videoEl.addEventListener('play', this.startShadow.bind(this));
			this.videoEl.addEventListener('ended', this.endShadow.bind(this));
			this.videoEl.addEventListener('pause', this.endShadow.bind(this));
	
		}
	}

	startShadow(e) {
		console.log('video play');
		let thatWrapper = this.wrapper;
		this.controller = ColorThief.observe(e.target, {
		    throttle: 200,
		    colorCount: 5,
			  onChange(palette) {
	            const [dominant] = palette;
                thatWrapper.style.setProperty('--glow-color', dominant.css());
                thatWrapper.style.boxShadow = '15px 15px 20px 8px var(--glow-color)';
		    },
		})
	}

	endShadow() {
		console.log('video play end');
		this.controller.stop();
	}

}

if(!customElements.get('video-bgshadow')) customElements.define('video-bgshadow', VideoBGShadowComponent);
