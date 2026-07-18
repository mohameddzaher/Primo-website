// ============================================
// PRIMO WEB - ZATCA e-invoicing QR helpers
// ============================================
//
// Two things live here:
//   1. buildZatcaTlvBase64() - the ZATCA Phase 2 TLV payload for a tax invoice.
//   2. renderQrSvg()         - a small dependency-free QR encoder (byte mode,
//                              error correction level M) that returns inline SVG.
//
// Inline SVG is deliberate: the printed invoice must stay self-contained, so we
// cannot pull in a QR npm package or point an <img> at an external generator.

// --------------------------------------------
// ZATCA TLV payload
// --------------------------------------------

export interface ZatcaInvoiceFields {
  sellerName: string;
  sellerVatNumber: string;
  /** ISO 8601 timestamp, e.g. 2026-07-18T20:30:00Z */
  timestamp: string;
  /** Invoice total INCLUDING VAT */
  totalWithVat: string;
  /** VAT total */
  vatTotal: string;
}

/**
 * Encodes one TLV field as [tag byte][length byte][UTF-8 value bytes].
 *
 * The length byte MUST be the UTF-8 *byte* length, not the JS string length.
 * JS strings are UTF-16, so an Arabic seller name such as "مؤسسة بريمو" reports
 * a `.length` far smaller than the bytes it actually occupies. Using `.length`
 * would tell the scanner to read too few bytes, and every field after it would
 * be misaligned and unreadable.
 */
function tlv(tag: number, value: string): number[] {
  let bytes = Array.from(new TextEncoder().encode(value));
  // A TLV length is a single byte, so a value can never exceed 255 bytes.
  if (bytes.length > 255) bytes = bytes.slice(0, 255);
  return [tag, bytes.length, ...bytes];
}

/**
 * Builds the Base64-encoded TLV payload required on Saudi tax invoices.
 * The five tags must appear in this exact order.
 */
export function buildZatcaTlvBase64(fields: ZatcaInvoiceFields): string {
  const bytes = [
    ...tlv(1, fields.sellerName),
    ...tlv(2, fields.sellerVatNumber),
    ...tlv(3, fields.timestamp),
    ...tlv(4, fields.totalWithVat),
    ...tlv(5, fields.vatTotal),
  ];
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// --------------------------------------------
// Minimal QR encoder (byte mode, EC level M, versions 1-10)
// --------------------------------------------

// Galois field GF(256) tables, primitive polynomial 0x11D, for Reed-Solomon.
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLength: number): number[] {
  const gen = rsGeneratorPoly(ecLength);
  const remainder = new Array<number>(ecLength).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let i = 0; i < ecLength; i++) remainder[i] ^= gfMul(gen[i + 1], factor);
  }
  return remainder;
}

// [ecCodewordsPerBlock, group1Blocks, group1DataCodewords, group2Blocks, group2DataCodewords]
const EC_LEVEL_M: Record<number, [number, number, number, number, number]> = {
  1: [10, 1, 16, 0, 0],
  2: [16, 1, 28, 0, 0],
  3: [26, 1, 44, 0, 0],
  4: [18, 2, 32, 0, 0],
  5: [24, 2, 43, 0, 0],
  6: [16, 4, 27, 0, 0],
  7: [18, 4, 31, 0, 0],
  8: [22, 2, 38, 2, 39],
  9: [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44],
};

const ALIGNMENT_CENTERS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

const MASK_FUNCTIONS: Array<(r: number, c: number) => boolean> = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

const getBit = (value: number, index: number) => ((value >>> index) & 1) !== 0;

/** BCH(15,5) format information for EC level M (0b00) and the given mask. */
function formatBits(mask: number): number {
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return (((data << 10) | rem) ^ 0x5412) >>> 0;
}

/** BCH(18,6) version information, only used for versions 7 and up. */
function versionInfoBits(version: number): number {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return ((version << 12) | rem) >>> 0;
}

