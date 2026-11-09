"use strict";

const LEVEL = window.SQUARES_LEVEL;
const { inspect } = window.SquaresGeometry;
const $ = id => document.getElementById(id);
const svg = $("board");
const NS = "http://www.w3.org/2000/svg";
const TOP = Math.max(3.2, ...LEVEL.packings.map(p => p.board * 1.12)); // Shared coordinate origin for all saved entries.
const DEG = Math.PI / 180;
let state, selected = 0, gesture = null, viewSide;
const history = [];
let playing = false, activePacking = LEVEL.packings[0];

function format(value) { return Number(value.toFixed(12)).toString(); }

function sourceLink(parent, source) {
  const a = document.createElement("a");
  a.href = source.url;
  a.textContent = source.label;
  parent.replaceChildren(a);
}

function paragraphList(parent, strings, tag = "p") {
  parent.replaceChildren(...strings.map(text => {
    const p = document.createElement(tag);
    p.textContent = text;
    return p;
  }));
}

function explain(entry) {
  $("entry-kind").textContent = { algorithm: "CONSTRUCTION", public: "PUBLIC-BEST SNAPSHOT", practice: "PRACTICE SEED" }[entry.kind];
  $("algorithm-title").textContent = entry.title;
  $("algorithm-explanation").textContent = entry.explanation;
  $("algorithm-length").textContent = `Certified L = ${format(entry.L)}`;
  $("algorithm-length").title = entry.L_text;
  sourceLink($("algorithm-source"), entry.source);
  if (entry.date) $("algorithm-source").append(document.createTextNode(` · ${entry.date}`));
  $("verification").textContent = "Saved entry: official gate PASS · exact CSV + pandas round trip";
  $("verification").title = `Saved entry SHA256 ${entry.verification.sha256}`;
  if (entry.kind === "public") {
    $("verification").append(document.createTextNode(`. Original source L = ${Number(entry.source_L_text).toPrecision(14)}. Public-best snapshot from ${entry.source.label}, ${entry.date}.`));
  }
  $("gate-hash").textContent = `Saved entry SHA256 ${entry.verification.sha256}`;
  paragraphList($("algorithm-steps"), entry.steps, "li");
  $("algorithm-transfer").textContent = entry.transfer;
  $("packing-picker").value = entry.id;
}

function loadPacking(entry, clearHistory = true) {
  activePacking = entry;
  state = { side: entry.board, pieces: entry.pieces.map(p => ({ ...p })) };
  selected = 0;
  gesture = null;
  viewSide = entry.board;
  if (clearHistory) history.length = 0;
  explain(entry);
  mountPieces();
  render();
}

function setMode(game) {
  playing = game;
  gesture = null;
  $("mode-study").setAttribute("aria-pressed", !playing);
  $("mode-game").setAttribute("aria-pressed", playing);
  $("game-controls").hidden = !playing;
  $("mode-help").textContent = playing
    ? (LEVEL.optimal ? `Match L = ${LEVEL.best}. It is proven optimal, so beating it is impossible.` : `Try to beat L = ${LEVEL.best}; certify any candidate export.`)
    : "Explore a certified construction, then try it yourself.";
  svg.classList.toggle("playing", playing);
  for (const id of ["side", "side-slider", "piece-x", "piece-y", "piece-angle", "rotate-left", "rotate-right", "snap", "reset"]) $(id).disabled = !playing;
  if (!playing) loadPacking(activePacking); // Study always shows the certified source.
  else render();
}

