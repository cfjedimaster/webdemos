/**
 * Random themed dashboard — 100% fabricated metrics.
 * No build step; plain modules for small helpers only (none imported).
 */

const THEMES = [
  {
    name: "Paws & Whiskers Pet Supply",
    emoji: "🐾",
    tagline: "Treats, toys, and suspiciously happy goldfish.",
    barLabel: "Snacks moved (7-day)",
    donutLabel: "Species share of drama",
    lineLabel: "Live tail wags / minute",
    tableTitle: "Top chaos agents",
    tableRows: ["Name", "Incidents"],
    names: ["Mr. Biscuits", "Professor Yowl", "Noodle", "Sir Barksalot", "Bean", "Princess Dumpster"],
    kpiLabels: ["Scritches budget", "Live zoomies", "Treat inventory", "Mystery spills"],
    kpiLive: [1, 3],
    categories: ["Dogs", "Cats", "Birds", "Reptiles", "Small friends"],
    barKeys: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    blurb:
      "Corporate says we are “paw-sitive” about Q3. The break room is still missing one shoe. Investigations continue.",
  },
  {
    name: "Bean There Café",
    emoji: "☕",
    tagline: "Espresso, empathy, and Wi-Fi passwords written in pencil.",
    barLabel: "Cups poured (week)",
    donutLabel: "Milk universe",
    lineLabel: "Live grinder decibels",
    tableTitle: "Regulars by nickname accuracy",
    tableRows: ["Customer", "Score"],
    names: ["Triple-shot Terry", "Oatly Olivia", "Scone Dad", "Latte Lenny", "Muffin Maven", "Cold Brew Cam"],
    kpiLabels: ["Foam altitude", "Live queue guilt", "Pastry half-life", "Tip jar optimism"],
    kpiLive: [1, 2],
    categories: ["Oat", "Whole", "Almond", "Soy", "Macadamia delulu"],
    barKeys: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    blurb:
      "We ran out of lids twice. Marketing calls it “rustic pour culture.” Everyone pretends to agree.",
  },
  {
    name: "OrbitWorks Space Snacks",
    emoji: "🛰️",
    tagline: "Nutrition for people who say “nominal” about toast.",
    barLabel: "Pouches launched",
    donutLabel: "Flavor sentiment (fake)",
    lineLabel: "Live telemetry noise",
    tableTitle: "Astronaut snack trust index",
    tableRows: ["Crew", "Trust"],
    names: ["Cmdr. Pebble", "Lt. Crunch", "Spec. Zest", "Eng. Mochi", "Dr. Puff", "Cadet Noms"],
    kpiLabels: ["Crumb drift", "Live morale", "Tether tension", "Freeze-dry dreams"],
    kpiLive: [0, 3],
    categories: ["Berry nebula", "Cheese moon", "Chili comet", "Mystery dust", "Vanilla void"],
    barKeys: ["Sol 1", "Sol 2", "Sol 3", "Sol 4", "Sol 5", "Sol 6", "Sol 7"],
    blurb:
      "Houston approved the new slogan: “Taste like science.” Focus groups were three interns and a blender.",
  },
  {
    name: "Pixel & Parchment Games",
    emoji: "🎲",
    tagline: "Boards, bytes, and one haunted dice tower.",
    barLabel: "Sessions hosted",
    donutLabel: "Genre arguments (%)",
    lineLabel: "Live hype oscillation",
    tableTitle: "Rules lawyers leaderboard",
    tableRows: ["Player", "Cases"],
    names: ["Rules Karen", "Chart Chad", "Token Tina", "DM Dave", "Minis Morgan", "Lore Larry"],
    kpiLabels: ["Dice shame index", "Live hype", "Shelf sag", "Patch notes dread"],
    kpiLive: [1, 2],
    categories: ["RPG", "Deckbuilders", "War games", "Party chaos", "Co-op cope"],
    barKeys: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    blurb:
      "We banned glitter dice after Incident 7B. The glitter remains. It always remains.",
  },
  {
    name: "Greenhouse Grumbles Nursery",
    emoji: "🪴",
    tagline: "Plants, pots, and passive-aggressive watering reminders.",
    barLabel: "Leaves high-fived",
    donutLabel: "Light drama breakdown",
    lineLabel: "Live humidity vibes",
    tableTitle: "Most judgmental plants",
    tableRows: ["Plant", "Stare"],
    names: ["Fernando", "Phil theodendron", "Succlord", "Fiddle Sass", "Pothos Prime", "Cactus Karen"],
    kpiLabels: ["Soil secrets", "Live mist", "Pottery thirst", "Apology ferns"],
    kpiLive: [0, 2],
    categories: ["Bright", "Shady", "Delusional window", "LED truth", "Basement hope"],
    barKeys: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    blurb:
      "Someone asked if cactus “likes hugs.” We updated the FAQ. The cactus did not comment.",
  },
  {
    name: "Velocity Vinyl Gym",
    emoji: "🏋️",
    tagline: "PRs, playlists, and protein powder in the HVAC.",
    barLabel: "Grunts logged",
    donutLabel: "Playlist crimes",
    lineLabel: "Live motivation (synthetic)",
    tableTitle: "Mystery bruise sources",
    tableRows: ["Member", "Blame"],
    names: ["Kettlebell Ken", "Yoga Yolanda", "Tread Ted", "Spin Spencer", "Sauna Steve", "Zumba Zed"],
    kpiLabels: ["Bro science index", "Live grunts", "Towel shortage", "Mirror selfies"],
    kpiLive: [1, 3],
    categories: ["2000s pop", "Phonk", "Podcasts", "Silence (rare)", "Unholy mashups"],
    barKeys: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    blurb:
      "We replaced motivational posters with “please rerack” in Comic Sans. Compliance improved 0.4% statistically.",
  },
  {
    name: "Wobble & Sprocket Bike Co.",
    emoji: "🚲",
    tagline: "Chains, spokes, and emotional support allen keys.",
    barLabel: "Flat fixes (week)",
    donutLabel: "Excuses accepted",
    lineLabel: "Live cadence chaos",
    tableTitle: "Strava caption crimes",
    tableRows: ["Rider", "Severity"],
    names: ["Drafting Dan", "Gravel Greta", "Commuter Chris", "E-bike Erin", "Unicycle Uma", "Fixie Finn"],
    kpiLabels: ["Tire trust issues", "Live wind lies", "Grease aura", "Spoke poetry"],
    kpiLive: [0, 1],
    categories: ["Dog ate ride", "Headwind only", "Forgot legs", "GPS gaslight", "Honest tired"],
    barKeys: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    blurb:
      "Someone brought a unicycle to a group ride. We made a plaque. It says “why.”",
  },
  {
    name: "Slice Theory Pizzeria Lab",
    emoji: "🍕",
    tagline: "R&D stands for “Ranch & Drama.”",
    barLabel: "Pies launched",
    donutLabel: "Topping politics",
    lineLabel: "Live oven jealousy",
    tableTitle: "Controversial orders",
    tableRows: ["Order", "Heat"],
    names: ["Pineapple Pete", "Ranch Rachel", "Salad-on-pizza Sam", "Fork Felicia", "Ketchup Kyle", "Calzone Cate"],
    kpiLabels: ["Cheese stretch", "Live oven stares", "Crisp coefficient", "Drama dough"],
    kpiLive: [2, 3],
    categories: ["Classic", "Meat sweats", "Veg optimism", "Chaos white", "Experimental regret"],
    barKeys: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    blurb:
      "We tried AI-generated toppings. It suggested “whispered oregano.” We went outside and touched grass.",
  },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function formatInt(n) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(n));
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/** @returns {{ hue: number, colors: string[], accent: string, accent2: string, muted: string }} */
function makePalette() {
  const hue = randInt(0, 359);
  const accent = `hsl(${hue} 85% 62%)`;
  const accent2 = `hsl(${(hue + 38) % 360} 78% 68%)`;
  const colors = [];
  for (let i = 0; i < 6; i++) {
    const h = (hue + i * 47) % 360;
    colors.push(`hsl(${h} 70% 58%)`);
  }
  return {
    hue,
    accent,
    accent2,
    colors,
    muted: `hsl(${hue} 12% 65%)`,
  };
}

