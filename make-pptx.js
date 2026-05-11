const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches

const PURPLE = "7c3aed";
const BLACK  = "0a0a0a";
const WHITE  = "ffffff";
const LGRAY  = "555555";

function addLabel(slide, text) {
  slide.addText(text, {
    x: "50%", y: 0.55, w: "60%", h: 0.3,
    align: "center",
    fontSize: 9, bold: true, color: PURPLE,
    charSpacing: 3.5,
    fontFace: "Arial",
  });
}

function addRule(slide, y, color = PURPLE) {
  slide.addShape(pptx.ShapeType.rect, {
    x: "46%", y, w: 0.55, h: 0.06,
    fill: { color },
    line: { color, width: 0 },
  });
}

// ─────────────────────────────────────────
// S1 — Hook
// ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };

  s.addText("Your AI agent", {
    x: 0, y: 1.4, w: "100%", h: 1.4,
    align: "center", fontSize: 72, bold: true,
    color: BLACK, fontFace: "Arial",
  });

  // purple highlight box
  s.addShape(pptx.ShapeType.rect, {
    x: "28%", y: 2.85, w: "44%", h: 1.0,
    fill: { color: PURPLE },
  });
  s.addText("has your wallet.", {
    x: "28%", y: 2.9, w: "44%", h: 0.9,
    align: "center", fontSize: 72, bold: true,
    color: WHITE, fontFace: "Arial",
  });

  addRule(s, 4.1);

  s.addText("That is the problem we are solving.", {
    x: 0, y: 4.3, w: "100%", h: 0.5,
    align: "center", fontSize: 16, color: BLACK, fontFace: "Arial",
  });
}

// ─────────────────────────────────────────
// S2 — Problem
// ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };

  addLabel(s, "THE PROBLEM");

  s.addText("Agents need money.", {
    x: 0, y: 0.95, w: "100%", h: 0.8,
    align: "center", fontSize: 48, bold: true, color: BLACK, fontFace: "Arial",
  });
  s.addText("You need limits.", {
    x: 0, y: 1.65, w: "100%", h: 0.7,
    align: "center", fontSize: 48, bold: true, color: PURPLE, fontFace: "Arial",
  });

  // BAD card
  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 2.55, w: 5.5, h: 3.8,
    fill: { color: WHITE },
    line: { color: BLACK, width: 1.5, pt: 1.5 },
    radius: 12,
  });
  s.addText("WITHOUT THIS", {
    x: 0.9, y: 2.7, w: 5.3, h: 0.35,
    fontSize: 9, bold: true, color: BLACK, fontFace: "Arial", charSpacing: 2,
  });
  const badItems = ["⚠  Full wallet access","⚠  No daily cap","⚠  Any token, any DEX","⚠  One bug = everything gone"];
  badItems.forEach((txt, i) => {
    s.addText(txt, { x: 0.9, y: 3.15 + i * 0.72, w: 5.2, h: 0.55, fontSize: 14, color: BLACK, fontFace: "Arial" });
  });

  // GOOD card
  s.addShape(pptx.ShapeType.rect, {
    x: 7.0, y: 2.55, w: 5.5, h: 3.8,
    fill: { color: BLACK },
    line: { color: BLACK, width: 0 },
    radius: 12,
  });
  s.addText("WITH SMART ALLOWANCE", {
    x: 7.1, y: 2.7, w: 5.3, h: 0.35,
    fontSize: 9, bold: true, color: "aaaaaa", fontFace: "Arial", charSpacing: 2,
  });
  const goodItems = ["✓  Isolated sub-wallet","✓  Daily spend cap","✓  Whitelisted tokens only","✓  Rules enforced on-chain"];
  goodItems.forEach((txt, i) => {
    s.addText(txt, { x: 7.1, y: 3.15 + i * 0.72, w: 5.2, h: 0.55, fontSize: 14, color: WHITE, fontFace: "Arial" });
  });
}

