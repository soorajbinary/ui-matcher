import WarehouseFloorPlan from "@/components/WarehouseFloorPlan";
import { getWarehouseLayout } from "@/data/warehouseData";

const layout = getWarehouseLayout();

const Index = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
        <div>
          <h1 className="text-lg font-bold text-card-foreground tracking-tight">Warehouse Floor Plan</h1>
          <p className="text-xs text-muted-foreground">
            Interactive layout • {layout.zones.length} zones • Naming: Aisle.Section.Shelf.Bin
          </p>
        </div>
      </header>
      <main className="flex-1 min-h-0">
        <WarehouseFloorPlan layout={layout} />
      </main>
    </div>
  );
};

export default Index;
