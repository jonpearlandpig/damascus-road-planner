import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { plannerObjectDefinitions } from '../../planner/objectLibrary';
import type { PlannerAction } from '../../planner/store';
import { plannerObjectCategories, type PlannerObjectCategory } from '../../planner/types';
import { formatFeet } from '../../lib/units';

interface ObjectLibraryProps {
  onAction: (action: PlannerAction) => void;
}

export function ObjectLibrary({ onAction }: ObjectLibraryProps) {
  const [category, setCategory] = useState<PlannerObjectCategory>('Truss');
  const definitions = useMemo(() => plannerObjectDefinitions.filter((definition) => definition.category === category), [category]);

  return (
    <section className="planner-panel object-library" aria-label="Production object library">
      <div className="panel-heading">
        <div><span className="eyebrow">OBJECT LIBRARY</span><h2>Production objects</h2></div>
      </div>
      <label className="panel-select">
        <span>Category</span>
        <select value={category} onChange={(event) => setCategory(event.currentTarget.value as PlannerObjectCategory)}>
          {plannerObjectCategories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <div className="library-list">
        {definitions.map((definition) => (
          <div key={definition.id} className="library-row">
            <div>
              <strong>{definition.label}</strong>
              <small>{formatFeet(definition.dimensionsFt.widthFt)} x {formatFeet(definition.dimensionsFt.depthFt)} x {formatFeet(definition.dimensionsFt.heightFt)} / {definition.dimensionStatus}</small>
            </div>
            <button onClick={() => onAction({ type: 'addObject', definitionId: definition.id })} aria-label={`Insert ${definition.label}`}><Plus size={15} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