// ─────────────────────────────────────────
// S3 — Solution
// ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };

  addLabel(s, "THE SOLUTION");

  s.addText("Policy on Solana.", {
    x: 0, y: 0.95, w: "100%", h: 0.8,
    align: "center", fontSize: 48, bold: true, color: BLACK, fontFace: "Arial",
  });
  s.addText("Agent cannot break it.", {
    x: 0, y: 1.65, w: "100%", h: 0.7,
    align: "center", fontSize: 48, bold: true, color: PURPLE, fontFace: "Arial",
  });

  // boxes
  const boxes = [
    { x: 1.2,  label: "Your wallet",  sub: "Main keypair",     hl: false },
    { x: 4.6,  label: "Sub-wallet",   sub: "On-chain policy",  hl: true  },
    { x: 8.0,  label: "Claude agent", sub: "Trades within limits", hl: false },
  ];

  boxes.forEach(({ x, label, sub, hl }) => {
    s.addShape(pptx.ShapeType.rect, {
      x, y: 2.8, w: 2.9, h: 2.0,
      fill: { color: hl ? PURPLE : WHITE },
      line: { color: hl ? PURPLE : BLACK, width: 1.5 },
      radius: 12,
    });
    s.addText(label, { x, y: 3.2, w: 2.9, h: 0.5, align: "center", fontSize: 16, bold: true, color: hl ? WHITE : BLACK, fontFace: "Arial" });
    s.addText(sub,   { x, y: 3.7, w: 2.9, h: 0.4, align: "center", fontSize: 11, color: hl ? "dddddd" : LGRAY, fontFace: "Arial" });
  });

  // arrows
  [[3.2, 3.7], [7.6, 3.7]].forEach(([ax, ay]) => {
    s.addShape(pptx.ShapeType.line, {
      x: ax, y: ay, w: 1.3, h: 0,
      line: { color: BLACK, width: 2 },
    });
    // arrowhead via small triangle text
    s.addText("▶", { x: ax + 1.1, y: ay - 0.18, w: 0.3, h: 0.35, fontSize: 12, color: BLACK, fontFace: "Arial" });
  });
}

// ─────────────────────────────────────────
// S4 — How it works
// ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };

  addLabel(s, "HOW IT WORKS");

  s.addText("Three steps.", {
    x: 0, y: 0.95, w: "100%", h: 0.8,
    align: "center", fontSize: 48, bold: true, color: BLACK, fontFace: "Arial",
  });
  s.addText("Fully autonomous.", {
    x: 0, y: 1.65, w: "100%", h: 0.7,
    align: "center", fontSize: 48, bold: true, color: PURPLE, fontFace: "Arial",
  });

  const steps = [
    { num: "01", title: "Set the rules",   desc: "Pick tokens, daily limit, max trade size.\nStored on Solana as a PDA." },
    { num: "02", title: "Claude decides",  desc: "Every 5 minutes, Claude checks prices,\nreads the policy, and decides to buy, sell, or hold." },
    { num: "03", title: "Chain enforces",  desc: "If the trade breaks the policy, Solana blocks it.\nNot the app. The chain." },
  ];

  steps.forEach(({ num, title, desc }, i) => {
    const x = 0.75 + i * 4.1;
    // card
    s.addShape(pptx.ShapeType.rect, {
      x, y: 2.6, w: 3.8, h: 3.7,
      fill: { color: WHITE },
      line: { color: BLACK, width: 1.5 },
      radius: 12,
    });
    // purple bottom bar
    s.addShape(pptx.ShapeType.rect, {
      x, y: 6.1, w: 3.8, h: 0.2,
      fill: { color: PURPLE },
      line: { color: PURPLE, width: 0 },
    });
    s.addText(num,  { x: x + 0.2, y: 2.75, w: 3.4, h: 0.85, fontSize: 44, bold: true, color: PURPLE, fontFace: "Arial" });
    s.addText(title,{ x: x + 0.2, y: 3.55, w: 3.4, h: 0.5,  fontSize: 17, bold: true, color: BLACK, fontFace: "Arial" });
    s.addText(desc, { x: x + 0.2, y: 4.1,  w: 3.4, h: 1.6,  fontSize: 12, color: BLACK, fontFace: "Arial", valign: "top" });
  });
}

