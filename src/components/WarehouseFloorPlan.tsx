import React, { useState, useRef, useCallback, useEffect } from "react";
import { WarehouseZone, Section, ZONE_COLORS, ZoneType } from "@/data/warehouseData";

interface Props {
  zones: WarehouseZone[];
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface TooltipData {
  zone: WarehouseZone;
  section?: Section;
  screenX: number;
  screenY: number;
}

const GRID_COLS = 10;
const GRID_LABELS_Y = [
  { label: "D", y: 60 },
  { label: "C", y: 280 },
  { label: "B", y: 500 },
  { label: "A", y: 700 },
];

const ZoneRect: React.FC<{
  zone: WarehouseZone;
  isSelected: boolean;
  onHover: (zone: WarehouseZone, section: Section | undefined, e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: (zone: WarehouseZone) => void;
}> = ({ zone, isSelected, onHover, onLeave, onClick }) => {
  const colors = ZONE_COLORS[zone.type];

  return (
    <g
      className="cursor-pointer transition-all duration-150"
      onMouseMove={(e) => onHover(zone, undefined, e)}
      onMouseLeave={onLeave}
      onClick={() => onClick(zone)}
    >
      {/* Zone background */}
      <rect
        x={zone.x}
        y={zone.y}
        width={zone.width}
        height={zone.height}
        fill={isSelected ? colors.stroke.replace(")", " / 0.3)") : colors.fill}
        stroke={colors.stroke}
        strokeWidth={isSelected ? 2 : 1}
        rx={3}
      />

      {/* Sections */}
      {zone.sections.map((section) => (
        <g
          key={section.id}
          onMouseMove={(e) => {
            e.stopPropagation();
            onHover(zone, section, e);
          }}
        >
          <rect
            x={zone.x + section.x}
            y={zone.y + section.y}
            width={section.width - 1}
            height={section.height - 1}
            fill="transparent"
            stroke={colors.stroke}
            strokeWidth={0.5}
            strokeOpacity={0.4}
            rx={1}
          />
          <text
            x={zone.x + section.x + section.width / 2}
            y={zone.y + section.y + section.height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={8}
            fill={colors.text}
            className="pointer-events-none select-none"
          >
            {section.label}
          </text>
        </g>
      ))}

      {/* Zone label */}
      <text
        x={zone.x + zone.width / 2}
        y={zone.y - 5}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
        fill={colors.text}
        className="pointer-events-none select-none"
      >
        {zone.name}
      </text>
    </g>
  );
};

const Tooltip: React.FC<{ data: TooltipData }> = ({ data }) => {
  const { zone, section, screenX, screenY } = data;
  const colors = ZONE_COLORS[zone.type];

  return (
    <div
      className="fixed z-50 pointer-events-none rounded-lg border border-border bg-card px-3 py-2 shadow-lg"
      style={{
        left: screenX + 16,
        top: screenY - 10,
        maxWidth: 260,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: colors.stroke }}
        />
        <span className="font-semibold text-sm text-card-foreground">{zone.name}</span>
      </div>
      {section && (
        <div className="text-xs text-muted-foreground">
          Section: <span className="font-medium text-foreground">{section.label}</span>
        </div>
      )}
      {zone.description && (
        <div className="text-xs text-muted-foreground mt-1">{zone.description}</div>
      )}
      <div className="text-xs text-muted-foreground mt-1">
        Type: <span className="font-medium capitalize text-foreground">{zone.type}</span>
        {zone.sections.length > 0 && ` • ${zone.sections.length} sections`}
      </div>
    </div>
  );
};

const WarehouseFloorPlan: React.FC<Props> = ({ zones }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ZoneType | "all">("all");

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform((t) => {
      const newScale = Math.min(Math.max(t.scale * scaleFactor, 0.3), 5);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { ...t, scale: newScale };
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return {
        scale: newScale,
        x: mx - (mx - t.x) * (newScale / t.scale),
        y: my - (my - t.y) * (newScale / t.scale),
      };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTransform((t) => ({ ...t, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleZoneHover = useCallback(
    (zone: WarehouseZone, section: Section | undefined, e: React.MouseEvent) => {
      setTooltip({ zone, section, screenX: e.clientX, screenY: e.clientY });
    },
    []
  );

  const handleZoneClick = useCallback((zone: WarehouseZone) => {
    setSelectedZone((prev) => (prev === zone.id ? null : zone.id));
  }, []);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });
  const zoomIn = () => setTransform((t) => ({ ...t, scale: Math.min(t.scale * 1.3, 5) }));
  const zoomOut = () => setTransform((t) => ({ ...t, scale: Math.max(t.scale * 0.7, 0.3) }));

  const filteredZones = activeFilter === "all" ? zones : zones.filter((z) => z.type === activeFilter);

  const filterTypes: { type: ZoneType | "all"; label: string }[] = [
    { type: "all", label: "All" },
    { type: "aisle", label: "Aisles" },
    { type: "tobacco", label: "Tobacco" },
    { type: "novelty", label: "Novelty" },
    { type: "cooler", label: "Cooler" },
    { type: "freezer", label: "Freezer" },
    { type: "office", label: "Office" },
    { type: "receiving", label: "Receiving" },
    { type: "cbd", label: "CBD" },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card flex-wrap">
        <div className="flex items-center gap-1 mr-4">
          <button onClick={zoomIn} className="px-2 py-1 text-sm rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">+</button>
          <button onClick={zoomOut} className="px-2 py-1 text-sm rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">−</button>
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
                activeFilter === f.type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
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
        onMouseLeave={() => {
          handleMouseUp();
          setTooltip(null);
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="select-none"
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Grid background */}
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(220 15% 85% / 0.3)" strokeWidth="0.5" />
              </pattern>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#smallGrid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="hsl(220 15% 85% / 0.6)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="-200" y="-100" width="1500" height="1000" fill="url(#grid)" />

            {/* Outer wall */}
            <rect x={20} y={30} width={1140} height={720} fill="none" stroke="hsl(220 25% 10%)" strokeWidth={2} rx={4} />

            {/* Column grid labels (1-10) */}
            {Array.from({ length: GRID_COLS }, (_, i) => (
              <g key={`col${i}`}>
                <text x={40 + i * 112} y={20} fontSize={12} fontWeight={700} fill="hsl(220 25% 10%)" textAnchor="middle" className="select-none">
                  {i + 1}
                </text>
                <text x={40 + i * 112} y={770} fontSize={12} fontWeight={700} fill="hsl(220 25% 10%)" textAnchor="middle" className="select-none">
                  {i + 1}
                </text>
                <line x1={40 + i * 112} y1={30} x2={40 + i * 112} y2={750} stroke="hsl(220 15% 85% / 0.3)" strokeWidth={0.5} strokeDasharray="4 4" />
              </g>
            ))}

            {/* Row labels */}
            {GRID_LABELS_Y.map((row) => (
              <g key={row.label}>
                <text x={10} y={row.y + 10} fontSize={12} fontWeight={700} fill="hsl(220 25% 10%)" className="select-none">
                  {row.label}
                </text>
                <line x1={20} y1={row.y} x2={1160} y2={row.y} stroke="hsl(220 15% 85% / 0.3)" strokeWidth={0.5} strokeDasharray="4 4" />
              </g>
            ))}

            {/* Dimensions text */}
            <text x={580} y={762} fontSize={9} fill="hsl(220 10% 45%)" textAnchor="middle" className="select-none">
              430'-0"
            </text>

            {/* Zones */}
            {filteredZones.map((zone) => (
              <ZoneRect
                key={zone.id}
                zone={zone}
                isSelected={selectedZone === zone.id}
                onHover={handleZoneHover}
                onLeave={() => setTooltip(null)}
                onClick={handleZoneClick}
              />
            ))}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && <Tooltip data={tooltip} />}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-md">
          <div className="text-xs font-semibold text-card-foreground mb-2">Legend</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(ZONE_COLORS).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: colors.stroke }} />
                <span className="text-xs text-muted-foreground capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Help hint */}
        <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-2 py-1 border border-border">
          Scroll to zoom • Drag to pan • Click zones to select
        </div>
      </div>

      {/* Selected zone detail panel */}
      {selectedZone && (
        <SelectedZonePanel
          zone={zones.find((z) => z.id === selectedZone)!}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
};

const SelectedZonePanel: React.FC<{ zone: WarehouseZone; onClose: () => void }> = ({ zone, onClose }) => {
  const colors = ZONE_COLORS[zone.type];
  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.stroke }} />
          <h3 className="font-semibold text-card-foreground">{zone.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{zone.type}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
      </div>
      {zone.description && <p className="text-sm text-muted-foreground mb-2">{zone.description}</p>}
      {zone.sections.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {zone.sections.map((s) => (
            <div
              key={s.id}
              className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WarehouseFloorPlan;
