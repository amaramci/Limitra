const PptxGenJS = require("pptxgenjs");
const path = require("path");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in

const dir = path.join(__dirname, "slides-tmp");

for (let i = 0; i < 6; i++) {
  const slide = pptx.addSlide();
  slide.addImage({
    path: path.join(dir, `slide${i}.png`),
    x: 0, y: 0,
    w: "100%", h: "100%",
  });
}

pptx.writeFile({ fileName: path.join(__dirname, "pitch-deck.pptx") })
  .then(() => console.log("PPTX done"))
  .catch(e => { console.error(e); process.exit(1); });
