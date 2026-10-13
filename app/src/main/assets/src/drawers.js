// ---------- Generic drawer (bottom sheet) helpers ----------
// scrollEl: the inner scrollable content of the drawer (e.g. the history
// list). When provided, a downward drag only closes the drawer once that
// content is scrolled to its top — otherwise the same drag is just the
// user scrolling the list, not asking to dismiss it.
export function makeDrawerControls(drawerEl, backdropEl, handleEl, scrollEl) {
  function open() { drawerEl.classList.add("open"); backdropEl.classList.add("open"); }
  function close() { drawerEl.classList.remove("open"); backdropEl.classList.remove("open"); }
  backdropEl.addEventListener("click", close);
  if (handleEl) handleEl.addEventListener("click", close);
  enableSwipeToClose(drawerEl, close, scrollEl);
  return { open, close };
}

export function enableSwipeToClose(drawerEl, closeFn, scrollEl) {
  let startY = null;
  let dragging = false;
  drawerEl.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    // Only a candidate for "swipe to close" if the inner list is already
    // scrolled all the way to the top — otherwise this touch is scrolling.
    dragging = !scrollEl || scrollEl.scrollTop <= 0;
  }, { passive: true });
  drawerEl.addEventListener("touchmove", (e) => {
    if (startY === null) return;
    // The list may have been scrolled by this same gesture (e.g. rubber-band
    // past the top) — re-check on every move rather than only at the start.
    if (scrollEl && scrollEl.scrollTop > 0) { dragging = false; return; }
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 80) { closeFn(); startY = null; dragging = false; }
  }, { passive: true });
  drawerEl.addEventListener("touchend", () => { startY = null; dragging = false; }, { passive: true });
}
