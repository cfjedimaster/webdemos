(function () {
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        display: block;
        margin: 0 1rem 0.5rem;
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 242, 248, 0.98) 100%);
        border: 2px solid var(--pink-200, #fbcfe8);
        border-radius: 1rem;
        box-shadow: 0 4px 14px rgba(236, 72, 153, 0.25), 0 0 0 1px rgba(236, 72, 153, 0.08);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      :host(:hover) {
        transform: translateY(-2px);
        box-shadow: 0 0 20px rgba(255, 182, 193, 0.4), 0 6px 20px rgba(236, 72, 153, 0.2);
      }
      .post-card-inner {
        display: flex;
        gap: 0.5rem;
        padding: 0.65rem 0.85rem;
      }
      .post-avatar {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f9a8d4, #f472b6);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
        border: 2px solid #fbcfe8;
      }
      .post-avatar-emoji {
        font-size: 1.4rem;
        line-height: 1;
        filter: hue-rotate(var(--avatar-hue, 0deg)) saturate(1.12);
      }
      .post-body {
        flex: 1;
        min-width: 0;
      }
      .post-header {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 0.25rem 0.4rem;
        margin-bottom: 0.15rem;
      }
      .post-display-name {
        font-weight: 800;
        color: #9d174d;
        font-size: 0.9rem;
      }
      .post-handle {
        color: #ec4899;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .post-time {
        color: #f472b6;
        font-size: 0.8rem;
        margin-left: auto;
        font-weight: 600;
      }
      .post-content {
        font-size: 0.9rem;
        line-height: 1.4;
        color: #831843;
        white-space: normal;
        word-break: break-word;
        padding: 10px 0;
      }
      .post-content::slotted(*) {
        margin: 0;
      }
      .post-actions {
        display: flex;
        gap: 1rem;
        margin-top: 0.4rem;
        padding-top: 0.35rem;
        border-top: 1px solid #fce7f3;
      }
      .post-actions span {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.8rem;
        color: #ec4899;
        font-weight: 600;
      }
      .post-actions span::before {
        font-size: 1rem;
      }
      .post-actions .replies::before { content: '💬'; }
      .post-actions .reposts::before { content: '🔁'; }
      .post-actions .likes::before { content: '❤️'; }
    </style>
    <div class="post-card-inner">
      <div class="post-avatar">
        <span class="post-avatar-emoji" id="avatar"></span>
      </div>
      <div class="post-body">
        <div class="post-header">
          <span class="post-display-name" id="displayName"></span>
          <span class="post-handle" id="handle"></span>
          <time class="post-time" id="time" datetime=""></time>
        </div>
        <div class="post-content">
          <slot></slot>
        </div>
        <div class="post-actions">
          <span class="replies">0</span>
          <span class="reposts">0</span>
          <span class="likes">0</span>
        </div>
      </div>
    </div>
  `;

  function formatPostDate(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    let h = date.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const hh = String(h).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const sec = String(date.getSeconds()).padStart(2, '0');

    return `${y}/${m}/${d} ${hh}:${min}:${sec} ${ampm}`;
  }

  customElements.define('post-card', class PostCard extends HTMLElement {
    static get observedAttributes() {
      return ['avatar', 'avatar-hue', 'display-name', 'handle', 'datetime'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
      this._update();
    }

    attributeChangedCallback() {
      if (this.shadowRoot && this.shadowRoot.childNodes.length) {
        this._update();
      }
    }

    _update() {
      var avatarEl = this.shadowRoot.getElementById('avatar');
      var displayNameEl = this.shadowRoot.getElementById('displayName');
      var handleEl = this.shadowRoot.getElementById('handle');
      var timeEl = this.shadowRoot.getElementById('time');

      if (avatarEl) {
        avatarEl.textContent = this.getAttribute('avatar') || '🐱';
      }
      var hue = this.getAttribute('avatar-hue');
      if (hue != null && hue !== '') {
        this.style.setProperty('--avatar-hue', /deg$/i.test(hue) ? hue : hue + 'deg');
      } else {
        this.style.removeProperty('--avatar-hue');
      }
      if (displayNameEl) {
        displayNameEl.textContent = this.getAttribute('display-name') || '';
      }
      if (handleEl) {
        var handle = this.getAttribute('handle') || '';
        handleEl.textContent = handle ? (handle.startsWith('@') ? handle : '@' + handle) : '';
      }
      if (timeEl) {
        var dt = this.getAttribute('datetime') || '';
        timeEl.setAttribute('datetime', dt);
        timeEl.textContent = formatPostDate(dt);
      }
    }
  });
})();
