import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  WarehouseZone, WarehouseLayout, Section, StructuralElement,
  ZONE_COLORS, ZoneType,
} from "@/data/warehouseData";

interface Props {
  layout: WarehouseLayout;
}

interface Transform { x: number; y: number; scale: number }

interface TooltipData {
  zone: WarehouseZone;
  section?: Section;
  screenX: number;
  screenY: number;
}

// ─── Zone Renderer ───
const ZoneRect: React.FC<{
  zone: WarehouseZone;
  isSelected: boolean;
  dimmed: boolean;
  onHover: (z: WarehouseZone, s: Section | undefined, e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: (z: WarehouseZone) => void;
}> = ({ zone, isSelected, dimmed, onHover, onLeave, onClick }) => {
  const c = ZONE_COLORS[zone.type];
  const opacity = dimmed ? 0.2 : 1;

  return (
    <g
      className="cursor-pointer"
      style={{ opacity }}
      onMouseMove={(e) => onHover(zone, undefined, e)}
      onMouseLeave={onLeave}
      onClick={() => onClick(zone)}
    >
      <rect
        x={zone.x} y={zone.y} width={zone.width} height={zone.height}
        fill={isSelected ? c.stroke.replace(")", " / 0.3)") : c.fill}
        stroke={c.stroke}
        strokeWidth={isSelected ? 2 : 1}
        rx={2}
      />
      {/* Sections */}
      {zone.sections.map((s) => (
        <g key={s.id} onMouseMove={(e) => { e.stopPropagation(); onHover(zone, s, e); }}>
          <rect
            x={zone.x + s.x} y={zone.y + s.y}
            width={s.width - 0.5} height={s.height - 0.5}
            fill="transparent" stroke={c.stroke} strokeWidth={0.4} strokeOpacity={0.5} rx={1}
          />
          <text
            x={zone.x + s.x + s.width / 2} y={zone.y + s.y + s.height / 2}
            textAnchor="middle" dominantBaseline="central"
            fontSize={7} fill={c.text} className="pointer-events-none select-none"
          >
            {s.label}
          </text>
        </g>
      ))}
      {/* Label */}
      {zone.type !== "p06" && zone.type !== "endcap" && (
        zone.vertical ? (
          <text
            x={zone.x + zone.width / 2} y={zone.y + zone.height / 2}
            textAnchor="middle" dominantBaseline="central"
            fontSize={8} fontWeight={600} fill={c.text}
            transform={`rotate(-90, ${zone.x + zone.width / 2}, ${zone.y + zone.height / 2})`}
            className="pointer-events-none select-none"
          >
            {zone.name}
          </text>
        ) : zone.labelBelow ? (
          <text
            x={zone.x + zone.width / 2} y={zone.y + zone.height + 10}
            textAnchor="middle" fontSize={8} fontWeight={600} fill="hsl(0 72% 51%)"
            className="pointer-events-none select-none"
          >
            {zone.name}
          </text>
        ) : (
          <text
            x={zone.x + zone.width / 2} y={zone.y - 4}
            textAnchor="middle" fontSize={8} fontWeight={600} fill={c.text}
            className="pointer-events-none select-none"
          >
            {zone.name}
          </text>
        )
      )}
      {/* P06 label inside */}
      {zone.type === "p06" && (
        <text
          x={zone.x + zone.width / 2} y={zone.y + zone.height / 2}
          textAnchor="middle" dominantBaseline="central"
          fontSize={6} fontWeight={700} fill={c.text}
          className="pointer-events-none select-none"
        >
          P06
        </text>
      )}
      {/* End Cap label */}
      {zone.type === "endcap" && (
        <text
          x={zone.x + zone.width / 2} y={zone.y + zone.height / 2}
          textAnchor="middle" dominantBaseline="central"
          fontSize={5} fill={c.text}
          transform={`rotate(-90, ${zone.x + zone.width / 2}, ${zone.y + zone.height / 2})`}
          className="pointer-events-none select-none"
        >
          EC
        </text>
      )}
    </g>
  );
};

// ─── Structural Elements ───
const StructuralRenderer: React.FC<{ elements: StructuralElement[] }> = ({ elements }) => (
  <g>
    {elements.map((el, i) => {
      if (el.type === "column") {
        return (
          <g key={i}>
            <circle cx={el.x} cy={el.y} r={el.radius || 10} fill="none" stroke="hsl(0 0% 40%)" strokeWidth={1} />
            <text x={el.x} y={el.y} textAnchor="middle" dominantBaseline="central" fontSize={6} fill="hsl(0 0% 40%)" className="select-none">
              {el.label?.split("\n")[0]}
            </text>
          </g>
        );
      }
      if (el.type === "dimension" && el.x2 !== undefined) {
        const midX = (el.x + el.x2) / 2;
        return (
          <g key={i}>
            <line x1={el.x} y1={el.y} x2={el.x2} y2={el.y} stroke="hsl(0 0% 55%)" strokeWidth={0.5} />
            <text x={midX} y={el.y - 3} textAnchor="middle" fontSize={7} fill="hsl(0 0% 45%)" className="select-none">
              {el.label}
            </text>
          </g>
        );
      }
      if (el.type === "label") {
        return (
          <text key={i} x={el.x} y={el.y} fontSize={7} fontStyle="italic" fill="hsl(0 0% 40%)" className="select-none">
            {el.label}
          </text>
        );
      }
      return null;
    })}
  </g>
);

// ─── Tooltip ───
const Tooltip: React.FC<{ data: TooltipData }> = ({ data }) => {
  const { zone, section, screenX, screenY } = data;
  const c = ZONE_COLORS[zone.type];
  return (
    <div
      className="fixed z-50 pointer-events-none rounded-lg border border-border bg-card px-3 py-2 shadow-lg"
      style={{ left: screenX + 16, top: screenY - 10, maxWidth: 280 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.stroke }} />
        <span className="font-semibold text-sm text-card-foreground">{zone.name}</span>
      </div>
      {section && (
        <div className="text-xs text-muted-foreground">Section: <span className="font-medium text-foreground">{section.label}</span></div>
      )}
      {zone.description && <div className="text-xs text-muted-foreground mt-1">{zone.description}</div>}
      <div className="text-xs text-muted-foreground mt-1">
        Type: <span className="font-medium capitalize text-foreground">{c.label}</span>
        {zone.sections.length > 0 && ` • ${zone.sections.length} sections`}
      </div>
    </div>
  );
};

// ─── Detail Panel ───
const SelectedZonePanel: React.FC<{ zone: WarehouseZone; onClose: () => void }> = ({ zone, onClose }) => {
  const c = ZONE_COLORS[zone.type];
  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: c.stroke }} />
          <h3 className="font-semibold text-card-foreground">{zone.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{c.label}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
      </div>
      {zone.description && <p className="text-sm text-muted-foreground mb-2">{zone.description}</p>}
      {zone.sections.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {zone.sections.map((s) => (
            <div key={s.id} className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───
const WarehouseFloorPlan: React.FC<Props> = ({ layout }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ZoneType | "all">("all");

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform((t) => {
      const newScale = Math.min(Math.max(t.scale * factor, 0.3), 5);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { ...t, scale: newScale };
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return { scale: newScale, x: mx - (mx - t.x) * (newScale / t.scale), y: my - (my - t.y) * (newScale / t.scale) };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { setIsPanning(true); setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y }); }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) setTransform((t) => ({ ...t, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
  };
  const handleMouseUp = () => setIsPanning(false);

  const handleZoneHover = useCallback((z: WarehouseZone, s: Section | undefined, e: React.MouseEvent) => {
    setTooltip({ zone: z, section: s, screenX: e.clientX, screenY: e.clientY });
  }, []);

  const handleZoneClick = useCallback((z: WarehouseZone) => {
    setSelectedZone((prev) => (prev === z.id ? null : z.id));
  }, []);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });
  const zoomIn = () => setTransform((t) => ({ ...t, scale: Math.min(t.scale * 1.3, 5) }));
  const zoomOut = () => setTransform((t) => ({ ...t, scale: Math.max(t.scale * 0.7, 0.3) }));

  const visibleTypes: ZoneType[] = ["aisle", "tobacco", "novelty", "cooler", "freezer", "office", "receiving", "cbd", "storage"];
  const filterTypes: { type: ZoneType | "all"; label: string }[] = [
    { type: "all", label: "All" },
    ...visibleTypes.map((t) => ({ type: t, label: ZONE_COLORS[t].label })),
  ];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card flex-wrap">
        <div className="flex items-center gap-1 mr-4">
          <button onClick={zoomIn} className="px-2 py-1 text-sm rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-mono">+</button>
          <button onClick={zoomOut} className="px-2 py-1 text-sm rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-mono">−</button>
          <button onClick={resetView} className="px-2 py-1 text-xs rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">Reset</button>
          <span className="text-xs text-muted-foreground ml-2">{Math.round(transform.scale * 100)}%</span>
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1 flex-wrap">
          {filterTypes.map((f) => (
            <button
              key={f.type}
              onClick={() => setActiveFilter(f.type)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeFilter === f.type ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-background cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setTooltip(null); }}
      >
        <svg width="100%" height="100%" className="select-none">
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Grid */}
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(220 15% 85% / 0.25)" strokeWidth="0.5" />
              </pattern>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#smallGrid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="hsl(220 15% 85% / 0.5)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect x={-50} y={-50} width={layout.width + 100} height={layout.height + 100} fill="url(#grid)" />

            {/* Outer wall */}
            <rect x={15} y={30} width={layout.width - 40} height={layout.height - 60} fill="none" stroke="hsl(220 25% 15%)" strokeWidth={2} rx={2} />

            {/* Grid col labels */}
            {layout.gridCols.map((col) => (
              <g key={col.label}>
                <rect x={col.x - 10} y={5} width={20} height={16} fill="none" stroke="hsl(220 25% 15%)" strokeWidth={1} rx={2} />
                <text x={col.x} y={16} textAnchor="middle" fontSize={10} fontWeight={700} fill="hsl(220 25% 15%)" className="select-none">{col.label}</text>
                <rect x={col.x - 10} y={layout.height - 15} width={20} height={16} fill="none" stroke="hsl(220 25% 15%)" strokeWidth={1} rx={2} />
                <text x={col.x} y={layout.height - 2} textAnchor="middle" fontSize={10} fontWeight={700} fill="hsl(220 25% 15%)" className="select-none">{col.label}</text>
                <line x1={col.x} y1={30} x2={col.x} y2={layout.height - 30} stroke="hsl(220 15% 80% / 0.25)" strokeWidth={0.5} strokeDasharray="3 3" />
              </g>
            ))}

            {/* Grid row labels */}
            {layout.gridRows.map((row) => (
              <g key={row.label}>
                <text x={8} y={row.y + 4} fontSize={11} fontWeight={700} fill="hsl(220 25% 15%)" className="select-none">{row.label}</text>
                <line x1={15} y1={row.y} x2={layout.width - 25} y2={row.y} stroke="hsl(220 15% 80% / 0.25)" strokeWidth={0.5} strokeDasharray="3 3" />
              </g>
            ))}

            {/* Structural elements */}
            <StructuralRenderer elements={layout.structural} />

            {/* Zones */}
            {layout.zones.map((zone) => (
              <ZoneRect
                key={zone.id}
                zone={zone}
                isSelected={selectedZone === zone.id}
                dimmed={activeFilter !== "all" && zone.type !== activeFilter}
                onHover={handleZoneHover}
                onLeave={() => setTooltip(null)}
                onClick={handleZoneClick}
              />
            ))}
          </g>
        </svg>

        {tooltip && <Tooltip data={tooltip} />}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-md">
          <div className="text-xs font-semibold text-card-foreground mb-2">Legend</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {visibleTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter((f) => (f === type ? "all" : type))}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: ZONE_COLORS[type].stroke }} />
                <span className={`text-xs capitalize ${activeFilter === type ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {ZONE_COLORS[type].label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-2 py-1 border border-border">
          Scroll to zoom • Drag to pan • Click to inspect
        </div>
      </div>

      {selectedZone && (
        <SelectedZonePanel
          zone={layout.zones.find((z) => z.id === selectedZone)!}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
};

export default WarehouseFloorPlan;
