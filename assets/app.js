const EMPTY_RESULTS = {
  published_at: new Date().toISOString().slice(0, 10),
  models: [],
  examples: [],
  excluded_models: [],
  score_bands: [
    { min: 96, max: 100, label: "sokratiker" },
    { min: 86, max: 96, label: "skarpskytter" },
    { min: 70, max: 86, label: "nikkedukke" },
    { min: 50, max: 70, label: "bygdeoriginal" },
    { min: 30, max: 50, label: "skrønemaker" },
    { min: 0, max: 30, label: "Baron von Munchhausen" },
  ],
};

const data = window.DK_RESULTS || EMPTY_RESULTS;

const SCORE_MODES = {
  raw: {
    label: "Rå",
    shortLabel: "Rå",
    field: "dunning_kruger_score",
    bandField: "dunning_kruger_band",
    bandDescriptionField: "dunning_kruger_band_description",
    axis: "Rå",
  },
  adjusted: {
    label: "Score",
    shortLabel: "Score",
    field: "feighetsjustert_score",
    bandField: "feighetsjustert_band",
    bandDescriptionField: "feighetsjustert_band_description",
    axis: "Score",
  },
};

const state = {
  selectedAlias: null,
  scoreMode: "adjusted",
};

function formatDate(value) {
  return new Intl.DateTimeFormat("nb-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function sizeLabel(size) {
  return `${size.toLocaleString("nb-NO", { maximumFractionDigits: 2 })}B`;
}

function scoreLabel(score) {
  return score.toLocaleString("nb-NO", { maximumFractionDigits: 1 });
}

function penaltyLabel(model) {
  const penalty = model.feighetsjustert_penalty || 0;
  return penalty ? `-${scoreLabel(penalty)}` : "0";
}

function categoryLabel(label) {
  const labels = {
    sokratiker: "Norsk Sokrates",
    skarpskytter: "Skarpskytter",
    nikkedukke: "Nikkedukke",
    bygdeoriginal: "Bygdeoriginal",
    "skrønemaker": "Skrønemaker",
    "Baron von Munchhausen": "Baron von Münchhausen",
  };
  return labels[label] || label;
}

function activeScoreMode() {
  return SCORE_MODES[state.scoreMode] || SCORE_MODES.raw;
}

function modelScore(model) {
  const mode = activeScoreMode();
  const value = model[mode.field];
  return typeof value === "number" ? value : model.dunning_kruger_score;
}

function sortedModels() {
  return [...data.models].sort((left, right) => {
    const scoreDiff = modelScore(right) - modelScore(left);
    if (scoreDiff) return scoreDiff;
    const sizeDiff = left.size_b - right.size_b;
    if (sizeDiff) return sizeDiff;
    return left.name.localeCompare(right.name, "nb-NO");
  });
}

function bandFor(model) {
  const mode = activeScoreMode();
  return {
    label: model[mode.bandField] || model.band,
    description: model[mode.bandDescriptionField] || model.band_description,
  };
}

function hashAlias(alias) {
  return [...alias].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll("æ", "ae")
    .replaceAll("ø", "o")
    .replaceAll("å", "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hexLuminance(hex) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0.3;
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16) / 255);
  const linear = [r, g, b].map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function logoBackground(badge) {
  const lightMarks = new Set([
    "allenai",
    "amd",
    "bsc",
    "google",
    "lumi",
    "marin",
    "meta",
    "mistral",
    "opengptx",
    "qwen",
    "swiss",
    "tencent",
    "tii",
  ]);
  if (badge.mark === "huggingface") return "#ffcc4d";
  if (badge.mark === "nvidia") return "#76b900";
  if (badge.mark === "nb") return "#cc003d";
  return lightMarks.has(badge.mark) ? "#ffffff" : badge.accent;
}

function setSummary() {
  const updatedAt = document.getElementById("updatedAt");
  if (updatedAt) updatedAt.textContent = `Oppdatert ${formatDate(data.published_at)}`;
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

function appendLine(group, attrs) {
  group.appendChild(createSvgElement("line", attrs));
}

function appendPath(group, attrs) {
  group.appendChild(createSvgElement("path", attrs));
}

function appendLogoText(group, text, attrs = {}) {
  const label = createSvgElement("text", {
    x: 0,
    y: 5,
    "text-anchor": "middle",
    "font-family": "Inter, Arial, sans-serif",
    "font-weight": 900,
    "font-size": text.length > 2 ? 10 : 14,
    ...attrs,
  });
  label.textContent = text;
  group.appendChild(label);
}

function appendBadgeSymbol(group, badge, color) {
  const mark = badge.mark || "dot";
  if (mark === "google") {
    appendLogoText(group, "G", { fill: "#4285f4", "font-size": 21, "font-weight": 950, y: 7 });
    group.appendChild(createSvgElement("rect", { x: 3, y: -3, width: 11, height: 4, fill: "#4285f4" }));
    group.appendChild(createSvgElement("circle", { cx: -10, cy: 9, r: 3.2, fill: "#34a853" }));
    group.appendChild(createSvgElement("circle", { cx: -10, cy: -9, r: 3.2, fill: "#ea4335" }));
    group.appendChild(createSvgElement("circle", { cx: 10, cy: -9, r: 3.2, fill: "#fbbc05" }));
  } else if (mark === "meta") {
    appendPath(group, { d: "M-17 7C-11-8-5-9 0 1c5-10 11-9 17 6M-17 7c5 6 11 2 17-6 6 8 12 12 17 6", fill: "none", stroke: "#0668e1", "stroke-width": 4.2, "stroke-linecap": "round", "stroke-linejoin": "round" });
  } else if (mark === "mistral") {
    [
      [-16, -13, 6, 26, "#111827"],
      [-10, -7, 6, 6, "#ffaf00"],
      [-4, -1, 6, 6, "#ff7000"],
      [2, -7, 6, 6, "#ff3b30"],
      [8, -13, 6, 26, "#111827"],
      [14, -13, 5, 6, "#ffaf00"],
      [14, -1, 5, 6, "#ff7000"],
    ].forEach(([x, y, width, height, fill]) =>
      group.appendChild(createSvgElement("rect", { x, y, width, height, fill })),
    );
  } else if (mark === "nvidia") {
    appendPath(group, { d: "M-17 1c7-8 17-10 29-5-8-1-14 1-19 6 4-2 10-3 15 0-5 8-15 9-25-1z", fill: "#ffffff" });
    group.appendChild(createSvgElement("circle", { cx: -2, cy: 1, r: 5, fill: "#76b900" }));
    group.appendChild(createSvgElement("circle", { cx: -2, cy: 1, r: 2.3, fill: "#ffffff" }));
  } else if (mark === "huggingface") {
    group.appendChild(createSvgElement("circle", { cx: -7, cy: -5, r: 2.3, fill: "#111827" }));
    group.appendChild(createSvgElement("circle", { cx: 7, cy: -5, r: 2.3, fill: "#111827" }));
    appendPath(group, { d: "M-9 5c5 5 13 5 18 0", fill: "none", stroke: "#111827", "stroke-width": 3, "stroke-linecap": "round" });
  } else if (mark === "nb") {
    appendLogoText(group, "NB", { fill: "#ffffff", "font-size": 17, "font-weight": 950, y: 6 });
  } else if (mark === "amd") {
    appendLogoText(group, "AMD", { fill: "#111827", "font-size": 10.5, y: 5 });
    appendPath(group, { d: "M9-14h9v9h-4v-5H9zM9 14h9V5h-4v5H9z", fill: "#111827" });
  } else if (mark === "qwen") {
    group.appendChild(createSvgElement("circle", { cx: 0, cy: 0, r: 13, fill: "none", stroke: "#615ced", "stroke-width": 4 }));
    appendLine(group, { x1: 8, y1: 8, x2: 15, y2: 15, stroke: "#615ced", "stroke-width": 4, "stroke-linecap": "round" });
    appendLogoText(group, "Q", { fill: "#615ced", "font-size": 13, y: 5 });
  } else if (mark === "swiss") {
    group.appendChild(createSvgElement("rect", { x: -5, y: -15, width: 10, height: 30, fill: "#e30613" }));
    group.appendChild(createSvgElement("rect", { x: -15, y: -5, width: 30, height: 10, fill: "#e30613" }));
  } else if (mark === "tencent") {
    group.appendChild(createSvgElement("circle", { cx: -7, cy: 3, r: 8, fill: "#1473e6" }));
    group.appendChild(createSvgElement("circle", { cx: 4, cy: -3, r: 10, fill: "#00a2ff" }));
    group.appendChild(createSvgElement("rect", { x: -15, y: 3, width: 30, height: 10, rx: 5, fill: "#1473e6" }));
  } else if (mark === "tii") {
    appendPath(group, { d: "M-17 10L-4-14l18 4L4-1l12 11L0 5z", fill: "#008c7a" });
  } else if (mark === "eurollm") {
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      group.appendChild(createSvgElement("circle", { cx: Math.cos(angle) * 13, cy: Math.sin(angle) * 13, r: 1.7, fill: "#ffcc00" }));
    }
    appendLogoText(group, "EU", { fill: "#ffffff", "font-size": 10.5 });
  } else if (mark === "lumi" || mark === "marin") {
    appendPath(group, { d: "M-17 4C-11-8-4-8 2 3s11 10 16-2", fill: "none", stroke: badge.accent, "stroke-width": 5, "stroke-linecap": "round" });
    appendPath(group, { d: "M-14 12c7-5 16-5 24 0", fill: "none", stroke: badge.accent, "stroke-width": 4, "stroke-linecap": "round", opacity: 0.65 });
  } else if (mark === "ai-sweden") {
    appendLogoText(group, "ai", { fill: "#004b8d", "font-size": 17, "font-weight": 950, y: 6 });
    group.appendChild(createSvgElement("circle", { cx: 12, cy: -12, r: 3.5, fill: "#f6c800" }));
  } else if (mark === "allenai") {
    appendLogoText(group, "AI2", { fill: "#174ea6", "font-size": 12.5, "font-weight": 950 });
  } else if (mark === "bsc") {
    group.appendChild(createSvgElement("rect", { x: -17, y: -11, width: 10, height: 10, fill: "#be1522" }));
    group.appendChild(createSvgElement("rect", { x: -5, y: -11, width: 10, height: 10, fill: "#f6b221" }));
    group.appendChild(createSvgElement("rect", { x: 7, y: -11, width: 10, height: 10, fill: "#1f6fb2" }));
    appendLogoText(group, "BSC", { fill: "#111827", "font-size": 10, y: 10 });
  } else if (mark === "essential") {
    group.appendChild(createSvgElement("circle", { cx: 0, cy: 0, r: 15, fill: "none", stroke: "#111827", "stroke-width": 4 }));
    [-5, 0, 5].forEach((y, index) =>
      appendLine(group, { x1: -7, y1: y, x2: index === 1 ? 4 : 7, y2: y, stroke: "#111827", "stroke-width": 3, "stroke-linecap": "round" }),
    );
  } else if (mark === "norallm" || mark === "norwai") {
    appendLogoText(group, mark === "norwai" ? "Nor" : "NA", { fill: "#ffffff", "font-size": 10.5, y: 4 });
    appendLine(group, { x1: -17, x2: 17, y1: 12, y2: 12, stroke: "#ffffff", "stroke-width": 4, opacity: 0.9 });
    appendLine(group, { x1: -9, x2: -9, y1: -16, y2: 16, stroke: "#ffffff", "stroke-width": 4, opacity: 0.9 });
  } else if (mark === "opengptx") {
    appendPath(group, { d: "M-14-14L14 14M14-14L-14 14", fill: "none", stroke: "#111827", "stroke-width": 5, "stroke-linecap": "round" });
    appendLogoText(group, "X", { fill: "#111827", "font-size": 13 });
  } else {
    appendLogoText(group, badge.initials || "LLM", { fill: color });
  }
}

function appendChartIcon(point, model, radius) {
  const badge = model.badge || { initials: "LLM", accent: "#64748b", mark: "dot" };
  const background = logoBackground(badge);
  const symbolColor = hexLuminance(background) > 0.52 ? "#111827" : "#ffffff";

  point.appendChild(createSvgElement("circle", { r: radius + 4, class: "point-halo" }));
  if (badge.icon) {
    const image = createSvgElement("image", {
      href: badge.icon,
      x: -radius,
      y: -radius,
      width: radius * 2,
      height: radius * 2,
      class: "point-icon",
    });
    image.setAttributeNS("http://www.w3.org/1999/xlink", "href", badge.icon);
    point.appendChild(image);
    return;
  }
  point.appendChild(createSvgElement("circle", { r: radius, fill: background, class: "point-disc" }));
  const mark = createSvgElement("g", { class: "point-symbol" });
  appendBadgeSymbol(mark, badge, symbolColor);
  point.appendChild(mark);
}

function renderChart() {
  const svg = document.getElementById("scoreChart");
  svg.textContent = "";
  if (!data.models.length) return;
  const mode = activeScoreMode();
  const models = sortedModels();

  const width = 1480;
  const height = 780;
  const margin = { top: 26, right: 34, bottom: 64, left: 88 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const sizes = data.models.map((model) => Math.max(model.size_b, 0.25));
  const minLog = Math.log10(Math.min(...sizes) * 0.78);
  const maxLog = Math.log10(Math.max(...sizes) * 1.35);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const x = (size) => {
    const value = Math.log10(Math.max(size, 0.25));
    return margin.left + ((value - minLog) / (maxLog - minLog)) * plotWidth;
  };
  const y = (score) => margin.top + ((100 - score) / 100) * plotHeight;

  const bandGroup = createSvgElement("g", { class: "bands" });
  data.score_bands.forEach((band) => {
    const yTop = y(band.max);
    const yBottom = y(band.min);
    bandGroup.appendChild(
      createSvgElement("rect", {
        x: margin.left,
        y: yTop,
        width: plotWidth,
        height: Math.max(1, yBottom - yTop),
        class: `band band-${slug(band.label)}`,
      }),
    );
    const label = createSvgElement("text", {
      x: margin.left + 14,
      y: yTop + (yBottom - yTop) / 2,
      class: "band-label",
      "dominant-baseline": "middle",
    });
    label.textContent = categoryLabel(band.label);
    bandGroup.appendChild(label);
  });
  svg.appendChild(bandGroup);

  const gridGroup = createSvgElement("g", { class: "grid" });
  [0, 25, 50, 75, 100].forEach((tick) => {
    const tickY = y(tick);
    appendLine(gridGroup, {
      x1: margin.left,
      x2: margin.left + plotWidth,
      y1: tickY,
      y2: tickY,
    });
    const label = createSvgElement("text", {
      x: margin.left - 14,
      y: tickY + 4,
      class: "axis-label y-label",
    });
    label.textContent = tick;
    gridGroup.appendChild(label);
  });

  [0.25, 0.5, 1, 2, 4, 8, 16, 32, 70, 120].forEach((tick) => {
    if (tick < Math.min(...sizes) * 0.7 || tick > Math.max(...sizes) * 1.45) return;
    const tickX = x(tick);
    appendLine(gridGroup, {
      x1: tickX,
      x2: tickX,
      y1: margin.top,
      y2: margin.top + plotHeight,
    });
    const label = createSvgElement("text", {
      x: tickX,
      y: margin.top + plotHeight + 34,
      class: "axis-label x-label",
    });
    label.textContent = `${tick}B`;
    gridGroup.appendChild(label);
  });
  svg.appendChild(gridGroup);

  const xTitle = createSvgElement("text", {
    x: margin.left + plotWidth / 2,
    y: height - 22,
    class: "axis-title",
  });
  xTitle.textContent = "Modellstørrelse (B parametre)";
  svg.appendChild(xTitle);

  const yTitle = createSvgElement("text", {
    x: 23,
    y: margin.top + plotHeight / 2,
    class: "axis-title",
    transform: `rotate(-90 23 ${margin.top + plotHeight / 2})`,
  });
  yTitle.textContent = mode.axis;
  svg.appendChild(yTitle);

  const pointGroup = createSvgElement("g", { class: "points" });
  models.forEach((model) => {
    const hash = hashAlias(model.alias);
    const jitterX = ((hash % 17) - 8) * 2.2;
    const jitterY = ((Math.floor(hash / 17) % 7) - 3) * 2;
    const score = modelScore(model);
    const point = createSvgElement("g", {
      class: `point ${model.alias === state.selectedAlias ? "selected" : ""}`,
      transform: `translate(${x(model.size_b) + jitterX} ${y(score) + jitterY})`,
      tabindex: "0",
      role: "button",
      "aria-label": `${model.name}, ${mode.label} ${scoreLabel(score)}, størrelse ${model.size_b}B`,
    });
    point.dataset.alias = model.alias;
    const title = createSvgElement("title");
    const band = bandFor(model);
    title.textContent = [
      model.name,
      `Score: ${scoreLabel(model.feighetsjustert_score)}`,
      `Rå: ${scoreLabel(model.dunning_kruger_score)}`,
      `Trekk: ${penaltyLabel(model)}`,
      `Kategori: ${categoryLabel(band.label)}`,
    ].join("\n");
    point.appendChild(title);
    appendChartIcon(point, model, model.alias === state.selectedAlias ? 18 : 16);

    point.addEventListener("click", () => selectModel(model.alias));
    point.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectModel(model.alias);
      }
    });
    pointGroup.appendChild(point);
  });
  svg.appendChild(pointGroup);
}

