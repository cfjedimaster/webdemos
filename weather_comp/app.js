const { DateTime } = luxon;

const GEOCODIO_API_KEY = "7cf958ee8f68f665ff96c88f86f6965f5ffeffc";
const PIRATE_WEATHER_API_KEY = "sDXCl6BromrKNFcuFSZBKUQD1Ar6OzOe";
const PIRATE_WEATHER_API_BASE = "https://dev.pirateweather.net";
const YEARS_TO_COMPARE = 5;
const DAYS_TO_COMPARE = 7;
const REQUEST_CONCURRENCY = 6;

const form = document.getElementById("location-form");
const addressInput = document.getElementById("address");
const submitButton = document.getElementById("submit-button");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const resultsTitleEl = document.getElementById("results-title");
const resultsSubtitleEl = document.getElementById("results-subtitle");
const summaryGridEl = document.getElementById("summary-grid");
const highCanvas = document.getElementById("high-chart");
const lowCanvas = document.getElementById("low-chart");

const palette = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#be123c"];
let highChart;
let lowChart;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}

async function geocodeAddress(address) {
  const url = new URL("https://api.geocod.io/v1.12/geocode");
  url.searchParams.set("q", address);
  url.searchParams.set("api_key", GEOCODIO_API_KEY);

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Geocoding failed.");
  }

  const result = payload.results?.[0];
  if (!result?.location) {
    throw new Error("No matching location was found for that address.");
  }

  return {
    label: result.formatted_address,
    lat: result.location.lat,
    lng: result.location.lng,
  };
}

async function fetchDayTemperatures(lat, lng, unixSeconds) {
  const url = new URL(
    `${PIRATE_WEATHER_API_BASE}/forecast/${PIRATE_WEATHER_API_KEY}/${lat},${lng},${unixSeconds}`,
  );
  url.searchParams.set("units", "us");
  url.searchParams.set("exclude", "minutely,hourly,alerts,flags");

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Weather lookup failed.");
  }

  const day = payload.daily?.data?.[0];
  if (!day) {
    throw new Error("Weather data did not include a daily summary.");
  }

  return {
    timezone: payload.timezone,
    high: day.temperatureMax,
    low: day.temperatureMin,
  };
}

function buildComparisonDates(timezone) {
  const today = DateTime.now().setZone(timezone).startOf("day");
  const dates = [];

  for (let offset = DAYS_TO_COMPARE - 1; offset >= 0; offset -= 1) {
    dates.push(today.minus({ days: offset }));
  }

  return dates;
}

function sameCalendarDayInYear(date, year) {
  let target = date.set({ year });

  if (target.month !== date.month || target.day !== date.day) {
    target = date.set({ year, day: 28 });
  }

  return target;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker(),
  );
  await Promise.all(workers);
  return results;
}

