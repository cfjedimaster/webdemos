class AudioWaveform extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const audioSelector = this.getAttribute('audio');
        if (!audioSelector) {
            this.renderError('No audio selector provided');
            return;
        }

        const audioElement = document.querySelector(audioSelector);
        if (!audioElement) {
            this.renderError(`Audio element not found: ${audioSelector}`);
            return;
        }

        // Wait for src to be available if needed, or just try to generate
        if (audioElement.readyState >= 1 || audioElement.src) {
            this.generate(audioElement);
        } else {
            // If src is set later or metadata loads
            audioElement.addEventListener('loadedmetadata', () => this.generate(audioElement), { once: true });
        }
    }

    async generate(audioElement) {
        this.renderLoading();

        try {
            const src = audioElement.currentSrc || audioElement.src;
            if (!src) throw new Error('Audio element has no source');

            const response = await fetch(src);
            const arrayBuffer = await response.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            this.renderWaveform(audioBuffer);
        } catch (error) {
            this.renderError(error.message);
        }
    }

    renderLoading() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 200px;
          background-color: #fafafa;
          border: 1px solid #eee;
          border-radius: 8px;
          overflow: hidden;
          font-family: system-ui, sans-serif;
        }
        .message {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          font-style: italic;
        }
      </style>
      <div class="message">Generating waveform...</div>
    `;
    }

    renderError(msg) {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 200px;
          background-color: #fafafa;
          border: 1px solid #eee;
          border-radius: 8px;
          overflow: hidden;
          font-family: system-ui, sans-serif;
        }
        .error {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #e74c3c;
          padding: 1rem;
          text-align: center;
        }
      </style>
      <div class="error">Error: ${msg}</div>
    `;
    }

    renderWaveform(audioBuffer) {
        const samples = 200;
        const rawData = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(rawData.length / samples);
        const points = [];

        for (let i = 0; i < samples; i++) {
            const start = i * blockSize;
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[start + j]);
            }
            points.push(sum / blockSize);
        }

        const maxPoint = Math.max(...points);
        const normalizedPoints = points.map(p => p / maxPoint);

        // We can't easily get clientWidth if we are hidden or before paint, 
        // but we can use 100% width SVG with viewBox.
        // Let's assume a coordinate system of 0..samples for X, and 0..100 for Y.

        const width = samples * 4; // Arbitrary width unit
        const height = 100;
        const step = width / samples;

        let topPath = `M 0 ${height / 2}`;

        normalizedPoints.forEach((val, index) => {
            const x = index * step;
            const amplitude = (val * height * 0.9) / 2;
            topPath += ` L ${x} ${height / 2 - amplitude}`;
        });

        for (let i = samples - 1; i >= 0; i--) {
            const val = normalizedPoints[i];
            const x = i * step;
            const amplitude = (val * height * 0.9) / 2;
            topPath += ` L ${x} ${height / 2 + amplitude}`;
        }

        topPath += ` Z`;

        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 200px;
          background-color: #fafafa;
          border: 1px solid #eee;
          border-radius: 8px;
          overflow: hidden;
        }
        svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        path {
          fill: var(--waveform-color, #4a90e2);
        }
      </style>
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <path d="${topPath}" stroke="none"></path>
      </svg>
    `;
    }
}

customElements.define('audio-waveform', AudioWaveform);
