"use strict";

window.SquaresGeometry = (() => {
function corners(p) {
  const c = Math.cos(p.angle), s = Math.sin(p.angle);
  return [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]
    .map(([x, y]) => [p.x + c * x - s * y, p.y + s * x + c * y]);
}

function overlaps(a, b, ca = corners(a), cb = corners(b)) {
  // Separating-axis test on both squares' edge normals. Edge contact is legal.
  for (const p of [a, b]) {
    const c = Math.cos(p.angle), s = Math.sin(p.angle);
    for (const [x, y] of [[c, s], [-s, c]]) {
      const pa = ca.map(v => v[0] * x + v[1] * y);
      const pb = cb.map(v => v[0] * x + v[1] * y);
      if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
    }
  }
  return true;
}

function inspect(state) {
  const vertices = state.pieces.map(corners);
  const outside = vertices.map(cs => cs.some(([x, y]) => x < 0 || y < 0 || x > state.side || y > state.side));
  const collision = state.pieces.map(() => false);
  for (let i = 0; i < state.pieces.length; i++) {
    for (let j = i + 1; j < state.pieces.length; j++) {
      if (overlaps(state.pieces[i], state.pieces[j], vertices[i], vertices[j])) collision[i] = collision[j] = true;
    }
  }
  const all = vertices.flat();
  const xs = all.map(v => v[0]), ys = all.map(v => v[1]);
  const side = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  return { vertices, outside, collision, side, legal: !outside.some(Boolean) && !collision.some(Boolean) };
}

return { corners, overlaps, inspect };
})();