function penaltyScore(modules: boolean[][], size: number): number {
  let score = 0;

  // Rule 1: runs of five or more same-coloured modules in a row or column.
  for (let i = 0; i < size; i++) {
    for (const isRow of [true, false]) {
      let runColor = false;
      let runLength = 0;
      for (let j = 0; j < size; j++) {
        const dark = isRow ? modules[i][j] : modules[j][i];
        if (dark === runColor) {
          runLength++;
          if (runLength === 5) score += 3;
          else if (runLength > 5) score += 1;
        } else {
          runColor = dark;
          runLength = 1;
        }
      }
    }
  }

  // Rule 2: 2x2 blocks of the same colour.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  // Rule 3: finder-like 1:1:3:1:1 patterns with four light modules beside them.
  const pattern = [true, false, true, true, true, false, true, false, false, false, false];
  const reversed = pattern.slice().reverse();
  const matches = (line: boolean[], start: number, target: boolean[]) => {
    for (let k = 0; k < target.length; k++) if (line[start + k] !== target[k]) return false;
    return true;
  };
  for (let i = 0; i < size; i++) {
    const row = modules[i];
    const col = modules.map((r) => r[i]);
    for (const line of [row, col]) {
      for (let j = 0; j + pattern.length <= size; j++) {
        if (matches(line, j, pattern)) score += 40;
        if (matches(line, j, reversed)) score += 40;
      }
    }
  }

  // Rule 4: deviation of the dark-module ratio from 50%.
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (modules[r][c]) dark++;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/** Encodes text as a QR symbol and returns the module matrix (true = dark). */
function encodeQrMatrix(text: string): boolean[][] {
  const data = Array.from(new TextEncoder().encode(text));

  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const [, b1, d1, b2, d2] = EC_LEVEL_M[v];
    const countBits = v <= 9 ? 8 : 16;
    if (4 + countBits + data.length * 8 <= (b1 * d1 + b2 * d2) * 8) {
      version = v;
      break;
    }
  }
  if (version === 0) throw new Error('QR payload too large');

  const [ecPerBlock, group1Blocks, group1Data, group2Blocks, group2Data] = EC_LEVEL_M[version];
  const totalDataCodewords = group1Blocks * group1Data + group2Blocks * group2Data;
  const countBits = version <= 9 ? 8 : 16;

  // --- bit stream: mode indicator, character count, payload, terminator, padding
  const bits: number[] = [];
  const pushBits = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  pushBits(0b0100, 4); // byte mode
  pushBits(data.length, countBits);
  for (const byte of data) pushBits(byte, 8);

  const capacityBits = totalDataCodewords * 8;
  for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataCodewords.push(byte);
  }
  const padBytes = [0xec, 0x11];
  while (dataCodewords.length < totalDataCodewords) {
    dataCodewords.push(padBytes[(dataCodewords.length - bits.length / 8) % 2]);
  }

  // --- split into blocks, add error correction, interleave
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (let i = 0; i < group1Blocks + group2Blocks; i++) {
    const length = i < group1Blocks ? group1Data : group2Data;
    const block = dataCodewords.slice(offset, offset + length);
    offset += length;
    blocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
  }
  const finalCodewords: number[] = [];
  const maxBlockLength = Math.max(group1Data, group2Data);
  for (let i = 0; i < maxBlockLength; i++) {
    for (const block of blocks) if (i < block.length) finalCodewords.push(block[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) finalCodewords.push(block[i]);
  }

  // --- build the matrix
  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false)
  );
  const setFunction = (r: number, c: number, dark: boolean) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    modules[r][c] = dark;
    reserved[r][c] = true;
  };

  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const dark =
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        setFunction(row + r, col + c, dark);
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }

  const centers = ALIGNMENT_CENTERS[version];
  for (const r of centers) {
    for (const c of centers) {
      const overlapsFinder =
        (r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6);
      if (overlapsFinder) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          setFunction(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        }
      }
    }
  }

  // Reserve the format information areas (values are written per mask later).
  for (let i = 0; i <= 8; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  setFunction(size - 8, 8, true); // dark module

  if (version >= 7) {
    const info = versionInfoBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = getBit(info, i);
      const a = Math.floor(i / 3);
      const b = i % 3;
      setFunction(size - 11 + b, a, bit);
      setFunction(a, size - 11 + b, bit);
    }
  }

  // --- place data bits in the zigzag pattern, skipping the vertical timing column
  let bitIndex = 0;
  const totalBits = finalCodewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (!reserved[r][c] && bitIndex < totalBits) {
          modules[r][c] = getBit(finalCodewords[bitIndex >>> 3], 7 - (bitIndex & 7));
          bitIndex++;
        }
      }
    }
  }

  // --- try every mask and keep the lowest-penalty result
  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = modules.map((row) => row.slice());
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!reserved[r][c] && MASK_FUNCTIONS[mask](r, c)) candidate[r][c] = !candidate[r][c];
      }
    }

    const info = formatBits(mask);
    // First copy: down column 8, then left along row 8 (skipping the timing line).
    for (let i = 0; i <= 5; i++) candidate[i][8] = getBit(info, i);
    candidate[7][8] = getBit(info, 6);
    candidate[8][8] = getBit(info, 7);
    candidate[8][7] = getBit(info, 8);
    for (let i = 9; i < 15; i++) candidate[8][14 - i] = getBit(info, i);
    // Second copy: up column 8 from the bottom, then right along row 8.
    for (let i = 0; i < 8; i++) candidate[size - 1 - i][8] = getBit(info, i);
    for (let i = 8; i < 15; i++) candidate[8][size - 15 + i] = getBit(info, i);
    candidate[size - 8][8] = true; // always dark

    const score = penaltyScore(candidate, size);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best!;
}

/**
 * Renders `text` as a scannable QR code, returned as a standalone SVG string
 * that can be embedded straight into printable HTML (no external requests).
 */
export function renderQrSvg(text: string, pixelSize = 140): string {
  const matrix = encodeQrMatrix(text);
  const size = matrix.length;
  const quietZone = 4;
  const total = size + quietZone * 2;

  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) path += `M${c + quietZone} ${r + quietZone}h1v1h-1z`;
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" ` +
    `viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" ` +
    `aria-label="ZATCA tax invoice QR code">` +
    `<rect width="${total}" height="${total}" fill="#ffffff"/>` +
    `<path d="${path}" fill="#000000"/>` +
    `</svg>`
  );
}