async function loadComparison(address) {
  const location = await geocodeAddress(address);
  const initialWeather = await fetchDayTemperatures(
    location.lat,
    location.lng,
    Math.floor(Date.now() / 1000),
  );
  const timezone = initialWeather.timezone || "UTC";
  const dates = buildComparisonDates(timezone);
  const currentYear = DateTime.now().setZone(timezone).year;
  const jobs = [];

  for (const date of dates) {
    for (let yearOffset = 0; yearOffset < YEARS_TO_COMPARE; yearOffset += 1) {
      const year = currentYear - yearOffset;
      const targetDate = sameCalendarDayInYear(date, year);
      jobs.push({
        date,
        year,
        unixSeconds: targetDate.set({ hour: 12 }).toSeconds(),
      });
    }
  }

  const readings = await mapWithConcurrency(jobs, REQUEST_CONCURRENCY, async (job) => {
    const weather = await fetchDayTemperatures(location.lat, location.lng, job.unixSeconds);

    return {
      month: job.date.month,
      day: job.date.day,
      dayLabel: job.date.toFormat("MMM d"),
      year: job.year,
      high: weather.high,
      low: weather.low,
    };
  });

  const dayMap = new Map();

  for (const reading of readings) {
    const key = `${reading.month}-${reading.day}`;
    if (!dayMap.has(key)) {
      dayMap.set(key, {
        month: reading.month,
        day: reading.day,
        label: reading.dayLabel,
        years: [],
      });
    }

    dayMap.get(key).years.push({
      year: reading.year,
      high: reading.high,
      low: reading.low,
    });
  }

  const days = [...dayMap.values()]
    .sort((left, right) => {
      if (left.month !== right.month) {
        return left.month - right.month;
      }
      return left.day - right.day;
    })
    .map((day) => ({
      ...day,
      years: day.years.sort((left, right) => right.year - left.year),
    }));

  const yearSummaries = Array.from({ length: YEARS_TO_COMPARE }, (_, index) => {
    const year = currentYear - index;
    const yearReadings = readings.filter((reading) => reading.year === year);
    const highAverage =
      yearReadings.reduce((sum, reading) => sum + reading.high, 0) / yearReadings.length;
    const lowAverage =
      yearReadings.reduce((sum, reading) => sum + reading.low, 0) / yearReadings.length;

    return {
      year,
      highAverage: Number(highAverage.toFixed(1)),
      lowAverage: Number(lowAverage.toFixed(1)),
    };
  });

  return {
    location,
    timezone,
    days,
    yearSummaries,
    rangeLabel: `${dates[0].toFormat("MMM d")} through ${dates.at(-1).toFormat("MMM d")}`,
  };
}

function buildDatasets(days, valueKey) {
  const years = [...new Set(days.flatMap((day) => day.years.map((entry) => entry.year)))].sort(
    (left, right) => right - left,
  );

  return years.map((year, index) => ({
    label: String(year),
    data: days.map((day) => {
      const match = day.years.find((entry) => entry.year === year);
      return match && Number.isFinite(match[valueKey]) ? match[valueKey] : null;
    }),
    borderColor: palette[index % palette.length],
    backgroundColor: palette[index % palette.length],
    borderWidth: index === 0 ? 3 : 2,
    pointRadius: index === 0 ? 4 : 3,
    tension: 0.25,
  }));
}

function renderChart(canvas, label, days, valueKey) {
  const labels = days.map((day) => day.label);
  const datasets = buildDatasets(days, valueKey);

  return new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      resizeDelay: 200,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed.y;
              if (typeof value !== "number" || Number.isNaN(value)) {
                return `${context.dataset.label}: n/a`;
              }
              return `${context.dataset.label}: ${value}°F`;
            },
          },
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: `${label} (°F)`,
          },
        },
      },
    },
  });
}

function renderCharts(days) {
  destroyChart(highChart);
  destroyChart(lowChart);
  highChart = null;
  lowChart = null;

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      highChart = renderChart(highCanvas, "High", days, "high");
      lowChart = renderChart(lowCanvas, "Low", days, "low");
      resolve();
    });
  });
}

function renderSummary(yearSummaries) {
  summaryGridEl.replaceChildren();

  for (const summary of yearSummaries) {
    const card = document.createElement("article");
    card.className = "summary-item";
    if (summary.year === yearSummaries[0].year) {
      card.classList.add("current");
    }

    card.innerHTML = `
      <span>${summary.year}</span>
      <strong>${summary.highAverage}°F high</strong>
      <strong>${summary.lowAverage}°F low</strong>
    `;

    summaryGridEl.append(card);
  }
}

function renderResults(payload) {
  resultsEl.classList.remove("hidden");
  resultsTitleEl.textContent = payload.location.label;
  resultsSubtitleEl.textContent = `Seven-day window: ${payload.rangeLabel}. Times are grouped by ${payload.timezone}.`;
  renderSummary(payload.yearSummaries);
  return renderCharts(payload.days);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const address = addressInput.value.trim();
  if (!address) {
    setStatus("Enter a location to compare.", true);
    return;
  }

  submitButton.disabled = true;
  setStatus("Geocoding your location and loading five years of daily temperatures...");

  try {
    const payload = await loadComparison(address);
    await renderResults(payload);
    setStatus("Comparison ready.");
  } catch (error) {
    resultsEl.classList.add("hidden");
    setStatus(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});