function applyCssVars(palette) {
  const root = document.documentElement;
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--accent2", palette.accent2);
  root.style.setProperty("--muted", palette.muted);
  root.style.setProperty("--glow", `hsla(${palette.hue} 85% 62% / 0.18)`);
}

function scaleCanvas(canvas, cssW, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawBarChart(canvas, labels, values, palette) {
  const cssW = canvas.clientWidth || 640;
  const cssH = 240;
  const ctx = scaleCanvas(canvas, cssW, cssH);
  if (!ctx) return;
  const pad = { l: 44, r: 18, t: 18, b: 40 };
  const w = cssW - pad.l - pad.r;
  const h = cssH - pad.t - pad.b;
  const max = Math.max(...values, 1);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(pad.l, pad.t, w, h);
  const barW = (w / values.length) * 0.62;
  const gap = (w / values.length) * 0.38;
  values.forEach((v, i) => {
    const x = pad.l + i * (barW + gap) + gap * 0.35;
    const bh = (v / max) * h;
    const y = pad.t + h - bh;
    const grd = ctx.createLinearGradient(x, y, x, y + bh);
    grd.addColorStop(0, palette.colors[i % palette.colors.length]);
    grd.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    const r = 8;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    ctx.lineTo(x + barW, y + bh);
    ctx.lineTo(x, y + bh);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
    ctx.fillStyle = "rgba(232,234,239,0.55)";
    ctx.font = "12px DM Sans, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i] ?? "", x + barW / 2, pad.t + h + 22);
  });
}

function drawDonut(canvas, segments, palette) {
  const size = Math.min(canvas.clientWidth || 280, 240);
  const ctx = scaleCanvas(canvas, size, size);
  if (!ctx) return;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const inner = r * 0.58;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let angle = -Math.PI / 2;
  ctx.clearRect(0, 0, size, size);
  segments.forEach((seg, i) => {
    const sweep = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = palette.colors[i % palette.colors.length];
    ctx.fill();
    angle += sweep;
  });
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(28,33,44,0.98)";
  ctx.fill();
  ctx.fillStyle = "rgba(232,234,239,0.9)";
  ctx.font = "600 14px DM Sans, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Total", cx, cy - 4);
  ctx.font = "700 18px JetBrains Mono, ui-monospace, monospace";
  ctx.fillText(formatInt(total), cx, cy + 18);
}

