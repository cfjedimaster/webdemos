const CAT_AVATARS = ['😺', '😸', '🙀', '😻', '🐱', '😽', '😼', '😹'];
let session = null;
let downloadStatusEl = null;

const MAIN_FEED_HTML = `
  <h1 class="feed-title">
    <span class="sparkle">✨</span> Your feed
  </h1>
  <div id="feed"></div>
`;

async function getAvailability() {
  if (!window.LanguageModel) return 'unavailable';
  return LanguageModel.availability();
}

async function canDoIt() {
  return (await getAvailability()) !== 'unavailable';
}

function needsModelDownload(availability) {
  return availability === 'downloadable' || availability === 'downloading';
}

function setDownloadStatus(message) {
  if (downloadStatusEl) {
    downloadStatusEl.textContent = message;
  }
}

function restoreFeedLayout() {
  const main = document.querySelector('.main');
  if (!main) return;
  main.innerHTML = MAIN_FEED_HTML;
  downloadStatusEl = null;
}

const postSchema = {
  type: 'object',
  properties: {
    displayName: { type: 'string' },
    handle: { type: 'string' },
    text: { type: 'string' },
  },
  required: ['displayName', 'handle', 'text'],
};

async function createSession() {
  session = await LanguageModel.create({
    expectedOutputs: [
      { type:'text', languages: ['en'] }
    ],
    initialPrompts: [
      {
        role: 'system',
        content:
          'You generate random cat posts for a social media platform. You will generate a friendly display name, a handle, and a text post less than 255 characters.',
      },
    ],
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        if (e.loaded === 0) return;
        const pct = Math.floor(e.loaded * 100);
        setDownloadStatus(`Downloading model… ${pct}%`);
      });
    },
  });
}

function showPromptUnavailableMessage() {
  const main = document.querySelector('.main');
  if (!main) return;

  main.innerHTML = `
    <div class="prompt-unavailable" role="alert">
      <p class="prompt-unavailable-icon">😿✨</p>
      <h1 class="prompt-unavailable-title">The cats are shy today</h1>
      <p class="prompt-unavailable-text">
        The Scratching Post needs Chrome&rsquo;s on-device Prompt API
        (<code>LanguageModel</code>) to dream up new posts. Your browser
        doesn&rsquo;t have it available yet, or it hasn&rsquo;t been enabled.
      </p>
      <p class="prompt-unavailable-hint">
        Try a recent Chrome build with the feature turned on, then refresh.
      </p>
    </div>
  `;
}

function showModelDownloadPrompt(availability) {
  const main = document.querySelector('.main');
  if (!main) return;

  const alreadyDownloading = availability === 'downloading';
  const intro = alreadyDownloading
    ? 'The cat brain is already downloading. Click below to continue.'
    : 'Before the cats can post, Chrome needs to download a small on-device model. This only happens once.';

  main.innerHTML = `
    <div class="prompt-unavailable model-download" id="model-download-panel" role="status">
      <p class="prompt-unavailable-icon">🐱📦</p>
      <h1 class="prompt-unavailable-title">Wake the cat brain</h1>
      <p class="prompt-unavailable-text">${intro}</p>
      <p class="prompt-unavailable-hint" id="model-download-status" aria-live="polite">
        ${alreadyDownloading ? 'Download in progress…' : 'Ready when you are.'}
      </p>
      <button type="button" class="prompt-download-btn" id="model-download-btn">
        ${alreadyDownloading ? 'Continue download' : 'Download model'}
      </button>
    </div>
  `;

  downloadStatusEl = document.getElementById('model-download-status');
  document.getElementById('model-download-btn').addEventListener('click', onDownloadButtonClick);
}

async function onDownloadButtonClick() {
  const btn = document.getElementById('model-download-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Downloading…';
  }
  setDownloadStatus('Starting download…');

  try {
    await createSession();
    restoreFeedLayout();
    await loadFeed(50);
  } catch (err) {
    console.error(err);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Try again';
    }
    setDownloadStatus('Something went wrong. Please try again.');
  }
}

/**
 * Returns post content for one card. Stub for now; Chrome Prompt API later.
 * @returns {{ displayName: string, handle: string, text: string }}
 */
async function getPostContent() {
  let post = null;
  console.log('Getting post content...');
  console.log(`${session.contextUsage}/${session.contextWindow}`);

  /*
  const post = JSON.parse(await session.prompt(
    [{ role: 'user', content: 'Generate a random cat post.' }], { responseConstraint: postSchema }
  ));
  */
  try {
    post = await session.prompt(
      [{ role: 'user', content: 'Generate a random cat post.' }], { responseConstraint: postSchema }
    );
  } catch (err) {
    console.error(err);
    return {
      displayName: 'Error',
      handle: 'Error',
      text: 'Error',
    };
  }
  post = JSON.parse(post);

  console.log(post);
  return {
    displayName: post.displayName,
    handle: post.handle,
    text: post.text,
  };
}

function randomCatAvatar() {
  return CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)];
}

function randomAvatarHue() {
  return String(Math.floor(Math.random() * 360));
}

function randomDatetime() {
  const now = Date.now();
  const hoursAgo = Math.floor(Math.random() * 72);
  const minutesAgo = Math.floor(Math.random() * 60);
  const ms = now - hoursAgo * 60 * 60 * 1000 - minutesAgo * 60 * 1000;
  return new Date(ms).toISOString();
}

function createPostCard(post) {
  const card = document.createElement('post-card');
  card.setAttribute('avatar', randomCatAvatar());
  card.setAttribute('avatar-hue', randomAvatarHue());
  card.setAttribute('display-name', post.displayName);
  card.setAttribute('handle', post.handle);
  card.setAttribute('datetime', randomDatetime());
  card.textContent = post.text;
  return card;
}

async function loadFeed(count = 10) {
  const feed = document.getElementById('feed');
  if (!feed) return;

  for (let i = 0; i < count; i++) {
    const post = await getPostContent();
    feed.appendChild(createPostCard(post));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const availability = await getAvailability();

  if (availability === 'unavailable') {
    showPromptUnavailableMessage();
    return;
  }

  if (needsModelDownload(availability)) {
    showModelDownloadPrompt(availability);
    return;
  }

  console.log('Creating session...');
  await createSession();
  console.log('Session created...');
  restoreFeedLayout();
  console.log('Feed layout restored...');
  await loadFeed(10);
});
