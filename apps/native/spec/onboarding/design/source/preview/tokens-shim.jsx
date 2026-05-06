// preview/tokens-shim.jsx
// Translates the no-vain-years Tailwind class names used in the RN .tsx
// source files into plain CSS-in-JS lookups, so the preview can render
// without a real Tailwind build. Keep in sync with tailwind.config.js.

const NVY_TOKENS = {
  color: {
    "brand-50":  "#EEF3FE",  "brand-100": "#D5E0FC", "brand-200": "#ABC1F9",
    "brand-300": "#7DA0F5",  "brand-400": "#4F7EEF", "brand-500": "#2456E5",
    "brand-600": "#1D47C2",  "brand-700": "#173BA0", "brand-soft": "#E8EEFD",
    "ink":        "#1A1A1A", "ink-muted":  "#666666", "ink-subtle": "#999999",
    "line":       "#E5E7EB", "line-strong": "#D1D5DB", "line-soft": "#EEF0F3",
    "surface":    "#FFFFFF", "surface-alt": "#F9F9F9", "surface-sunken": "#F2F4F7",
    "ok":         "#10B981", "ok-soft":     "#E7F8F1",
    "err":        "#EF4444", "err-soft":    "#FDECEC",
    "warn":       "#F59E0B", "warn-soft":   "#FEF3DC",
    "white":      "#FFFFFF", "transparent": "transparent",
  },
  // spacing tokens (px). Match tailwind.config.js's spacing extension.
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48, "3xl": 64 },
  // numeric ramp Tailwind already gives (rem*4). Used by p-3, mt-7 etc.
  num: { 0:0, 0.5:2, 1:4, 1.5:6, 2:8, 2.5:10, 3:12, 3.5:14, 4:16, 5:20, 6:24, 7:28, 8:32, 9:36, 10:40, 11:44, 12:48, 14:56, 16:64, 18:72, 20:80, 24:96, 32:128 },
  radius: { none: 0, sm: 8, md: 12, lg: 16, xl: 20, "2xl": 16, "3xl": 24, full: 9999 },
  fontSize: {
    "[10px]": 10, "[11px]": 11, "[8px]": 8,
    xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30,
  },
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  shadow: {
    card: "0 1px 2px 0 rgba(17,24,39,.05), 0 1px 3px 0 rgba(17,24,39,.04)",
    cta:  "0 4px 12px -2px rgba(36,86,229,0.25)",
  },
  tracking: { tight: "-0.015em", tighter: "-0.025em", wide: "0.025em", wider: "0.05em", widest: "0.1em" },
};

// Parse a NativeWind-style className string into a flat React style object.
// Only handles the subset actually used by our LoginScreen .tsx files.
function nvyParseClasses(classNames) {
  if (!classNames) return {};
  const style = {};
  const tokens = String(classNames).split(/\s+/).filter(Boolean);
  for (const t of tokens) applyToken(t, style);
  return style;
}

