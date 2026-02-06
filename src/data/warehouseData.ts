export type ZoneType =
  | "aisle"
  | "tobacco"
  | "novelty"
  | "cooler"
  | "freezer"
  | "office"
  | "receiving"
  | "cbd"
  | "storage"
  | "p06"
  | "endcap"
  | "structural";

export interface Section {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AisleRow {
  sections: Section[];
  y: number;
}

export interface WarehouseZone {
  id: string;
  name: string;
  type: ZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
  sections: Section[];
  rows?: AisleRow[];
  description?: string;
  labelBelow?: boolean;
  vertical?: boolean;
  endCaps?: { front?: boolean; back?: boolean };
}

export const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string; text: string; label: string }> = {
  aisle:      { fill: "hsl(215 70% 50% / 0.12)", stroke: "hsl(215 70% 50%)", text: "hsl(215 70% 40%)", label: "Aisles" },
  tobacco:    { fill: "hsl(30 85% 55% / 0.12)",  stroke: "hsl(30 85% 50%)",  text: "hsl(30 80% 35%)", label: "Tobacco" },
  novelty:    { fill: "hsl(280 50% 55% / 0.12)", stroke: "hsl(280 50% 50%)", text: "hsl(280 50% 35%)", label: "Novelty" },
  cooler:     { fill: "hsl(195 80% 50% / 0.12)", stroke: "hsl(195 80% 45%)", text: "hsl(195 80% 30%)", label: "Cooler" },
  freezer:    { fill: "hsl(210 90% 60% / 0.12)", stroke: "hsl(210 90% 50%)", text: "hsl(210 90% 35%)", label: "Freezer" },
  office:     { fill: "hsl(150 30% 50% / 0.12)", stroke: "hsl(150 30% 45%)", text: "hsl(150 30% 30%)", label: "Office" },
  receiving:  { fill: "hsl(45 80% 55% / 0.12)",  stroke: "hsl(45 80% 50%)",  text: "hsl(45 80% 30%)", label: "Receiving" },
  cbd:        { fill: "hsl(140 60% 40% / 0.12)", stroke: "hsl(140 60% 35%)", text: "hsl(140 60% 25%)", label: "CBD" },
  storage:    { fill: "hsl(0 0% 60% / 0.08)",    stroke: "hsl(0 0% 50%)",    text: "hsl(0 0% 35%)",   label: "Storage" },
  p06:        { fill: "hsl(0 0% 70% / 0.15)",    stroke: "hsl(0 0% 50%)",    text: "hsl(0 0% 30%)",   label: "P06" },
  endcap:     { fill: "hsl(0 60% 50% / 0.1)",    stroke: "hsl(0 60% 50%)",   text: "hsl(0 60% 35%)",  label: "End Cap" },
  structural: { fill: "hsl(0 0% 80% / 0.1)",     stroke: "hsl(0 0% 60%)",    text: "hsl(0 0% 40%)",   label: "Structure" },
};

// Helper to create a row of sections
function makeRow(count: number, cellW: number, cellH: number, labels?: string[]): Section[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    label: labels ? labels[i] : `${i + 1}`,
    x: i * cellW,
    y: 0,
    width: cellW,
    height: cellH,
  }));
}

function makeVerticalSections(count: number, cellW: number, cellH: number, labels?: string[]): Section[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    label: labels ? labels[i] : `${i + 1}`,
    x: 0,
    y: i * cellH,
    width: cellW,
    height: cellH,
  }));
}

// Aisle with 2 rows (top row and bottom row, each with sections)
function makeDualRowAisle(
  id: string, name: string, x: number, y: number,
  sectionCount: number, cellW: number, rowH: number,
  options?: { labels?: string[]; endCaps?: { front?: boolean; back?: boolean } }
): WarehouseZone {
  const w = sectionCount * cellW;
  const h = rowH * 2;
  const topRow: AisleRow = {
    y: 0,
    sections: Array.from({ length: sectionCount }, (_, i) => ({
      id: `t${i + 1}`, label: options?.labels ? options.labels[i] : `${i + 1}`,
      x: i * cellW, y: 0, width: cellW, height: rowH,
    })),
  };
  const bottomRow: AisleRow = {
    y: rowH,
    sections: Array.from({ length: sectionCount }, (_, i) => ({
      id: `b${i + 1}`, label: options?.labels ? options.labels[i] : `${i + 1}`,
      x: i * cellW, y: rowH, width: cellW, height: rowH,
    })),
  };
  return {
    id, name, type: "aisle", x, y, width: w, height: h,
    sections: [...topRow.sections, ...bottomRow.sections],
    rows: [topRow, bottomRow],
    labelBelow: true,
    endCaps: options?.endCaps,
    description: `${name} — ${sectionCount} sections per row, naming: ${name.replace(/[()]/g, "")}.Section.Shelf.Bin`,
  };
}