function drawLineChart(canvas, points, palette, labelMax) {
  const cssW = canvas.clientWidth || 960;
  const cssH = 220;
  const ctx = scaleCanvas(canvas, cssW, cssH);
  if (!ctx) return;
  const pad = { l: 46, r: 16, t: 16, b: 28 };
  const w = cssW - pad.l - pad.r;
  const h = cssH - pad.t - pad.b;
  const maxV = Math.max(...points, labelMax, 1);
  const minV = Math.min(...points, 0);
  const span = maxV - minV || 1;
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + w, y);
    ctx.stroke();
  }
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = pad.l + (i / Math.max(points.length - 1, 1)) * w;
    const y = pad.t + h - ((p - minV) / span) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  const lastX = pad.l + w;
  const lastY = pad.t + h - ((points[points.length - 1] - minV) / span) * h;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
  ctx.fillStyle = palette.accent2;
  ctx.fill();
  ctx.font = "11px JetBrains Mono, ui-monospace, monospace";
  ctx.fillStyle = "rgba(232,234,239,0.45)";
  ctx.textAlign = "left";
  ctx.fillText("now →", pad.l, cssH - 8);
}

let timers = [];
/** @type {{ theme: typeof THEMES[number], data: ReturnType<typeof buildFakeData>, palette: ReturnType<typeof makePalette> } | null} */
let chartState = null;
let boundResize = null;

function clearTimers() {
  timers.forEach(clearInterval);
  timers = [];
}

function sampleUnique(arr, n) {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, Math.min(n, copy.length));
}

function buildFakeData(theme) {
  const barValues = theme.barKeys.map(() => randInt(20, 100));
  const donut = theme.categories.map((name) => ({
    name,
    value: randInt(8, 40),
  }));
  const base = randFloat(40, 80);
  const linePoints = Array.from({ length: 32 }, (_, i) => base + Math.sin(i / 4) * 15 + randFloat(-6, 6));
  const kpiBase = [
    randInt(1200, 99999),
    randInt(5, 120),
    randInt(300, 8000),
    randInt(2, 99),
  ];
  const leaders = sampleUnique(theme.names, 5).map((name) => ({
    name,
    score: randInt(12, 999),
  }));

  return { barValues, donut, linePoints, kpiBase, leaders };
}

function renderKpis(theme, palette, data, liveSet) {
  const row = document.getElementById("kpiRow");
  row.innerHTML = "";
  theme.kpiLabels.forEach((label, i) => {
    const live = liveSet.has(i);
    const card = document.createElement("article");
    card.className = `kpi${live ? " kpi--live" : ""}`;
    card.innerHTML = `
      <p class="kpi__label">${label}</p>
      <p class="kpi__value" data-kpi="${i}">${formatInt(data.kpiBase[i])}</p>
      <p class="kpi__hint">${live ? "Updates in real time (still fake)" : "Frozen snapshot for this visit"}</p>
    `;
    row.appendChild(card);
  });
}

