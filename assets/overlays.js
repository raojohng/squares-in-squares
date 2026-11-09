"use strict";

// One modal for all information. Native dialog provides focus trapping and Esc.
(() => {
  const dialog = document.getElementById("info-dialog");
  let opener;
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-panel]");
    if (!button) return;
    if (!dialog.open) opener = button;
    for (const panel of dialog.querySelectorAll(".dialog-body > section")) {
      panel.hidden = panel.id !== button.dataset.panel;
      if (!panel.hidden) document.getElementById("dialog-title").textContent = panel.dataset.title;
    }
    dialog.querySelector(".dialog-body").scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    document.getElementById("close-dialog").focus({ preventScroll: true });
  });
  document.getElementById("close-dialog").onclick = () => dialog.close();
  // The dialog box itself is the backdrop target. Its children are the drawer.
  let outside = false;
  dialog.addEventListener("pointerdown", event => { outside = event.target === dialog; });
  dialog.addEventListener("click", event => {
    if (outside && event.target === dialog) dialog.close();
    outside = false;
  });
  dialog.addEventListener("close", () => opener?.focus({ preventScroll: true }));
})();
