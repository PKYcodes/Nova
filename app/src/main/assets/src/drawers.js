// ---------- Generic Drawer (Bottom Sheet) Helpers ----------

export function makeDrawerControls(drawerEl, backdropEl, handleEl, scrollEl) {
  function open() {
    drawerEl.classList.add("open");
    backdropEl.classList.add("open");

    // Guard: Prevent touch bleed / accidental long-press on input fields while sliding in
    const searchInput = drawerEl.querySelector("input");
    if (searchInput) {
      searchInput.style.pointerEvents = "none";
      setTimeout(() => { searchInput.style.pointerEvents = ""; }, 320);
    }
  }

  function close() {
    drawerEl.classList.remove("open");
    backdropEl.classList.remove("open");
    const searchInput = drawerEl.querySelector("input");
    if (searchInput) searchInput.blur();
  }

  backdropEl.addEventListener("click", close);
  if (handleEl) handleEl.addEventListener("click", close);

  // Attach swipe-to-close to handleEl only, so list scrolling is 100% smooth and never conflicts!
  if (handleEl) {
    enableHandleSwipeToClose(handleEl, close);
  }

  return { open, close };
}

function enableHandleSwipeToClose(handleEl, closeFn) {
  let startY = null;
  handleEl.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  handleEl.addEventListener("touchmove", (e) => {
    if (startY === null) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 60) {
      closeFn();
      startY = null;
    }
  }, { passive: true });

  handleEl.addEventListener("touchend", () => { startY = null; }, { passive: true });
}