function initialise() {
  document.title = `Squares in Squares · n = ${LEVEL.n}`;
  $("level-label").textContent = `n = ${LEVEL.n}`;
  const levels = window.SQUARES_INDEX;
  const at = levels.findIndex(level => level.n === LEVEL.n);
  for (const [id, offset] of [["previous", -1], ["next", 1]]) {
    const target = levels[at + offset];
    if (target) $(id).href = `../${target.n}/index.html`;
    else $(id).setAttribute("aria-disabled", "true");
  }
  $("best-side").textContent = format(LEVEL.best);
  $("result-title").textContent = `L(${LEVEL.n}) = ${LEVEL.best} · ${LEVEL.optimal ? "proven optimal" : "best known"}`;
  $("result-summary").textContent = LEVEL.result;
  $("attribution").textContent = LEVEL.attribution;
  sourceLink($("result-source"), LEVEL.source);
  sourceLink($("proof-source"), LEVEL.source);
  paragraphList($("proof"), LEVEL.proof);
  paragraphList($("pathways-list"), LEVEL.pathways, "li");
  if (LEVEL.pathways_source) sourceLink($("pathways-source"), LEVEL.pathways_source);
  const publicEntry = LEVEL.packings.find(entry => entry.kind === "public");
  sourceLink($("snapshot-source"), publicEntry.source);
  $("snapshot-source").append(document.createTextNode(` · public-best snapshot, ${publicEntry.date}`));
  $("score-formula").textContent = `Contribution = measured side / √${LEVEL.n} − 1. Total score sums these contributions for n = 1…1000. Empty board space does not count.`;
  svg.setAttribute("aria-label", `${LEVEL.n} unit squares. Game mode enables dragging and keyboard controls.`);
  $("grid").setAttribute("y", TOP);
  for (const id of ["side", "side-slider"]) $(id).max = TOP;
  for (const entry of LEVEL.packings) {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = entry.title;
    $("packing-picker").append(option);
  }
  $("packing-picker").onchange = () => loadPacking(LEVEL.packings.find(entry => entry.id === $("packing-picker").value));
  $("mode-study").onclick = () => setMode(false);
  $("mode-game").onclick = () => setMode(true);
  const loose = LEVEL.packings.find(p => p.kind === "practice");
  $("loose-start").hidden = !loose;
  $("loose-start").onclick = () => { loadPacking(loose); setMode(true); svg.focus({ preventScroll: true }); };
  loadPacking(activePacking);
  setMode(false);
}

function snapshot() { return JSON.parse(JSON.stringify(state)); }
function remember() {
  history.push(snapshot());
  if (history.length > 100) history.shift();
}

function element(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent.appendChild(node);
  return node;
}

function mountPieces() {
  $("pieces").replaceChildren();
  $("piece-picker").replaceChildren();
  state.pieces.forEach((p, i) => {
    const group = element("g", { "data-piece": i, class: "piece" }, $("pieces"));
    element("title", {}, group).textContent = `Square ${i + 1}`;
    element("polygon", {}, group);
    element("text", { "text-anchor": "middle", "dominant-baseline": "central" }, group).textContent = i + 1;
    element("line", { class: "stem" }, group);
    element("circle", { class: "handle", "data-rotate": "true", r: 0.075 }, group);
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i + 1;
    $("piece-picker").appendChild(option);
  });
}

