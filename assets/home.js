"use strict";

for (const level of window.SQUARES_INDEX) {
  const link = document.createElement("a");
  link.className = "tile";
  link.href = `n/${level.n}/index.html`;
  for (const [tag, text] of [["strong", `n = ${level.n}`], ["span", `L = ${level.best}`], ["small", level.optimal ? "Proven" : "Open"]]) {
    const item = document.createElement(tag);
    item.textContent = text;
    link.append(item);
  }
  document.getElementById("levels").append(link);
}