function renderDetail() {
  const model = data.models.find((row) => row.alias === state.selectedAlias) || data.models[0];
  const detail = document.getElementById("modelDetail");
  if (!model) return;
  const band = bandFor(model);
  detail.innerHTML = `
    <div class="model-card-head">
      <h3>${escapeHtml(model.name)}</h3>
      <div class="model-actions" aria-label="Vis eksempler for valgt modell">
        <button type="button" data-modal-view="hallucination_misses">Vis feil svar</button>
        <button type="button" data-modal-view="control_refusals">Vis trekk</button>
      </div>
    </div>
    <dl class="selected-stats" aria-label="Valgt modell">
      <div class="metric-primary"><dt>Score</dt><dd>${scoreLabel(model.feighetsjustert_score)}</dd></div>
      <div class="metric-secondary"><dt>Rå</dt><dd>${scoreLabel(model.dunning_kruger_score)}</dd></div>
      <div class="metric-tertiary"><dt>Trekk</dt><dd>${penaltyLabel(model)}</dd></div>
      <div class="metric-secondary"><dt>Kategori</dt><dd>${categoryLabel(band.label)}</dd></div>
    </dl>
  `;
  detail.querySelectorAll("[data-modal-view]").forEach((button) => {
    button.addEventListener("click", () => openExamplesModal(button.dataset.modalView));
  });
}