function render() {
  const result = inspect(state);
  // Fill the viewport in Explore. During play, keep the scale as the board shrinks.
  viewSide = Math.max(viewSide, state.side);
  const margin = playing ? .38 : .09;
  svg.setAttribute("viewBox", `${-margin} ${TOP - viewSide - margin} ${viewSide + 2 * margin} ${viewSide + 2 * margin}`);
  $("container").setAttribute("y", TOP - state.side);
  $("container").setAttribute("width", state.side);
  $("container").setAttribute("height", state.side);
  [...$("pieces").children].forEach((group, i) => {
    const p = state.pieces[i], active = i === selected;
    group.classList.toggle("selected", active);
    group.classList.toggle("invalid", result.outside[i] || result.collision[i]);
    group.classList.toggle("outside", result.outside[i]);
    group.querySelector("polygon").setAttribute("points", result.vertices[i].map(([x, y]) => `${x},${TOP - y}`).join(" "));
    const label = group.querySelector("text");
    label.setAttribute("x", p.x);
    label.setAttribute("y", TOP - p.y);
    const dx = -Math.sin(p.angle), dy = Math.cos(p.angle);
    const stem = group.querySelector("line"), handle = group.querySelector("circle");
    stem.setAttribute("x1", p.x + dx * 0.5);
    stem.setAttribute("y1", TOP - p.y - dy * 0.5);
    stem.setAttribute("x2", p.x + dx * 0.75);
    stem.setAttribute("y2", TOP - p.y - dy * 0.75);
    handle.setAttribute("cx", p.x + dx * 0.75);
    handle.setAttribute("cy", TOP - p.y - dy * 0.75);
    stem.style.display = handle.style.display = active && playing ? "" : "none";
    group.querySelector("title").textContent = `Square ${i + 1}${result.collision[i] ? ": overlap" : ""}${result.outside[i] ? ": outside board" : ""}`;
  });
  $("piece-picker").value = selected;
  $("side").value = state.side;
  $("side-slider").value = state.side;
  const p = state.pieces[selected];
  $("piece-x").value = p.x;
  $("piece-y").value = p.y;
  $("piece-angle").value = Number((p.angle / DEG).toFixed(8));
  $("packing-side").textContent = format(result.side);
  $("packing-side").title = String(result.side);
  const contribution = result.side / Math.sqrt(LEVEL.n) - 1;
  $("score").textContent = result.legal ? Number(contribution.toPrecision(7)).toString() : "—";
  $("score").title = result.legal ? String(contribution) : "Invalid packing";
  const issues = [];
  result.collision.forEach((yes, i) => { if (yes) issues.push(`Square ${i + 1} overlaps`); });
  result.outside.forEach((yes, i) => { if (yes) issues.push(`Square ${i + 1} is outside`); });
  let title, detail;
  if (!result.legal) {
    title = "Keep exploring";
    detail = issues.join(" · ") + ".";
  } else if (result.side < LEVEL.best) {
    title = LEVEL.optimal ? "Below the proven bound · check the geometry" : "Candidate improvement · certify your CSV";
    detail = LEVEL.optimal ? "A true improvement is impossible. Browser arithmetic is not certification; run the official gate on your export." : "Browser geometry looks legal. The official gate must verify this result.";
  } else if (result.side === LEVEL.best) {
    title = LEVEL.optimal ? "Solved · proven optimum reached" : "Solved · best known side reached";
    detail = "Measured side reaches the target, even if the board has unused space.";
  } else {
    title = "Solved · legal packing";
    detail = `All squares fit. Keep shrinking the board toward L = ${LEVEL.best}.`;
  }
  const status = $("status");
  // Avoid repeated live-region announcements while dragging within the same state.
  if (status.dataset.message !== title + detail) {
    status.dataset.message = title + detail;
    status.textContent = !result.legal ? (result.collision.some(Boolean) ? "Overlap" : "Outside")
      : result.side < LEVEL.best ? "Check" : result.side === LEVEL.best ? (LEVEL.optimal ? "Optimal" : "At best") : "Legal";
    status.title = `${title}. ${detail}`;
  }
  status.classList.toggle("invalid", !result.legal);
  $("gate-status").textContent = `Browser preview: ${title}. ${detail}`;
  $("comparison").textContent = !result.legal ? "Invalid packing · no score or improvement yet."
    : LEVEL.optimal ? `L ≥ ${LEVEL.best} is proven: a better score is impossible.${result.side > LEVEL.best ? ` Current side is ${format(result.side - LEVEL.best)} above the bound.` : ""}`
    : result.side < LEVEL.best ? "Your legal preview beats the best known L. Export and certify it." : "Your packing has not beaten the best known L.";
  $("export").disabled = !result.legal;
  $("undo").disabled = !playing || history.length === 0;
}


function position(event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const local = point.matrixTransform(svg.getScreenCTM().inverse());
  return { x: local.x, y: TOP - local.y };
}

function snap(value, step) { return Number((Math.round(value / step) * step).toFixed(12)); }
function angle(value) {
  // A square is unchanged by quarter turns; axis-aligned squares export exact 0.
  const period = Math.PI / 2;
  const nearest = Math.round(value / period) * period;
  if (Math.abs(value - nearest) <= 4 * Number.EPSILON * Math.max(1, Math.abs(value))) return 0;
  let a = ((value + period / 2) % period + period) % period - period / 2;
  if (Math.abs(a) < 1e-14) a = 0;
  return a;
}

