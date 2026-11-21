// Entry program for "The Catalogue Photo of an Impossible Gadget".
//
// The photograph itself ships in this repository as gadget.jpg: a studio
// catalogue shot of the PET ROVER, a brushed-aluminium quadruped walking
// frame that takes a pet rock out for its daily walk, red leash included.
// This program's whole job is to place that photograph at
// /output/entry.png, byte for byte, so the entry the judge sees is exactly
// the photograph that was art-directed here.

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "gadget.jpg");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target = join(outDir, "entry.png");

// Sanity-check the photograph before it ships: the gate accepts a whole
// PNG or JPEG of at most 1 MiB and 1024x1024, so refuse anything else here
// rather than hand the scorer a file it would throw away.
const bytes = readFileSync(source);
const MAX_BYTES = 1_048_576;
if (bytes.length > MAX_BYTES) {
  throw new Error(`gadget.jpg is ${bytes.length} bytes, over the ${MAX_BYTES} cap`);
}
const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
const isPng =
  bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
if (!isJpeg && !isPng) {
  throw new Error("gadget.jpg is neither a JPEG nor a PNG");
}
if (isJpeg) {
  // Walk the JPEG segments to the start-of-frame marker and read the size.
  let off = 2;
  for (;;) {
    if (bytes[off] !== 0xff) throw new Error("malformed JPEG segment");
    const marker = bytes[off + 1];
    const len = bytes.readUInt16BE(off + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      const height = bytes.readUInt16BE(off + 5);
      const width = bytes.readUInt16BE(off + 7);
      if (width > 1024 || height > 1024) {
        throw new Error(`gadget.jpg is ${width}x${height}, over the 1024x1024 cap`);
      }
      break;
    }
    off += 2 + len;
  }
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
console.log(`wrote ${target} from ${source} (${bytes.length} bytes)`);