function exampleCardMarkup(example) {
  return `
    <article class="example-card">
      <p class="example-topic">${escapeHtml(example.topic || "Ukjent tema")} · ${escapeHtml(example.item_id || "")}</p>
      <h3>${escapeHtml(example.question || "")}</h3>
      <blockquote>${escapeHtml(example.response || "")}</blockquote>
      ${example.judge_note ? `<p class="judge-note">${escapeHtml(example.judge_note)}</p>` : ""}
    </article>
  `;
}

function closeExamplesModal() {
  const modal = document.getElementById("examplesModal");
  if (!modal) return;
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.removeAttribute("open");
  }
}

function openExamplesModal(view) {
  const modal = document.getElementById("examplesModal");
  const title = document.getElementById("examplesModalTitle");
  const subtitle = document.getElementById("examplesModalSubtitle");
  const body = document.getElementById("examplesModalBody");
  const model = data.models.find((row) => row.alias === state.selectedAlias) || data.models[0];
  if (!modal || !title || !subtitle || !body || !model) return;

  const examples = model.selected_examples || {};
  const rows = examples[view] || [];
  const isTrekk = view === "control_refusals";
  title.textContent = isTrekk ? "Trekk" : "Feil svar";
  subtitle.textContent = model.name;
  body.innerHTML = `
    <div class="examples-grid modal-examples">
      ${rows.length ? rows.map(exampleCardMarkup).join("") : `<p class="empty-examples">Ingen eksempler i denne kategorien.</p>`}
    </div>
  `;

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
}

