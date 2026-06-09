const CAT_AVATARS = ['😺', '😸', '🙀', '😻', '🐱', '😽', '😼', '😹'];
let session = null;
let downloadStatusEl = null;
let feedLoadingCount = 0;

const MAIN_FEED_HTML = `
  <h1 class="feed-title">
    <span class="sparkle">✨</span>
    <span class="feed-title-text">Your feed</span>
    <span id="feed-loading-status" class="feed-loading-status" hidden aria-live="polite">
      Loading new posts…
    </span>
  </h1>
  <div id="feed"></div>
`;

function setFeedLoading(active) {
  const el = document.getElementById('feed-loading-status');
  if (el) {
    el.hidden = !active;
  }
}

function beginFeedLoading() {
  feedLoadingCount += 1;
  setFeedLoading(true);
}

function endFeedLoading() {
  feedLoadingCount = Math.max(0, feedLoadingCount - 1);
  if (feedLoadingCount === 0) {
    setFeedLoading(false);
  }
}

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
  console.log('Setting download status:', message);
  if (downloadStatusEl) {
    downloadStatusEl.textContent = message;
  }
}

function restoreFeedLayout() {
  const main = document.querySelector('.main');
  if (!main) return;
  main.innerHTML = MAIN_FEED_HTML;
  downloadStatusEl = null;
  feedLoadingCount = 0;
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
  console.log('Creating session...');
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
        console.log('Download progress:', e.loaded);
        if (e.loaded === 0 || e.loaded === 1) return;
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

function createPostCard(post) {
  const card = document.createElement('post-card');
  card.setAttribute('avatar', randomCatAvatar());
  card.setAttribute('avatar-hue', randomAvatarHue());
  card.setAttribute('display-name', post.displayName);
  card.setAttribute('handle', post.handle);
  card.setAttribute('datetime', new Date().toISOString());
  card.textContent = post.text;
  return card;
}

function isPostError(post) {
  return (
    !post ||
    post.displayName === 'Error' ||
    post.handle === 'Error' ||
    post.text === 'Error'
  );
}

/** Prepend a post to the feed (newest on top) with slide-in animation. */
function prependPostToFeed(post) {
  if (isPostError(post)) return null;

  const feed = document.getElementById('feed');
  if (!feed) return null;

  const card = createPostCard(post);
  const existing = [...feed.querySelectorAll('post-card')];
  const tops = new Map(existing.map((el) => [el, el.getBoundingClientRect().top]));

  feed.insertBefore(card, feed.firstChild);
  card.classList.add('post-card--enter');

  existing.forEach((el) => {
    const delta = tops.get(el) - el.getBoundingClientRect().top;
    if (delta !== 0) {
      el.style.transform = `translateY(${delta}px)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transform = '';
        });
      });
    }
  });

  card.addEventListener(
    'animationend',
    () => card.classList.remove('post-card--enter'),
    { once: true }
  );

  return card;
}

function randomHeartbeatDelayMs() {
  const min = 10_000;
  const max = 30_000;
  return min + Math.floor(Math.random() * (max - min + 1));
}

function startFeedHeartbeat() {
  async function tick() {
    console.log('Heartbeat tick...');
    beginFeedLoading();
    try {
      const post = await getPostContent();
      prependPostToFeed(post);
    } catch (err) {
      console.error('Heartbeat post failed:', err);
    } finally {
      endFeedLoading();
    }
    setTimeout(tick, randomHeartbeatDelayMs());
  }

  setTimeout(tick, randomHeartbeatDelayMs());
}

async function loadFeed(count = 10) {
  const feed = document.getElementById('feed');
  if (!feed) return;

  beginFeedLoading();
  try {
    for (let i = 0; i < count; i++) {
      const post = await getPostContent();
      prependPostToFeed(post);
    }
  } finally {
    endFeedLoading();
  }

  startFeedHeartbeat();
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
