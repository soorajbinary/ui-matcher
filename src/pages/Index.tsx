import WarehouseFloorPlan from "@/components/WarehouseFloorPlan";
import { getWarehouseData } from "@/data/warehouseData";

const zones = getWarehouseData();

const Index = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
        <div>
          <h1 className="text-lg font-bold text-card-foreground tracking-tight">Warehouse Floor Plan</h1>
          <p className="text-xs text-muted-foreground">Interactive layout — scroll to zoom, drag to pan, click to inspect</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {zones.length} zones
        </div>
      </header>
      <main className="flex-1 min-h-0">
        <WarehouseFloorPlan zones={zones} />
      </main>
    </div>
  );
};

export default Index;