function renderTable() {
  const body = document.getElementById("resultsTable");
  body.textContent = "";
  sortedModels().forEach((model, index) => {
    const band = bandFor(model);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <button class="model-cell" type="button" data-alias="${model.alias}">
          <span><strong>${index + 1}. ${model.name}</strong><small>${model.organization}</small></span>
        </button>
      </td>
      <td>${sizeLabel(model.size_b)}</td>
      <td class="score-cell"><strong>${scoreLabel(model.feighetsjustert_score)}</strong></td>
      <td>${scoreLabel(model.dunning_kruger_score)}</td>
      <td class="trekk-cell">${penaltyLabel(model)}</td>
      <td>
        <span class="category-cell">
          <span class="category-dot category-${slug(band.label)}"></span>
          ${categoryLabel(band.label)}
        </span>
      </td>
    `;
    body.appendChild(row);
  });

  body.querySelectorAll(".model-cell").forEach((button) => {
    button.addEventListener("click", () => selectModel(button.dataset.alias));
  });
}

function selectModel(alias) {
  state.selectedAlias = alias;
  renderChart();
  renderDetail();
  renderTable();
}

function selectScoreMode(mode) {
  if (!SCORE_MODES[mode] || state.scoreMode === mode) return;
  state.scoreMode = mode;
  document.querySelectorAll("[data-score-mode]").forEach((button) => {
    const isActive = button.dataset.scoreMode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  setSummary();
  renderChart();
  renderDetail();
  renderTable();
}

function init() {
  if (!data || !Array.isArray(data.models)) {
    document.body.innerHTML = "<main><p>Fant ikke resultatdata.</p></main>";
    return;
  }
  document.querySelectorAll("[data-score-mode]").forEach((button) => {
    button.addEventListener("click", () => selectScoreMode(button.dataset.scoreMode));
  });
  document.querySelector("[data-close-modal]")?.addEventListener("click", closeExamplesModal);
  document.getElementById("examplesModal")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeExamplesModal();
  });
  state.selectedAlias = sortedModels()[0]?.alias || null;
  setSummary();
  renderChart();
  renderDetail();
  renderTable();
}

init();
