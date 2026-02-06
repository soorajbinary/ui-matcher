export type ZoneType = "aisle" | "tobacco" | "novelty" | "cooler" | "freezer" | "office" | "receiving" | "cbd";

export interface Section {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  description?: string;
}

// Zone color map using CSS vars
export const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string; text: string }> = {
  aisle:     { fill: "hsl(215 70% 45% / 0.15)", stroke: "hsl(215 70% 45%)", text: "hsl(215 70% 35%)" },
  tobacco:   { fill: "hsl(30 85% 55% / 0.15)",  stroke: "hsl(30 85% 55%)",  text: "hsl(30 85% 40%)" },
  novelty:   { fill: "hsl(280 50% 55% / 0.15)", stroke: "hsl(280 50% 55%)", text: "hsl(280 50% 40%)" },
  cooler:    { fill: "hsl(195 80% 50% / 0.15)", stroke: "hsl(195 80% 50%)", text: "hsl(195 80% 35%)" },
  freezer:   { fill: "hsl(210 90% 60% / 0.15)", stroke: "hsl(210 90% 60%)", text: "hsl(210 90% 40%)" },
  office:    { fill: "hsl(150 30% 50% / 0.15)", stroke: "hsl(150 30% 50%)", text: "hsl(150 30% 35%)" },
  receiving: { fill: "hsl(45 80% 55% / 0.15)",  stroke: "hsl(45 80% 55%)",  text: "hsl(45 80% 35%)" },
  cbd:       { fill: "hsl(140 60% 40% / 0.15)", stroke: "hsl(140 60% 40%)", text: "hsl(140 60% 30%)" },
};

function makeSections(count: number, startX: number, startY: number, cellW: number, cellH: number, direction: "horizontal" | "vertical" = "horizontal", labels?: string[]): Section[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    label: labels ? labels[i] : `${i + 1}`,
    x: direction === "horizontal" ? startX + i * cellW : startX,
    y: direction === "horizontal" ? startY : startY + i * cellH,
    width: cellW,
    height: cellH,
  }));
}

function makeAisle(id: string, name: string, x: number, y: number, sectionCount: number = 9): WarehouseZone {
  const w = sectionCount * 28;
  const h = 24;
  return {
    id, name, type: "aisle", x, y, width: w, height: h,
    sections: makeSections(sectionCount, 0, 0, 28, h),
    description: `${name} — ${sectionCount} sections, naming: ${name.replace(/[()]/g, "")}.Section.Shelf.Bin`,
  };
}

export function getWarehouseData(): WarehouseZone[] {
  const zones: WarehouseZone[] = [];

  // Office
  zones.push({
    id: "office", name: "Office", type: "office",
    x: 40, y: 60, width: 140, height: 180,
    sections: [], description: "Main office area",
  });

  // Receiving
  zones.push({
    id: "receiving", name: "Receiving", type: "receiving",
    x: 540, y: 40, width: 60, height: 180,
    sections: [], description: "Receiving dock area",
  });

  // Cooler & Freezers
  zones.push({
    id: "cooler", name: "Cooler", type: "cooler",
    x: 620, y: 60, width: 100, height: 70,
    sections: makeSections(5, 0, 0, 20, 70),
    description: "Cooler — Temperature controlled",
  });
  zones.push({
    id: "freezer1", name: "Freezer", type: "freezer",
    x: 730, y: 60, width: 100, height: 70,
    sections: makeSections(4, 0, 0, 25, 70),
    description: "Freezer — Sub-zero storage",
  });
  zones.push({
    id: "freezer2", name: "Freezer", type: "freezer",
    x: 840, y: 60, width: 100, height: 70,
    sections: makeSections(4, 0, 0, 25, 70),
    description: "Freezer 2 — Sub-zero storage",
  });

  // Tobacco zones (1-7)
  for (let i = 0; i < 7; i++) {
    const tx = 210 + (i < 2 ? 0 : i < 5 ? 0 : 0);
    const ty = 50 + i * 32;
    zones.push({
      id: `tobacco${i + 1}`, name: `Tobacco (${i + 1})`, type: "tobacco",
      x: 210, y: ty, width: i < 3 ? 310 : 220, height: 24,
      sections: makeSections(i < 3 ? 11 : 8, 0, 0, i < 3 ? 28 : 27, 24),
      description: `Tobacco Zone ${i + 1} — Restricted area`,
    });
  }

  // Novelty zones (1-7)
  const noveltyPositions = [
    { x: 40, y: 700, w: 150 }, { x: 300, y: 700, w: 200 },
    { x: 100, y: 320, w: 28, vertical: true }, { x: 130, y: 320, w: 28, vertical: true },
    { x: 160, y: 320, w: 28, vertical: true },
    { x: 250, y: 360, w: 260 }, { x: 250, y: 392, w: 260 },
  ];
  noveltyPositions.forEach((pos, i) => {
    zones.push({
      id: `novelty${i + 1}`, name: `Novelty (${i + 1})`, type: "novelty",
      x: pos.x, y: pos.y, width: pos.w, height: pos.vertical ? 180 : 24,
      sections: makeSections(pos.vertical ? 6 : 8, 0, 0, pos.vertical ? pos.w : pos.w / 8, pos.vertical ? 30 : 24, pos.vertical ? "vertical" : "horizontal"),
      description: `Novelty Zone ${i + 1}`,
    });
  });

  // Main aisles (1-20)
  const aisleBaseX = 250;
  for (let i = 0; i < 10; i++) {
    zones.push(makeAisle(`aisle${i + 1}`, `Aisle(${i + 1})`, aisleBaseX, 430 + i * 28, 9));
  }
  for (let i = 10; i < 20; i++) {
    zones.push(makeAisle(`aisle${i + 1}`, `Aisle(${i + 1})`, 620, 430 + (i - 10) * 28, 9));
  }

  // Vertical aisles on the right (21-26)
  for (let i = 0; i < 6; i++) {
    zones.push({
      id: `aisle${21 + i}`, name: `Aisle(${21 + i})`, type: "aisle",
      x: 960 + i * 32, y: 150, width: 26, height: 240,
      sections: makeSections(8, 0, 0, 26, 30, "vertical"),
      description: `Aisle(${21 + i}) — Vertical aisle, 8 sections`,
    });
  }

  // CBD zones
  zones.push({
    id: "cbd1", name: "CBD", type: "cbd",
    x: 130, y: 300, width: 60, height: 50,
    sections: makeSections(3, 0, 0, 20, 50),
    description: "CBD product storage",
  });

  return zones;
}
