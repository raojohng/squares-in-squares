"use strict";

// Shared by every n; content and coordinates live in data/n<n>.js.
document.getElementById("app").innerHTML = `
  <header>
    <a class="wordmark" href="../../index.html" aria-label="Squares in Squares home">Squares in Squares</a>
    <h1 id="level-label"></h1>
    <nav aria-label="Levels">
      <a href="../../index.html">Home</a>
      <a id="previous" aria-label="Previous n">←</a>
      <a id="next" aria-label="Next n">→</a>
    </nav>
  </header>
  <div class="toolbar">
    <label class="chooser" for="packing-picker">Construction
      <select id="packing-picker"></select>
    </label>
    <div class="mode-switch" role="group" aria-label="Board mode">
      <button id="mode-study" type="button" aria-pressed="true">Explore</button>
      <button id="mode-game" type="button" aria-pressed="false">Game</button>
    </div>
  </div>
  <div class="metrics" aria-label="Packing measurements">
    <span>L <strong id="packing-side">—</strong></span>
    <span>Best <strong id="best-side">—</strong></span>
    <span>Contribution <strong id="score">—</strong></span>
    <span id="status" role="status" aria-live="polite"></span>
  </div>
  <section class="play-area" aria-label="Packing board">
    <svg id="board" tabindex="0" role="group" aria-label="Unit-square packing board">
      <defs><pattern id="grid" width="0.25" height="0.25" patternUnits="userSpaceOnUse">
        <path d="M .25 0 H 0 V .25" fill="none" stroke="#dce3dc" stroke-width="0.006"/>
      </pattern></defs>
      <rect id="container" x="0" fill="url(#grid)"/>
      <g id="pieces"></g>
    </svg>
  </section>
  <section id="game-controls" aria-label="Game controls" hidden>
    <div class="game-row">
      <label class="board-size" for="side">Board <input id="side" type="number" min="1" step="any"></label>
      <input id="side-slider" aria-label="Board side" type="range" min="1" step="0.01">
      <button id="loose-start" type="button">Loose start</button>
    </div>
    <div class="game-row">
      <label class="piece-choice" for="piece-picker">Square <select id="piece-picker"></select></label>
      <label class="coordinate">x<input id="piece-x" type="number" step="0.01"></label>
      <label class="coordinate">y<input id="piece-y" type="number" step="0.01"></label>
      <label class="coordinate">°<input id="piece-angle" type="number" step="1"></label>
      <button id="rotate-left" type="button" aria-label="Rotate counterclockwise 5 degrees">↶</button>
      <button id="rotate-right" type="button" aria-label="Rotate clockwise 5 degrees">↷</button>
    </div>
    <div class="game-row actions">
      <label class="snap"><input id="snap" type="checkbox" checked> Snap</label>
      <button id="undo" type="button" disabled>Undo</button>
      <button id="reset" type="button">Reset</button>
      <button id="export" type="button">Export CSV</button>
    </div>
  </section>
  <footer aria-label="Information">
    <button type="button" data-panel="proof-panel">Proof</button>
    <button type="button" data-panel="construction-panel">How it works</button>
    <button type="button" data-panel="pathways-panel">Pathways</button>
    <button type="button" data-panel="help-panel">Help</button>
  </footer>
  <dialog id="info-dialog" aria-labelledby="dialog-title">
    <div class="dialog-header"><h2 id="dialog-title"></h2><button id="close-dialog" type="button" aria-label="Close information">✕</button></div>
    <div class="dialog-body">
      <section id="proof-panel" data-title="Proof" hidden>
        <h3 id="result-title"></h3><p id="result-summary"></p><p id="attribution" class="note"></p>
        <div id="proof"></div><p id="proof-source" class="note"></p>
      </section>
      <section id="construction-panel" data-title="How it works" hidden>
        <p id="entry-kind" class="note"></p><h3 id="algorithm-title"></h3>
        <p id="algorithm-explanation"></p><p id="algorithm-length"></p>
        <ol id="algorithm-steps"></ol><p id="algorithm-source" class="note"></p>
      </section>
      <section id="pathways-panel" data-title="Pathways" hidden>
        <p id="algorithm-transfer"></p><ul id="pathways-list"></ul>
        <p id="pathways-source" class="note"></p>
      </section>
      <section id="help-panel" data-title="Help" hidden>
        <p id="mode-help"></p>
        <p>In Game, drag a square to move it; drag its round handle to rotate. Arrow keys move; Q / E rotate. Hold Shift for fine steps. Snap uses 0.05 units and 5°.</p>
        <p>Coordinates start at the bottom left; positive angles turn counterclockwise. Temporary conflicts are allowed. Undo reverses a move; Reset restores the selected packing. Explore restores its certified coordinates.</p>
        <p id="score-formula"></p><p>Touching is legal; overlapping interiors are not. Board side is the available space; L measures the packing’s span.</p>
        <p>Export CSV saves this n, with angles in radians. Browser legality is a preview; certify exports with <code>site/tools/check_export.py</code>.</p>
        <div class="button-row"><button type="button" data-panel="sources-panel">Sources</button><button type="button" data-panel="gate-panel">Gate details</button></div>
      </section>
      <section id="sources-panel" data-title="Sources" hidden>
        <p id="result-source"></p><p id="snapshot-source"></p>
        <p>Public-best snapshots are dated CSV imports, not live leaderboard queries.</p>
      </section>
      <section id="gate-panel" data-title="Gate details" hidden>
        <p id="verification"></p><p id="gate-status"></p><p id="comparison"></p><p id="gate-hash" class="note"></p>
      </section>
    </div>
  </dialog>
`;