export interface StructuralElement {
  type: "wall" | "column" | "dimension" | "label";
  x: number; y: number;
  x2?: number; y2?: number;
  width?: number; height?: number;
  label?: string;
  radius?: number;
}

export interface WarehouseLayout {
  width: number;
  height: number;
  zones: WarehouseZone[];
  structural: StructuralElement[];
  gridCols: { label: string; x: number }[];
  gridRows: { label: string; y: number }[];
}

export function getWarehouseLayout(): WarehouseLayout {
  const zones: WarehouseZone[] = [];

  // ============ STRUCTURAL / FIXED ZONES ============

  // Office
  zones.push({
    id: "office", name: "Office", type: "office",
    x: 55, y: 105, width: 175, height: 220,
    sections: [],
    description: "Main office area",
  });

  // Existing R/R
  zones.push({
    id: "exist_rr", name: "Exist. R/R", type: "structural",
    x: 105, y: 490, width: 120, height: 60,
    sections: [],
    description: "Existing restroom facilities",
  });

  // Polished Concrete
  zones.push({
    id: "polished_concrete", name: "Polished Concrete", type: "structural",
    x: 20, y: 280, width: 35, height: 80,
    sections: [],
    description: "Polished concrete area",
  });

  // Existing Fire Riser
  zones.push({
    id: "fire_riser", name: "Exist. Fire Riser", type: "structural",
    x: 155, y: 740, width: 85, height: 30,
    sections: [],
    description: "Existing fire riser",
  });

  // ============ RECEIVING ============
  zones.push({
    id: "receiving", name: "Receiving", type: "receiving",
    x: 548, y: 85, width: 40, height: 210,
    sections: [],
    vertical: true,
    description: "Receiving dock area",
  });

  // ============ COOLER & FREEZERS ============
  zones.push({
    id: "cooler", name: "Cooler", type: "cooler",
    x: 605, y: 90, width: 130, height: 90,
    sections: [],
    description: "Temperature controlled cooler area",
  });

  zones.push({
    id: "freezer1", name: "Freezer", type: "freezer",
    x: 745, y: 90, width: 130, height: 90,
    sections: [],
    description: "Freezer — Sub-zero storage",
  });

  zones.push({
    id: "freezer2", name: "Freezer", type: "freezer",
    x: 885, y: 90, width: 130, height: 90,
    sections: [],
    description: "Freezer 2 — Sub-zero storage",
  });

  // Cooler/Freezer numbered sections row (1-22)
  const cfCellW = 18;
  zones.push({
    id: "cf_sections", name: "Cooler/Freezer Sections", type: "cooler",
    x: 605, y: 185, width: 22 * cfCellW, height: 18,
    sections: Array.from({ length: 22 }, (_, i) => ({
      id: `cf${i + 1}`, label: `${i + 1}`,
      x: i * cfCellW, y: 0, width: cfCellW, height: 18,
    })),
    description: "Numbered cooler/freezer sections 1-22",
  });

  // ============ TOBACCO ZONES (1-7) ============
  // Tobacco(1) — vertical strip
  zones.push({
    id: "tobacco1", name: "Tobacco (1)", type: "tobacco",
    x: 248, y: 95, width: 18, height: 170,
    sections: makeVerticalSections(9, 18, 19),
    vertical: true,
    description: "Tobacco Zone 1 — Vertical section",
  });

  // Tobacco(2) — top horizontal, 11 sections
  const tCellW = 26;
  const tRowH = 16;
  zones.push({
    id: "tobacco2", name: "Tobacco (2)", type: "tobacco",
    x: 275, y: 90, width: 11 * tCellW, height: tRowH,
    sections: makeRow(11, tCellW, tRowH),
    description: "Tobacco Zone 2 — 11 sections",
  });

  // Tobacco(3) — 8 sections
  zones.push({
    id: "tobacco3", name: "Tobacco (3)", type: "tobacco",
    x: 275, y: 115, width: 8 * tCellW, height: tRowH,
    sections: makeRow(8, tCellW, tRowH),
    description: "Tobacco Zone 3 — 8 sections",
  });

  // Tobacco(4) — 8 sections
  zones.push({
    id: "tobacco4", name: "Tobacco (4)", type: "tobacco",
    x: 275, y: 145, width: 8 * tCellW, height: tRowH,
    sections: makeRow(8, tCellW, tRowH),
    description: "Tobacco Zone 4 — 8 sections",
  });

  // Tobacco(5) — 6 sections
  zones.push({
    id: "tobacco5", name: "Tobacco (5)", type: "tobacco",
    x: 275, y: 170, width: 6 * tCellW, height: tRowH,
    sections: makeRow(6, tCellW, tRowH),
    description: "Tobacco Zone 5 — 6 sections",
  });

  // Tobacco(6) — 6 sections
  zones.push({
    id: "tobacco6", name: "Tobacco (6)", type: "tobacco",
    x: 275, y: 195, width: 6 * tCellW, height: tRowH,
    sections: makeRow(6, tCellW, tRowH),
    description: "Tobacco Zone 6 — 6 sections",
  });

  // Tobacco(7) — 7 sections, P06 markers on sides
  zones.push({
    id: "tobacco7", name: "Tobacco (7)", type: "tobacco",
    x: 275, y: 228, width: 7 * tCellW, height: tRowH,
    sections: makeRow(7, tCellW, tRowH),
    description: "Tobacco Zone 7 — 7 sections, P06 on ends",
  });

  // P06 markers near tobacco
  [{ x: 260, y: 228 }, { x: 275 + 7 * tCellW + 5, y: 228 }].forEach((p, i) => {
    zones.push({
      id: `p06_tobacco_${i}`, name: "P06", type: "p06",
      x: p.x, y: p.y, width: 14, height: tRowH,
      sections: [], description: "P06 marker",
    });
  });

  // ============ NOVELTY ZONES ============
  // Novelty(5) — vertical, left side
  zones.push({
    id: "novelty5", name: "Novelty (5)", type: "novelty",
    x: 205, y: 310, width: 18, height: 180,
    sections: makeVerticalSections(10, 18, 18),
    vertical: true,
    description: "Novelty Zone 5 — Vertical, 10 sections",
  });

  // Novelty(4) — vertical
  zones.push({
    id: "novelty4", name: "Novelty (4)", type: "novelty",
    x: 228, y: 370, width: 18, height: 160,
    sections: makeVerticalSections(8, 18, 20),
    vertical: true,
    description: "Novelty Zone 4 — Vertical, 8 sections",
  });

  // Novelty(3) — vertical
  zones.push({
    id: "novelty3", name: "Novelty (3)", type: "novelty",
    x: 250, y: 420, width: 18, height: 150,
    sections: makeVerticalSections(7, 18, 21),
    vertical: true,
    description: "Novelty Zone 3 — Vertical, 7 sections",
  });

  // Novelty(6) — two horizontal rows in center
  zones.push({
    id: "novelty6a", name: "Novelty (6)", type: "novelty",
    x: 345, y: 260, width: 180, height: 16,
    sections: makeRow(6, 30, 16),
    description: "Novelty Zone 6 — Upper row",
  });

  zones.push({
    id: "novelty6b", name: "Novelty (6)", type: "novelty",
    x: 345, y: 282, width: 180, height: 16,
    sections: makeRow(6, 30, 16),
    description: "Novelty Zone 6 — Lower row",
  });

  // Novelty(1) — bottom, horizontal, 4 sections
  zones.push({
    id: "novelty1", name: "Novelty (1)", type: "novelty",
    x: 100, y: 710, width: 4 * 35, height: 18,
    sections: makeRow(4, 35, 18),
    description: "Novelty Zone 1 — 4 sections",
  });

  // Novelty(2) — bottom, horizontal, 8 sections
  zones.push({
    id: "novelty2", name: "Novelty (2)", type: "novelty",
    x: 370, y: 710, width: 8 * 28, height: 18,
    sections: makeRow(8, 28, 18),
    description: "Novelty Zone 2 — 8 sections",
  });

  // ============ CBD ============
  // CBD items in the left area near Novelty 5
  for (let i = 0; i < 8; i++) {
    zones.push({
      id: `cbd${i + 1}`, name: `CBD (${i + 1})`, type: "cbd",
      x: 140 + (i % 2) * 30, y: 310 + Math.floor(i / 2) * 22,
      width: 28, height: 18,
      sections: [],
      description: `CBD storage area ${i + 1}`,
    });
  }

  // ============ MAIN AISLES — LEFT BLOCK (1-8) ============
  const aCellW = 26;
  const aRowH = 13;
  const aLeftX = 305;
  const aBottomY = 645;
  const aSpacing = 32; // vertical spacing between aisles

  // Aisle(1) — special: uses letter sections A-I
  zones.push(makeDualRowAisle(
    "aisle1", "Aisle(1)", aLeftX, aBottomY,
    9, aCellW, aRowH,
    { labels: ["A", "B", "C", "D", "E", "F", "G", "H", "I"], endCaps: { front: true } }
  ));

  // Aisle(2) — Sample aisle
  zones.push(makeDualRowAisle("aisle2", "Aisle(2)", aLeftX, aBottomY - aSpacing, 9, aCellW, aRowH, { endCaps: { front: true } }));

  // Aisle(3)
  zones.push(makeDualRowAisle("aisle3", "Aisle(3)", aLeftX, aBottomY - 2 * aSpacing, 9, aCellW, aRowH, { endCaps: { front: true } }));

  // Aisle(4)
  zones.push(makeDualRowAisle("aisle4", "Aisle(4)", aLeftX, aBottomY - 3 * aSpacing, 9, aCellW, aRowH, { endCaps: { front: true, back: true } }));

  // Aisle(5)
  zones.push(makeDualRowAisle("aisle5", "Aisle(5)", aLeftX, aBottomY - 4 * aSpacing, 9, aCellW, aRowH, { endCaps: { front: true, back: true } }));

  // Aisle(6)
  zones.push(makeDualRowAisle("aisle6", "Aisle(6)", aLeftX, aBottomY - 5 * aSpacing, 9, aCellW, aRowH, { endCaps: { front: true, back: true } }));

  // Aisle(7)
  zones.push(makeDualRowAisle("aisle7", "Aisle(7)", aLeftX, aBottomY - 6 * aSpacing, 9, aCellW, aRowH, { endCaps: { front: true, back: true } }));

  // Aisle(8) — top of left block
  zones.push(makeDualRowAisle("aisle8", "Aisle(8)", aLeftX, aBottomY - 7 * aSpacing, 9, aCellW, aRowH, { endCaps: { front: true, back: true } }));

  // ============ MAIN AISLES — RIGHT BLOCK (9-20) ============
  const aRightX = 680;

  for (let i = 0; i < 12; i++) {
    zones.push(makeDualRowAisle(
      `aisle${9 + i}`, `Aisle(${9 + i})`,
      aRightX, aBottomY - i * aSpacing,
      9, aCellW, aRowH,
      { endCaps: { front: true, back: true } }
    ));
  }

  // ============ VERTICAL AISLES — RIGHT SIDE (21-26) ============
  const vAisleW = 22;
  const vAisleH = 240;
  const vCellH = 24;
  const vBaseX = 975;
  const vBaseY = 210;
  const vSpacing = 28;

  for (let i = 0; i < 4; i++) {
    const sCount = 10;
    zones.push({
      id: `aisle${21 + i}`, name: `Aisle(${21 + i})`, type: "aisle",
      x: vBaseX + i * vSpacing, y: vBaseY, width: vAisleW, height: sCount * vCellH,
      sections: makeVerticalSections(sCount, vAisleW, vCellH),
      vertical: true,
      description: `Aisle(${21 + i}) — Vertical, ${sCount} sections`,
    });
  }

  // Aisle(25) — implied
  zones.push({
    id: "aisle25", name: "Aisle(25)", type: "aisle",
    x: vBaseX + 4 * vSpacing, y: vBaseY, width: vAisleW, height: 8 * vCellH,
    sections: makeVerticalSections(8, vAisleW, vCellH),
    vertical: true,
    description: "Aisle(25) — Vertical, 8 sections",
  });

  // Aisle(26) — far right, tall
  zones.push({
    id: "aisle26", name: "Aisle(26)", type: "aisle",
    x: vBaseX + 5 * vSpacing + 10, y: 180, width: vAisleW, height: 12 * vCellH,
    sections: makeVerticalSections(12, vAisleW, vCellH),
    vertical: true,
    description: "Aisle(26) — Vertical, 12 sections, far right",
  });

  // ============ STORAGE ============
  zones.push({
    id: "storage", name: "Storage", type: "storage",
    x: 1150, y: 480, width: 60, height: 160,
    sections: [],
    description: "General storage area",
  });

  // ============ P06 MARKERS ============
  const p06Positions = [
    { x: 260, y: 310 }, { x: 260, y: 430 }, { x: 260, y: 510 },
    { x: 260, y: 580 }, { x: 260, y: 640 },
    { x: 1130, y: 90 }, { x: 1130, y: 710 },
  ];
  p06Positions.forEach((p, i) => {
    zones.push({
      id: `p06_${i}`, name: "P06", type: "p06",
      x: p.x, y: p.y, width: 20, height: 14,
      sections: [], description: "P06 utility marker",
    });
  });

  // ============ END CAPS ON AISLES ============
  // Left side end caps
  for (let i = 0; i < 8; i++) {
    zones.push({
      id: `ec_left_${i}`, name: `End Cap`, type: "endcap",
      x: aLeftX - 14, y: aBottomY - i * aSpacing, width: 12, height: aRowH * 2,
      sections: [], description: `End Cap — Aisle(${i + 1}) south face`,
    });
  }

  // Right side end caps for left block
  for (let i = 3; i < 8; i++) {
    zones.push({
      id: `ec_right_l_${i}`, name: `End Cap`, type: "endcap",
      x: aLeftX + 9 * aCellW + 2, y: aBottomY - i * aSpacing, width: 12, height: aRowH * 2,
      sections: [], description: `End Cap — Aisle(${i + 1}) north face`,
    });
  }

  // End caps for right block
  for (let i = 0; i < 12; i++) {
    zones.push({
      id: `ec_left_r_${i}`, name: `End Cap`, type: "endcap",
      x: aRightX - 14, y: aBottomY - i * aSpacing, width: 12, height: aRowH * 2,
      sections: [], description: `End Cap — Aisle(${9 + i}) south face`,
    });
    zones.push({
      id: `ec_right_r_${i}`, name: `End Cap`, type: "endcap",
      x: aRightX + 9 * aCellW + 2, y: aBottomY - i * aSpacing, width: 12, height: aRowH * 2,
      sections: [], description: `End Cap — Aisle(${9 + i}) north face`,
    });
  }

  // ============ STRUCTURAL ELEMENTS ============
  const structural: StructuralElement[] = [];

  // Column markers (circles with labels)
  const columns = [
    { x: 30, y: 730, label: "Ø3\nA12" },
    { x: 55, y: 70, label: "Ø2\nA21" },
    { x: 280, y: 15, label: "Ø1\nA31" },
    { x: 555, y: 15, label: "Ø7\nA31" },
    { x: 55, y: 280, label: "Ø4\nA12" },
  ];
  columns.forEach((c) => {
    structural.push({ type: "column", x: c.x, y: c.y, label: c.label, radius: 12 });
  });

  // Dimension lines
  structural.push({ type: "dimension", x: 30, y: 780, x2: 1200, label: "430'-0\"" });
  structural.push({ type: "dimension", x: 610, y: 76, x2: 760, label: "15'-0\"" });
  structural.push({ type: "dimension", x: 760, y: 76, x2: 920, label: "56'-0\"" });
  structural.push({ type: "dimension", x: 920, y: 76, x2: 1000, label: "41'-0\"" });

  // Labels
  structural.push({ type: "label", x: 310, y: 635, label: "Sample:" });

  // Grid columns 1-11
  const gridCols = [
    { label: "1", x: 40 },
    { label: "2", x: 150 },
    { label: "3", x: 280 },
    { label: "4", x: 430 },
    { label: "5", x: 560 },
    { label: "6", x: 640 },
    { label: "7", x: 770 },
    { label: "8", x: 900 },
    { label: "9", x: 1010 },
    { label: "10", x: 1120 },
    { label: "11", x: 1230 },
  ];

  // Grid rows A-D
  const gridRows = [
    { label: "D", y: 85 },
    { label: "C", y: 310 },
    { label: "B", y: 520 },
    { label: "A", y: 730 },
  ];

  return {
    width: 1280,
    height: 820,
    zones,
    structural,
    gridCols,
    gridRows,
  };
}
