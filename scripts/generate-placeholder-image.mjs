#!/usr/bin/env node
/**
 * Generates a flat-color placeholder PNG with no dependencies (hand-rolled
 * PNG encoder) so every new site has a valid Open Graph image out of the
 * box. Replace the generated file with real branded artwork before launch.
 *
 * Usage: node scripts/generate-placeholder-image.mjs <outPath> [width] [height] [hexColor]
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function generatePng(width, height, hexColor) {
  const [r, g, b] = hexToRgb(hexColor);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: truecolor (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk("IHDR", ihdrData);

  const borderPx = 6;
  const rowBytes = width * 3;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // filter type: none
    const isBorderRow = y < borderPx || y >= height - borderPx;
    for (let x = 0; x < width; x++) {
      const isBorderCol = x < borderPx || x >= width - borderPx;
      const onBorder = isBorderRow || isBorderCol;
      const offset = rowStart + 1 + x * 3;
      if (onBorder) {
        raw[offset] = 255;
        raw[offset + 1] = 255;
        raw[offset + 2] = 255;
      } else {
        raw[offset] = r;
        raw[offset + 1] = g;
        raw[offset + 2] = b;
      }
    }
  }

  const idat = chunk("IDAT", deflateSync(raw));
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const [, , outPath, widthArg, heightArg, colorArg] = process.argv;
if (!outPath) {
  console.error("Usage: node scripts/generate-placeholder-image.mjs <outPath> [width] [height] [hexColor]");
  process.exit(1);
}

const width = Number(widthArg) || 1200;
const height = Number(heightArg) || 630;
const color = colorArg || "#1d4ed8";

writeFileSync(outPath, generatePng(width, height, color));
console.log(`Wrote placeholder image: ${outPath} (${width}x${height}, ${color})`);