svg.addEventListener("pointerdown", event => {
  if (!playing || gesture || (event.pointerType === "mouse" && event.button !== 0)) return;
  const group = event.target.closest("[data-piece]");
  if (!group) return;
  event.preventDefault();
  selected = Number(group.dataset.piece);
  remember();
  const at = position(event), p = state.pieces[selected];
  gesture = {
    id: event.pointerId, rotate: event.target.hasAttribute("data-rotate"),
    at, piece: { ...p }, bearing: Math.atan2(at.y - p.y, at.x - p.x),
  };
  svg.setPointerCapture(event.pointerId);
  svg.focus({ preventScroll: true });
  render();
});

svg.addEventListener("pointermove", event => {
  if (!gesture || event.pointerId !== gesture.id) return;
  const at = position(event), p = state.pieces[selected], start = gesture.piece;
  const snapping = $("snap").checked && !event.shiftKey;
  if (gesture.rotate) {
    const a = start.angle + Math.atan2(at.y - p.y, at.x - p.x) - gesture.bearing;
    p.angle = angle(snapping ? Math.round(a / (5 * DEG)) * 5 * DEG : a);
  } else {
    const x = start.x + at.x - gesture.at.x, y = start.y + at.y - gesture.at.y;
    p.x = snapping ? snap(x, 0.05) : x;
    p.y = snapping ? snap(y, 0.05) : y;
  }
  render();
});
function endGesture(event) {
  if (!gesture || event.pointerId !== gesture.id) return;
  gesture = null;
  if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
}
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) svg.addEventListener(type, endGesture);

function setSide(input) {
  if (!input.validity.valid || input.value === "") {
    input.value = state.side;
    return;
  }
  const value = Number(input.value);
  if (!Number.isFinite(value) || value === state.side) return;
  remember();
  state.side = value;
  render();
}
$("piece-picker").onchange = () => { selected = Number($("piece-picker").value); render(); };
$("side").addEventListener("change", () => setSide($("side")));
$("side-slider").addEventListener("input", () => setSide($("side-slider")));
for (const [id, key] of [["piece-x", "x"], ["piece-y", "y"], ["piece-angle", "angle"]]) {
  $(id).addEventListener("change", () => {
    const input = $(id), value = Number(input.value);
    // Keep exports within the official parser's coordinate bounds.
    if (!input.value || !Number.isFinite(value) || (key !== "angle" && Math.abs(value) > 100)) return render();
    remember();
    state.pieces[selected][key] = key === "angle" ? angle(value * DEG) : value;
    render();
  });
}
function rotate(delta) {
  remember();
  state.pieces[selected].angle = angle(state.pieces[selected].angle + delta);
  render();
}
$("rotate-left").onclick = () => rotate(5 * DEG);
$("rotate-right").onclick = () => rotate(-5 * DEG);
document.addEventListener("keydown", event => {
  if (!playing || $("info-dialog").open || event.target.closest("input, textarea, select, button, a, summary") || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase(), step = event.shiftKey ? 0.01 : 0.05;
  const moves = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, step], arrowdown: [0, -step] };
  if (moves[key]) {
    event.preventDefault();
    remember();
    const p = state.pieces[selected], [dx, dy] = moves[key];
    p.x = Number((p.x + dx).toFixed(12));
    p.y = Number((p.y + dy).toFixed(12));
    render();
  } else if (key === "q" || key === "e") {
    event.preventDefault();
    rotate((key === "q" ? 1 : -1) * (event.shiftKey ? 1 : 5) * DEG);
  }
});
$("undo").onclick = () => {
  if (!history.length) return;
  gesture = null;
  state = history.pop();
  render();
};
$("reset").onclick = () => { remember(); loadPacking(activePacking, false); };

function exportCSV() {
  // Preserve JS number precision: never round displayed decimals into the export.
  return "id,n,square_id,x,y,angle\n" + state.pieces.map((p, i) =>
    [`${LEVEL.n}_${i}`, LEVEL.n, i, p.x, p.y, p.angle].join(",")
  ).join("\n") + "\n";
}
$("export").onclick = () => {
  if (!inspect(state).legal) return;
  const url = URL.createObjectURL(new Blob([exportCSV()], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `squares-n${LEVEL.n}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
initialise();
