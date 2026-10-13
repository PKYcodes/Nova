// ---------- Share a calculation as a branded image card ----------
import { showToast } from "./toast.js";

// Preload the dark-mode 'powered by RV GROUP' lockup image for the share card canvas
const poweredLogoImg = new Image();
let poweredLogoReady = false;
poweredLogoImg.onload = () => { poweredLogoReady = true; };
poweredLogoImg.src = "icons/rv-powered-dark.png";

function themeColor(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGlow(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color + "59"); // ~35% alpha
  g.addColorStop(1, color + "00");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  words.forEach((word) => {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function clampLines(ctx, lines, maxWidth, maxLines) {
  if (lines.length <= maxLines) return lines;
  const clamped = lines.slice(0, maxLines);
  let last = clamped[maxLines - 1];
  while (last.length && ctx.measureText(last + " …").width > maxWidth) {
    last = last.slice(0, -1).trimEnd();
  }
  clamped[maxLines - 1] = last + " …";
  return clamped;
}

function drawLines(ctx, lines, x, y, lineHeight) {
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

function generateShareCard({ expr, result, note, ts }) {
  const W = 900;
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d");

  const exprMaxWidth = W - 200;
  const exprLineHeight = 44;
  const maxExprLines = 20;
  mctx.font = "500 34px 'Courier New', monospace";
  const exprLines = clampLines(mctx, wrapText(mctx, expr, exprMaxWidth), exprMaxWidth, maxExprLines);

  const resultText = "= " + result;
  let resultFontSize = 92;
  mctx.font = `800 ${resultFontSize}px 'Courier New', monospace`;
  while (mctx.measureText(resultText).width > W - 160 && resultFontSize > 40) {
    resultFontSize -= 4;
    mctx.font = `800 ${resultFontSize}px 'Courier New', monospace`;
  }

  const titleY = 165;
  const exprStartY = 305;
  const exprBlockHeight = exprLineHeight * exprLines.length;
  const resultY = exprStartY + exprBlockHeight + 85;
  const noteY = resultY + 85;
  const footerGap = 110;
  const footerStartY = (note ? noteY : resultY) + footerGap;
  const H = Math.max(960, footerStartY + 190);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const cyan = themeColor("--cyan", "#33f2e8");
  const violet = themeColor("--violet", "#8a5cff");
  const pink = themeColor("--pink", "#ff4fd8");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#06070d");
  bg.addColorStop(1, "#0b0e1a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawGlow(ctx, 120, 120, 320, violet);
  drawGlow(ctx, W - 120, H - 160, 320, cyan);
  drawGlow(ctx, W - 150, 150, 220, pink);

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  roundRectPath(ctx, 60, 60, W - 120, H - 120, 36);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  roundRectPath(ctx, 60, 60, W - 120, H - 120, 36);
  ctx.stroke();

  ctx.textAlign = "center";

  ctx.fillStyle = violet;
  ctx.font = "700 30px 'Segoe UI', sans-serif";
  ctx.fillText("✦ NOVA CALCULATOR", W / 2, titleY);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 34px 'Courier New', monospace";
  drawLines(ctx, exprLines, W / 2, exprStartY, exprLineHeight);

  ctx.shadowColor = cyan;
  ctx.shadowBlur = 36;
  ctx.fillStyle = cyan;
  ctx.font = `800 ${resultFontSize}px 'Courier New', monospace`;
  ctx.fillText(resultText, W / 2, resultY);
  ctx.shadowBlur = 0;

  if (note) {
    ctx.fillStyle = "#ffb23d";
    ctx.font = "600 28px 'Segoe UI', sans-serif";
    ctx.fillText("🏷 " + note, W / 2, noteY);
  }

  // Timestamp
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.font = "400 21px 'Segoe UI', sans-serif";
  ctx.fillText(new Date(ts || Date.now()).toLocaleString(), W / 2, H - 195);

  // Draw '— powered by RV GROUP —' lockup
  if (poweredLogoReady && poweredLogoImg.naturalWidth > 0) {
    const logoW = 340;
    const logoH = Math.round(poweredLogoImg.naturalHeight * (logoW / poweredLogoImg.naturalWidth));
    ctx.drawImage(poweredLogoImg, (W - logoW) / 2, H - 172, logoW, logoH);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "italic 600 22px 'Segoe UI', sans-serif";
    ctx.fillText("— powered by RV GROUP —", W / 2, H - 138);
  }

  // Brand signature: RV Group LTD | ♥️ BY PANKAJ
  ctx.fillStyle = "rgba(238,242,255,0.82)";
  ctx.font = "700 22px 'Segoe UI', sans-serif";
  ctx.fillText("RV Group LTD | ♥️ BY PANKAJ", W / 2, H - 92);

  return canvas;
}

function guardCalc(calc) {
  if (!calc || !calc.expr || calc.result === undefined) {
    showToast("Share karne ke liye pehle koi calculation karo");
    return false;
  }
  return true;
}

export function shareAsImage(calc) {
  if (!guardCalc(calc)) return;
  const canvas = generateShareCard(calc);
  const shareText = `🧮 Nova Calculator\n${calc.expr} = ${calc.result}${calc.note ? "\n🏷 " + calc.note : ""}\nRV Group LTD | ♥️ BY PANKAJ`;

  // Native Android APK bridge support
  if (window.AndroidBridge && typeof window.AndroidBridge.shareImage === "function") {
    try {
      const dataUrl = canvas.toDataURL("image/png");
      window.AndroidBridge.shareImage(dataUrl, "Nova Calculator", shareText);
      return;
    } catch (e) {}
  }

  canvas.toBlob(async (blob) => {
    if (!blob) { showToast("Image banane mein dikkat hui"); return; }
    const file = new File([blob], "nova-calculation.png", { type: "image/png" });

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({ files: [file], title: "Nova Calculator", text: shareText });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nova-calculation.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Image download ho gayi");
  }, "image/png");
}

export async function shareViaWhatsApp(calc) {
  if (!guardCalc(calc)) return;
  const shareText = `🧮 Nova Calculator\n${calc.expr} = ${calc.result}${calc.note ? "\n🏷 " + calc.note : ""}\nRV Group LTD | ♥️ BY PANKAJ`;

  // Native Android APK bridge support (sends image + text directly to WhatsApp)
  if (window.AndroidBridge && typeof window.AndroidBridge.shareWhatsApp === "function") {
    try {
      const canvas = generateShareCard(calc);
      const dataUrl = canvas.toDataURL("image/png");
      window.AndroidBridge.shareWhatsApp(dataUrl, shareText);
      return;
    } catch (e) {}
  }

  if (navigator.share) {
    const canvas = generateShareCard(calc);
    const handled = await new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) { resolve(false); return; }
        const file = new File([blob], "nova-calculation.png", { type: "image/png" });
        if (navigator.canShare && !navigator.canShare({ files: [file] })) { resolve(false); return; }
        try {
          await navigator.share({ files: [file], title: "Nova Calculator", text: shareText });
          resolve(true);
        } catch (e) {
          resolve(e && e.name === "AbortError");
        }
      }, "image/png");
    });
    if (handled) return;
  }

  window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank", "noopener");
}