function applyToken(t, s) {
  // ---- layout ----
  if (t === "flex-1") { s.flex = 1; return; }
  if (t === "flex-row") { s.display = "flex"; s.flexDirection = "row"; return; }
  if (t === "flex-col") { s.display = "flex"; s.flexDirection = "column"; return; }
  if (t === "flex-wrap") { s.flexWrap = "wrap"; return; }
  if (t === "items-start") { s.alignItems = "flex-start"; return; }
  if (t === "items-center") { s.alignItems = "center"; return; }
  if (t === "items-end") { s.alignItems = "flex-end"; return; }
  if (t === "justify-start") { s.justifyContent = "flex-start"; return; }
  if (t === "justify-center") { s.justifyContent = "center"; return; }
  if (t === "justify-between") { s.justifyContent = "space-between"; return; }
  if (t === "justify-end") { s.justifyContent = "flex-end"; return; }
  if (t === "self-center") { s.alignSelf = "center"; return; }
  if (t === "relative") { s.position = "relative"; return; }
  if (t === "absolute") { s.position = "absolute"; return; }
  if (t === "overflow-hidden") { s.overflow = "hidden"; return; }
  if (t === "leading-none") { s.lineHeight = 1; return; }
  if (t === "leading-snug") { s.lineHeight = 1.4; return; }
  if (t === "leading-relaxed") { s.lineHeight = 1.6; return; }
  if (t === "tracking-tight") { s.letterSpacing = "-0.015em"; return; }
  if (t === "tracking-wide") { s.letterSpacing = "0.025em"; return; }
  if (t === "tracking-wider") { s.letterSpacing = "0.05em"; return; }
  if (t === "tracking-widest") { s.letterSpacing = "0.1em"; return; }
  if (t === "text-center") { s.textAlign = "center"; return; }
  if (t === "drop-shadow-sm") { s.filter = "drop-shadow(0 1px 1px rgba(0,0,0,.05))"; return; }

  // ---- gap ----
  let m;
  if ((m = t.match(/^gap-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.gap = v; return; }
  if ((m = t.match(/^gap-x-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.columnGap = v; return; }
  if ((m = t.match(/^gap-y-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.rowGap = v; return; }

  // ---- padding / margin ----
  if ((m = t.match(/^p-(\S+)$/)))  { const v = sizeFor(m[1]); if (v != null) s.padding = v; return; }
  if ((m = t.match(/^px-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) { s.paddingLeft = v; s.paddingRight = v; } return; }
  if ((m = t.match(/^py-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) { s.paddingTop = v; s.paddingBottom = v; } return; }
  if ((m = t.match(/^pt-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.paddingTop = v; return; }
  if ((m = t.match(/^pb-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.paddingBottom = v; return; }
  if ((m = t.match(/^pl-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.paddingLeft = v; return; }
  if ((m = t.match(/^pr-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.paddingRight = v; return; }
  if ((m = t.match(/^m-(\S+)$/)))  { const v = sizeFor(m[1]); if (v != null) s.margin = v; return; }
  if ((m = t.match(/^mx-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) { s.marginLeft = v; s.marginRight = v; } return; }
  if ((m = t.match(/^my-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) { s.marginTop = v; s.marginBottom = v; } return; }
  if ((m = t.match(/^mt-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.marginTop = v; return; }
  if ((m = t.match(/^mb-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.marginBottom = v; return; }
  if ((m = t.match(/^ml-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.marginLeft = v; return; }
  if ((m = t.match(/^mr-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.marginRight = v; return; }

  // ---- width / height ----
  if ((m = t.match(/^w-(\S+)$/))) { const v = wOrH(m[1], "w"); if (v != null) s.width = v; return; }
  if ((m = t.match(/^h-(\S+)$/))) { const v = wOrH(m[1], "h"); if (v != null) s.height = v; return; }
  if ((m = t.match(/^max-w-(\S+)$/))) { const v = maxW(m[1]); if (v != null) s.maxWidth = v; return; }
  if (t === "h-px") { s.height = 1; return; }
  if (t === "w-px") { s.width = 1; return; }

  // ---- positioning ----
  if ((m = t.match(/^top-(\S+)$/)))    { const v = sizeFor(m[1]); if (v != null) s.top = v; return; }
  if ((m = t.match(/^bottom-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.bottom = v; return; }
  if ((m = t.match(/^left-(\S+)$/)))   { const v = sizeFor(m[1]); if (v != null) s.left = v; return; }
  if ((m = t.match(/^right-(\S+)$/)))  { const v = sizeFor(m[1]); if (v != null) s.right = v; return; }
  if ((m = t.match(/^-top-(\S+)$/)))    { const v = sizeFor(m[1]); if (v != null) s.top = -v; return; }
  if ((m = t.match(/^-bottom-(\S+)$/))) { const v = sizeFor(m[1]); if (v != null) s.bottom = -v; return; }
  if ((m = t.match(/^-translate-x-1\/2$/))) { s.transform = (s.transform || "") + " translateX(-50%)"; return; }
  if ((m = t.match(/^left-1\/2$/))) { s.left = "50%"; return; }

  // ---- background / text colors ----
  if ((m = t.match(/^bg-(.+)$/))) {
    const c = colorOrAlpha(m[1]);
    if (c) s.backgroundColor = c;
    return;
  }
  if ((m = t.match(/^text-(.+)$/))) {
    // text- can be size, weight, or color
    if (NVY_TOKENS.fontSize[m[1]] != null) { s.fontSize = NVY_TOKENS.fontSize[m[1]]; return; }
    if (m[1] === "white") { s.color = "#fff"; return; }
    const c = colorOrAlpha(m[1]);
    if (c) s.color = c;
    return;
  }
  if ((m = t.match(/^font-(\S+)$/))) {
    if (m[1] === "sans") { s.fontFamily = 'Inter, "Noto Sans SC", -apple-system, sans-serif'; return; }
    if (m[1] === "mono") { s.fontFamily = '"JetBrains Mono", "SF Mono", Menlo, monospace'; return; }
    if (NVY_TOKENS.fontWeight[m[1]]) { s.fontWeight = NVY_TOKENS.fontWeight[m[1]]; return; }
    return;
  }

  // ---- border ----
  if (t === "border")    { s.borderWidth = 1; s.borderStyle = "solid"; if (!s.borderColor) s.borderColor = NVY_TOKENS.color.line; return; }
  if (t === "border-b")  { s.borderBottomWidth = 1; s.borderStyle = "solid"; if (!s.borderColor) s.borderColor = NVY_TOKENS.color.line; return; }
  if (t === "border-t")  { s.borderTopWidth = 1; s.borderStyle = "solid"; if (!s.borderColor) s.borderColor = NVY_TOKENS.color.line; return; }
  if ((m = t.match(/^border-\[([\d.]+)px\]$/))) { s.borderWidth = parseFloat(m[1]); s.borderStyle = "solid"; return; }
  if ((m = t.match(/^border-(.+)$/))) {
    const c = colorOrAlpha(m[1]);
    if (c) s.borderColor = c;
    return;
  }

  // ---- radius ----
  if (t === "rounded-full")   { s.borderRadius = 9999; return; }
  if (t === "rounded-sm")     { s.borderRadius = 4; return; }
  if (t === "rounded")        { s.borderRadius = 6; return; }
  if (t === "rounded-md")     { s.borderRadius = 12; return; }
  if (t === "rounded-lg")     { s.borderRadius = 16; return; }
  if (t === "rounded-xl")     { s.borderRadius = 12; return; }
  if (t === "rounded-2xl")    { s.borderRadius = 16; return; }
  if (t === "rounded-3xl")    { s.borderRadius = 24; return; }
  if ((m = t.match(/^rounded-\[(\d+)px\]$/))) { s.borderRadius = parseFloat(m[1]); return; }

  // ---- shadow ----
  if (t === "shadow-sm")   { s.boxShadow = NVY_TOKENS.shadow.card; return; }
  if (t === "shadow-card") { s.boxShadow = NVY_TOKENS.shadow.card; return; }
  if (t === "shadow-cta")  { s.boxShadow = NVY_TOKENS.shadow.cta; return; }

  // ---- opacity ----
  if ((m = t.match(/^opacity-(\d+)$/))) { s.opacity = parseInt(m[1], 10) / 100; return; }

  // fractions
  if (t === "w-1/3") { s.width = "33.333%"; return; }
  if (t === "w-1/2") { s.width = "50%"; return; }
  if (t === "w-2/3") { s.width = "66.666%"; return; }
  if (t === "w-3/4") { s.width = "75%"; return; }

  // active: / focus: / disabled: variants are best-effort no-ops in preview
  if (/^(active|focus|disabled|md|hover):/.test(t)) return;
}

function sizeFor(token) {
  // ink/brand etc. won't reach here — sizeFor is for spacing-like tokens.
  if (NVY_TOKENS.space[token] != null) return NVY_TOKENS.space[token];
  if (token in NVY_TOKENS.num) return NVY_TOKENS.num[token];
  const m = String(token).match(/^\[(\d+)px\]$/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function wOrH(token, axis) {
  if (token === "full") return "100%";
  if (token === "auto") return "auto";
  return sizeFor(token);
}
function maxW(token) {
  const map = { xs: 320, sm: 384, md: 448, lg: 512, xl: 576, "2xl": 672, "[1700px]": 1700 };
  if (map[token] != null) return map[token];
  const m = token.match(/^\[(\d+)px\]$/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function colorOrAlpha(token) {
  // alpha syntax: white/30, ink-subtle/30, brand-200/40
  const m = token.match(/^(.+)\/(\d+)$/);
  if (m) {
    const base = NVY_TOKENS.color[m[1]] || (m[1] === "white" ? "#FFFFFF" : null);
    if (!base) return null;
    return hexToRgba(base, parseInt(m[2], 10) / 100);
  }
  if (NVY_TOKENS.color[token]) return NVY_TOKENS.color[token];
  return null;
}

function hexToRgba(hex, a) {
  const c = hex.replace("#", "");
  const v = c.length === 3 ? c.split("").map(x => x + x).join("") : c;
  const r = parseInt(v.slice(0,2), 16), g = parseInt(v.slice(2,4), 16), b = parseInt(v.slice(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

window.nvyParseClasses = nvyParseClasses;
window.NVY_TOKENS = NVY_TOKENS;
