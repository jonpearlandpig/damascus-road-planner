import { Plus, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { canPlaceGear, filterForDepartment, gearFilters, gearItemToDefinition, gearPackId, gearPacks, type GearFilter } from '../../planner/gearAdapter';
import type { PlannerAction } from '../../planner/store';
import type { PlannerScene } from '../../planner/types';

interface GearPackBrowserProps {
  scene: PlannerScene;
  onAction: (action: PlannerAction) => void;
}

export function GearPackBrowser({ scene, onAction }: GearPackBrowserProps) {
  const [filter, setFilter] = useState<GearFilter>('Lighting');
  const [override, setOverride] = useState(false);
  const visiblePacks = useMemo(() => gearPacks.filter((pack) => filterForDepartment(pack.department) === filter), [filter]);

  return (
    <section className="planner-panel gear-browser" aria-label="Gear-pack browser">
      <div className="panel-heading">
        <div><span className="eyebrow">GEAR PACKS</span><h2>Canonical gear</h2></div>
      </div>
      <div className="segmented-control">
        {gearFilters.map((item) => (
          <button key={item} className={filter === item ? 'segment segment--active' : 'segment'} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>
      <label className="checkbox-line">
        <input type="checkbox" checked={override} onChange={(event) => setOverride(event.currentTarget.checked)} />
        <span>Planning override</span>
      </label>
      {visiblePacks.map((pack) => (
        <div key={pack.department} className="gear-pack-group">
          <h3>{pack.department}</h3>
          {pack.items.length === 0 ? <p className="muted-line">No filed items in this pack.</p> : pack.items.map((item) => {
            const definition = gearItemToDefinition(pack, item);
            const allocation = definition.gearPackRef ? canPlaceGear(scene, definition.gearPackRef, override) : { allowed: true, used: 0 };
            return (
              <div key={item.id} className="library-row">
                <div>
                  <strong>{item.item}</strong>
                  <small>{item.id} / qty {allocation.used}/{item.qty} / {item.status}</small>
                </div>
                {allocation.warning && <TriangleAlert size={15} className="row-warning" />}
                <button
                  disabled={!allocation.allowed}
                  onClick={() => onAction({ type: 'addObject', definitionId: definition.id, allowGearOverride: override })}
                  aria-label={`Insert ${item.item} from ${gearPackId(pack)}`}
                >
                  <Plus size={15} />
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
