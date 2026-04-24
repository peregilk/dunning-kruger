const data = window.DK_RESULTS;

const state = {
  selectedAlias: data.models[0]?.alias,
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

function hashAlias(alias) {
  return [...alias].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
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

function badgeMarkup(model, extraClass = "") {
  const badge = model.badge || { initials: "LLM", accent: "#64748b", mark: "dot" };
  const textColor = hexLuminance(badge.accent) > 0.52 ? "#111827" : "#ffffff";
  return `
    <span class="badge ${extraClass}" style="--accent:${badge.accent};--badge-text:${textColor}" title="${model.organization}">
      <span class="badge-mark ${badge.mark}"></span>
      <span>${badge.initials}</span>
    </span>
  `;
}

function setSummary() {
  const best = data.models[0];
  const toughnessScores = data.models.map((model) => model.toffhet_score);
  const minTough = toughnessScores.length ? Math.min(...toughnessScores) : 0;
  const maxTough = toughnessScores.length ? Math.max(...toughnessScores) : 0;

  document.getElementById("publishedAt").textContent = `Publisert ${formatDate(data.published_at)}`;
  document.getElementById("modelCount").textContent = `${data.models.length} modeller`;
  document.getElementById("bestScore").textContent = best ? scoreLabel(best.dunning_kruger_score) : "-";
  document.getElementById("bestModel").textContent = best ? best.name : "-";
  document.getElementById("toughnessSpread").textContent = data.models.length
    ? `${scoreLabel(minTough)}-${scoreLabel(maxTough)}`
    : "-";
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

function appendBadgeSymbol(group, badge, color) {
  const common = {
    stroke: color,
    "stroke-width": 2.6,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
    opacity: 0.86,
  };

  if (badge.mark === "library") {
    [-8, 0, 8].forEach((x) =>
      group.appendChild(createSvgElement("rect", { x: x - 3, y: -10, width: 6, height: 20, rx: 1.2, fill: color, opacity: 0.72 })),
    );
    appendLine(group, { ...common, x1: -12, x2: 12, y1: 11, y2: 11 });
  } else if (badge.mark === "wind") {
    [-6, 0, 6].forEach((y, index) =>
      appendPath(group, { ...common, d: `M${-13 + index * 3} ${y} C -4 ${y - 5}, 5 ${y + 5}, 13 ${y}` }),
    );
  } else if (badge.mark === "diamond") {
    appendPath(group, { ...common, d: "M0 -14 L14 0 L0 14 L-14 0 Z" });
    appendPath(group, { ...common, d: "M0 -8 L8 0 L0 8 L-8 0 Z", opacity: 0.55 });
  } else if (badge.mark === "loop") {
    group.appendChild(createSvgElement("ellipse", { ...common, cx: -5, cy: 0, rx: 10, ry: 6, transform: "rotate(-22)" }));
    group.appendChild(createSvgElement("ellipse", { ...common, cx: 5, cy: 0, rx: 10, ry: 6, transform: "rotate(22)" }));
  } else if (badge.mark === "falcon") {
    appendPath(group, { fill: color, opacity: 0.82, d: "M-14 8 L-2 -13 L14 -9 L3 -1 L13 10 L-1 5 Z" });
  } else if (badge.mark === "cloud") {
    group.appendChild(createSvgElement("circle", { cx: -6, cy: 2, r: 8, fill: color, opacity: 0.72 }));
    group.appendChild(createSvgElement("circle", { cx: 4, cy: -2, r: 10, fill: color, opacity: 0.72 }));
    group.appendChild(createSvgElement("rect", { x: -14, y: 2, width: 28, height: 10, rx: 5, fill: color, opacity: 0.72 }));
  } else if (badge.mark === "nordic") {
    group.appendChild(createSvgElement("rect", { x: -15, y: -4, width: 30, height: 8, fill: color, opacity: 0.78 }));
    group.appendChild(createSvgElement("rect", { x: -7, y: -15, width: 8, height: 30, fill: color, opacity: 0.78 }));
  } else if (badge.mark === "wave") {
    appendPath(group, { ...common, d: "M-15 2 C-9 -8, -3 -8, 3 2 S13 12, 16 1" });
    appendPath(group, { ...common, d: "M-14 10 C-7 4, 2 4, 10 10", opacity: 0.55 });
  } else if (badge.mark === "book") {
    appendPath(group, { ...common, d: "M-14 -11 H-3 C1 -11, 2 -8, 2 -5 V12 C1 9, -2 8, -5 8 H-14 Z" });
    appendPath(group, { ...common, d: "M14 -11 H5 C1 -11, 0 -8, 0 -5 V12 C1 9, 4 8, 7 8 H14 Z" });
  } else if (badge.mark === "cross") {
    group.appendChild(createSvgElement("rect", { x: -5, y: -15, width: 10, height: 30, fill: color, opacity: 0.82 }));
    group.appendChild(createSvgElement("rect", { x: -15, y: -5, width: 30, height: 10, fill: color, opacity: 0.82 }));
  } else if (badge.mark === "route") {
    appendPath(group, { ...common, d: "M-11 8 C-3 -8, 4 13, 12 -7" });
    group.appendChild(createSvgElement("circle", { cx: -11, cy: 8, r: 4, fill: color, opacity: 0.86 }));
    group.appendChild(createSvgElement("circle", { cx: 12, cy: -7, r: 4, fill: color, opacity: 0.86 }));
  } else if (badge.mark === "spark") {
    appendPath(group, { ...common, d: "M0 -15 V15 M-15 0 H15 M-9 -9 L9 9 M9 -9 L-9 9" });
  } else if (badge.mark === "smile") {
    appendPath(group, { ...common, d: "M-12 1 C-7 11, 7 11, 12 1" });
    group.appendChild(createSvgElement("circle", { cx: -7, cy: -6, r: 2.2, fill: color }));
    group.appendChild(createSvgElement("circle", { cx: 7, cy: -6, r: 2.2, fill: color }));
  } else {
    group.appendChild(createSvgElement("circle", { r: 10, fill: color, opacity: 0.78 }));
  }
}

function appendChartIcon(point, model, radius) {
  const badge = model.badge || { initials: "LLM", accent: "#64748b", mark: "dot" };
  const textColor = hexLuminance(badge.accent) > 0.52 ? "#111827" : "#ffffff";
  const symbolColor = textColor === "#ffffff" ? "#ffffff" : "#111827";

  point.appendChild(createSvgElement("circle", { r: radius + 4, class: "point-halo" }));
  point.appendChild(createSvgElement("circle", { r: radius, fill: badge.accent, class: "point-disc" }));
  const mark = createSvgElement("g", { class: "point-symbol" });
  appendBadgeSymbol(mark, badge, symbolColor);
  point.appendChild(mark);

  const text = createSvgElement("text", {
    y: 4,
    class: "point-initials",
    fill: textColor,
  });
  text.textContent = badge.initials;
  point.appendChild(text);
}

function renderChart() {
  const svg = document.getElementById("scoreChart");
  svg.textContent = "";
  if (!data.models.length) return;

  const width = 1040;
  const height = 610;
  const margin = { top: 30, right: 36, bottom: 76, left: 96 };
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
      y: yTop + Math.max(22, (yBottom - yTop) / 2),
      class: "band-label",
    });
    label.textContent = band.label;
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
  xTitle.textContent = "Modellstørrelse, milliarder parametre";
  svg.appendChild(xTitle);

  const yTitle = createSvgElement("text", {
    x: 23,
    y: margin.top + plotHeight / 2,
    class: "axis-title",
    transform: `rotate(-90 23 ${margin.top + plotHeight / 2})`,
  });
  yTitle.textContent = "Dunning-Kruger-score";
  svg.appendChild(yTitle);

  const pointGroup = createSvgElement("g", { class: "points" });
  data.models.forEach((model) => {
    const hash = hashAlias(model.alias);
    const jitterX = ((hash % 17) - 8) * 2.2;
    const jitterY = ((Math.floor(hash / 17) % 7) - 3) * 2;
    const point = createSvgElement("g", {
      class: `point ${model.alias === state.selectedAlias ? "selected" : ""}`,
      transform: `translate(${x(model.size_b) + jitterX} ${y(model.dunning_kruger_score) + jitterY})`,
      tabindex: "0",
      role: "button",
      "aria-label": `${model.name}, DK-score ${model.dunning_kruger_score}, størrelse ${model.size_b}B`,
    });
    point.dataset.alias = model.alias;
    const title = createSvgElement("title");
    title.textContent = `${model.name}: ${scoreLabel(model.dunning_kruger_score)}`;
    point.appendChild(title);
    appendChartIcon(point, model, model.alias === state.selectedAlias ? 21 : 18);

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
  const topics = model.weakest_topics.map((row) => `${row.topic} (${row.failures})`).join(", ");
  detail.innerHTML = `
    ${badgeMarkup(model, "large")}
    <h3>${model.name}</h3>
    <p class="detail-meta">${model.organization} · ${model.family} · ${sizeLabel(model.size_b)}</p>
    <dl>
      <div><dt>DK-score</dt><dd>${scoreLabel(model.dunning_kruger_score)}</dd></div>
      <div><dt>Tøffhet</dt><dd>${scoreLabel(model.toffhet_score)}</dd></div>
      <div><dt>Feller besvart</dt><dd>${model.invalid_failures}/${model.total_items}</dd></div>
      <div><dt>Kontroller nektet</dt><dd>${model.control_refusals}/${model.total_items}</dd></div>
    </dl>
    <p><strong>${model.band}.</strong> ${model.band_description}</p>
    <p class="detail-meta">Mest krevende tema: ${topics || "ingen tydelig konsentrasjon"}.</p>
  `;
}

function renderTable() {
  const body = document.getElementById("resultsTable");
  body.textContent = "";
  data.models.forEach((model, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <button class="model-cell" type="button" data-alias="${model.alias}">
          ${badgeMarkup(model)}
          <span><strong>${index + 1}. ${model.name}</strong><small>${model.organization}</small></span>
        </button>
      </td>
      <td>${sizeLabel(model.size_b)}</td>
      <td><strong>${scoreLabel(model.dunning_kruger_score)}</strong></td>
      <td>${scoreLabel(model.toffhet_score)}</td>
      <td>${model.band}</td>
      <td>${model.weakest_topics.map((item) => item.topic).join(", ")}</td>
    `;
    body.appendChild(row);
  });

  body.querySelectorAll(".model-cell").forEach((button) => {
    button.addEventListener("click", () => selectModel(button.dataset.alias));
  });
}

function renderExamples() {
  const grid = document.getElementById("examplesGrid");
  grid.textContent = "";
  if (!data.examples.length) {
    const card = document.createElement("article");
    card.className = "example-card empty";
    card.innerHTML = `
      <p class="example-topic">Kommer ved full eksport</p>
      <h3>Eksempelskapet venter på flere scorede modeller</h3>
      <blockquote>Her legges korte, offentlige eval-eksempler inn når vi har plukket de mest illustrative feilene.</blockquote>
    `;
    grid.appendChild(card);
    return;
  }
  data.examples.forEach((example) => {
    const card = document.createElement("article");
    card.className = "example-card";
    card.innerHTML = `
      <p class="example-topic">${example.topic} · ${example.model_name}</p>
      <h3>${example.question}</h3>
      <blockquote>${example.response}</blockquote>
    `;
    grid.appendChild(card);
  });
}

function renderExcluded() {
  const target = document.getElementById("excludedModels");
  target.textContent = "";
  if (!data.excluded_models.length) {
    target.textContent = "Ingen.";
    return;
  }
  data.excluded_models.forEach((model) => {
    const item = document.createElement("article");
    item.className = "excluded-item";
    item.innerHTML = `
      <strong>${model.name}</strong>
      <span>${model.scored_items}/${model.total_items} rader · ${model.primary_error}</span>
    `;
    target.appendChild(item);
  });
}

function selectModel(alias) {
  state.selectedAlias = alias;
  renderChart();
  renderDetail();
}

function init() {
  if (!data || !Array.isArray(data.models)) {
    document.body.innerHTML = "<main><p>Fant ikke resultatdata.</p></main>";
    return;
  }
  setSummary();
  renderChart();
  renderDetail();
  renderTable();
  renderExamples();
  renderExcluded();
}

init();