function renderDonutLegend(donut) {
  const ul = document.getElementById("donutLegend");
  ul.innerHTML = "";
  donut.forEach((seg, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="swatch" style="background:var(--c${i})"></span>${seg.name}`;
    ul.appendChild(li);
  });
}

function setLegendSwatches(palette) {
  const root = document.documentElement;
  palette.colors.forEach((c, i) => {
    root.style.setProperty(`--c${i}`, c);
  });
}

function renderTable(theme, leaders) {
  const table = document.getElementById("leaderTable");
  const [h1, h2] = theme.tableRows;
  table.querySelector("thead").innerHTML = `<tr><th>${h1}</th><th>${h2}</th></tr>`;
  table.querySelector("tbody").innerHTML = leaders
    .map((r) => `<tr><td>${r.name}</td><td>${formatInt(r.score)}</td></tr>`)
    .join("");
}

function renderProgressBars(theme, palette) {
  const wrap = document.getElementById("progressBars");
  wrap.innerHTML = "";
  const labels = sampleUnique(theme.categories, 4);
  labels.forEach((label, i) => {
    const pct = randInt(18, 96);
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div>
        <div>${label}</div>
        <div class="bar-track"><div class="bar-fill" style="background:${palette.colors[i % palette.colors.length]}"></div></div>
      </div>
      <div class="mono" style="text-align:right">${pct}%</div>
    `;
    wrap.appendChild(row);
    requestAnimationFrame(() => {
      row.querySelector(".bar-fill").style.width = `${pct}%`;
    });
  });
}

function startLiveUpdates(theme, data, palette) {
  const liveKpis = new Set(theme.kpiLive);
  let line = [...data.linePoints];
  const labelMax = Math.max(...line) * 1.15;

  const tick = () => {
    liveKpis.forEach((i) => {
      const el = document.querySelector(`[data-kpi="${i}"]`);
      if (!el) return;
      const cur = Number(el.textContent.replace(/,/g, "")) || data.kpiBase[i];
      const next = clamp(cur + randInt(-Math.ceil(cur * 0.02), Math.ceil(cur * 0.02)), 1, 9999999);
      el.textContent = formatInt(next);
    });
    const drift = randFloat(-4, 4) + Math.sin(Date.now() / 9000) * 3;
    line = [...line.slice(1), clamp(line[line.length - 1] + drift, 5, 140)];
    const canvas = document.getElementById("lineChart");
    drawLineChart(canvas, line, palette, labelMax);
  };

  const id = setInterval(tick, 1100);
  timers.push(id);
  tick();
}

function initDashboard() {
  clearTimers();
  const theme = pick(THEMES);
  const palette = makePalette();
  applyCssVars(palette);
  setLegendSwatches(palette);

  const data = buildFakeData(theme);

  document.getElementById("themeEmoji").textContent = theme.emoji;
  document.getElementById("themeTitle").textContent = theme.name;
  document.getElementById("themeTagline").textContent = theme.tagline;
  document.getElementById("barTitle").textContent = theme.barLabel;
  document.getElementById("donutTitle").textContent = theme.donutLabel;
  document.getElementById("lineTitle").textContent = theme.lineLabel;
  document.getElementById("tableTitle").textContent = theme.tableTitle;
  document.getElementById("staticBlurb").textContent = theme.blurb;

  const liveSet = new Set(theme.kpiLive);
  renderKpis(theme, palette, data, liveSet);
  renderDonutLegend(data.donut);
  renderTable(theme, data.leaders);
  renderProgressBars(theme, palette);

  drawBarChart(document.getElementById("barChart"), theme.barKeys, data.barValues, palette);
  drawDonut(document.getElementById("donutChart"), data.donut, palette);
  drawLineChart(
    document.getElementById("lineChart"),
    data.linePoints,
    palette,
    Math.max(...data.linePoints) * 1.1,
  );

  chartState = { theme, data, palette };
  startLiveUpdates(theme, data, palette);

  if (boundResize) window.removeEventListener("resize", boundResize);
  boundResize = () => {
    if (!chartState) return;
    const { theme: t, data: d, palette: p } = chartState;
    drawBarChart(document.getElementById("barChart"), t.barKeys, d.barValues, p);
    drawDonut(document.getElementById("donutChart"), d.donut, p);
  };
  window.addEventListener("resize", boundResize);
}

function tickClock() {
  const el = document.getElementById("clock");
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  el.textContent = fmt.format(new Date());
}

tickClock();
setInterval(tickClock, 1000);

document.getElementById("reshuffle").addEventListener("click", () => {
  initDashboard();
});

initDashboard();
