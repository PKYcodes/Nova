// ---------- Ripple + rainbow bubble tap animation ----------
let bubbleLayer = document.querySelector(".bubble-layer");
if (!bubbleLayer) {
  bubbleLayer = document.createElement("div");
  bubbleLayer.className = "bubble-layer";
  document.body.appendChild(bubbleLayer);
}

// rainbow cycle: every tap gets the next hue around the wheel (golden-angle step
// gives a good, non-repeating spread of colors instead of a plain linear rainbow)
let bubbleHue = Math.floor(Math.random() * 360);
function nextBubbleColor() {
  bubbleHue = (bubbleHue + 137) % 360;
  return `hsl(${bubbleHue}, 92%, 66%)`;
}

export function addRipple(e, btn) {
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left - size / 2;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top - size / 2;
  const span = document.createElement("span");
  span.className = "ripple";
  span.style.width = span.style.height = `${size}px`;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  btn.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
}

// during very fast typing, cap how many bubbles can exist at once so the DOM
// never piles up and starts dropping frames (which was eating real key presses)
export function spawnBubbles(e, btn) {
  if (bubbleLayer.childElementCount > 36) return;
  const rect = btn.getBoundingClientRect();
  const cx = (e.touches ? e.touches[0].clientX : e.clientX) || rect.left + rect.width / 2;
  const cy = (e.touches ? e.touches[0].clientY : e.clientY) || rect.top + rect.height / 2;
  for (let i = 0; i < 3; i++) {
    const b = document.createElement("span");
    const isDrop = Math.random() > 0.4; // mostly water-drops, some plain round for variety
    b.className = "bubble " + (isDrop ? "drop" : "round");
    const color = nextBubbleColor();
    const size = 5 + Math.random() * 7;
    const dx = (Math.random() - 0.5) * 70;
    const dy = -(40 + Math.random() * 55);
    const dur = 450 + Math.random() * 300;
    const rot = Math.floor(Math.random() * 360);
    b.style.width = b.style.height = `${size}px`;
    b.style.left = `${cx - size / 2}px`;
    b.style.top = `${cy - size / 2}px`;
    b.style.background = color;
    b.style.color = color;
    b.style.setProperty("--bx", `${dx}px`);
    b.style.setProperty("--by", `${dy}px`);
    b.style.setProperty("--bdur", `${dur}ms`);
    b.style.setProperty("--brot", `${rot}deg`);
    bubbleLayer.appendChild(b);
    b.addEventListener("animationend", () => b.remove());
  }
}