// ─────────────────────────────────────────
// S5 — Stack
// ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };

  addLabel(s, "BUILT WITH");

  s.addText("Every layer", {
    x: 0, y: 0.95, w: "100%", h: 0.8,
    align: "center", fontSize: 48, bold: true, color: BLACK, fontFace: "Arial",
  });
  s.addText("production-grade.", {
    x: 0, y: 1.65, w: "100%", h: 0.7,
    align: "center", fontSize: 48, bold: true, color: PURPLE, fontFace: "Arial",
  });

  const items = [
    { ico: "◎", name: "Solana",   role: "On-chain policy",  hl: false },
    { ico: "⬡", name: "Anchor",   role: "Smart contract",   hl: false },
    { ico: "✦", name: "Claude",   role: "Trading AI",       hl: true  },
    { ico: "⇄", name: "Jupiter",  role: "Swap execution",   hl: false },
    { ico: "▣", name: "Supabase", role: "Vault + history",  hl: false },
  ];

  items.forEach(({ ico, name, role, hl }, i) => {
    const x = 0.65 + i * 2.42;
    s.addShape(pptx.ShapeType.rect, {
      x, y: 2.7, w: 2.12, h: 2.8,
      fill: { color: hl ? PURPLE : WHITE },
      line: { color: hl ? PURPLE : BLACK, width: 1.5 },
      radius: 10,
    });
    s.addText(ico,  { x, y: 2.85, w: 2.12, h: 0.6, align: "center", fontSize: 26, color: hl ? WHITE : BLACK, fontFace: "Arial" });
    s.addText(name, { x, y: 3.5,  w: 2.12, h: 0.45, align: "center", fontSize: 15, bold: true, color: hl ? WHITE : BLACK, fontFace: "Arial" });
    s.addText(role, { x, y: 3.95, w: 2.12, h: 0.35, align: "center", fontSize: 9, color: hl ? "dddddd" : LGRAY, fontFace: "Arial", charSpacing: 1 });
  });
}

// ─────────────────────────────────────────
// S6 — CTA (dark)
// ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: BLACK };

  addLabel(s, "TODAY");

  s.addText("Live on devnet.", {
    x: 0, y: 0.95, w: "100%", h: 0.8,
    align: "center", fontSize: 48, bold: true, color: WHITE, fontFace: "Arial",
  });
  s.addText("Ready to scale.", {
    x: 0, y: 1.65, w: "100%", h: 0.7,
    align: "center", fontSize: 48, bold: true, color: WHITE, fontFace: "Arial",
  });

  addRule(s, 2.55, PURPLE);

  const stats = [
    { val: "5min", label: "AUTONOMOUS CYCLE",    color: WHITE  },
    { val: "∞",    label: "AGENTS PER WALLET",   color: PURPLE },
    { val: "0",    label: "WAYS TO BYPASS POLICY", color: WHITE },
  ];

  stats.forEach(({ val, label, color }, i) => {
    const x = 1.0 + i * 3.8;
    s.addText(val,   { x, y: 2.75, w: 3.2, h: 1.2, align: "center", fontSize: 60, bold: true, color, fontFace: "Arial" });
    s.addText(label, { x, y: 3.9,  w: 3.2, h: 0.4, align: "center", fontSize: 9,  color: "888888", fontFace: "Arial", charSpacing: 2 });
  });

  // CTA pills
  s.addShape(pptx.ShapeType.rect, {
    x: 2.5, y: 4.65, w: 3.8, h: 0.6,
    fill: { color: PURPLE },
    line: { color: PURPLE, width: 0 },
    radius: 100,
  });
  s.addText("github.com/amaramci/Limitra", {
    x: 2.5, y: 4.68, w: 3.8, h: 0.55,
    align: "center", fontSize: 13, bold: true, color: WHITE, fontFace: "Arial",
  });

  s.addShape(pptx.ShapeType.rect, {
    x: 7.0, y: 4.65, w: 3.8, h: 0.6,
    fill: { color: BLACK },
    line: { color: "2d2d2d", width: 1.5, pt: 1.5 },
    radius: 100,
  });
  s.addText("Solana devnet · Program deployed", {
    x: 7.0, y: 4.68, w: 3.8, h: 0.55,
    align: "center", fontSize: 13, color: "777777", fontFace: "Arial",
  });
}

pptx.writeFile({ fileName: "/Users/amar/Desktop/Limitra/pitch-deck.pptx" })
  .then(() => console.log("Done: pitch-deck.pptx"))
  .catch(e => { console.error(e); process.exit(1); });
