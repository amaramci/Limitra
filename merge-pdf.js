const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function main() {
  const merged = await PDFDocument.create();
  for (let i = 0; i < 6; i++) {
    const bytes = fs.readFileSync(path.join(__dirname, `slides-tmp/slide${i}.pdf`));
    const doc = await PDFDocument.load(bytes);
    const [page] = await merged.copyPages(doc, [0]);
    merged.addPage(page);
  }
  fs.writeFileSync(path.join(__dirname, "pitch-deck.pdf"), await merged.save());
  console.log("pitch-deck.pdf done");
}
main().catch(e => { console.error(e); process.exit(1); });
