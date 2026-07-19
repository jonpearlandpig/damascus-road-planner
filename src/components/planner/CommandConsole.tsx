import { Send } from 'lucide-react';
import { useState } from 'react';
import { dispatchPlannerCommand, parsePlannerCommand } from '../../planner/commands';
import type { PlannerHistory } from '../../planner/history';
import type { VenueTwin } from '../../data/types';
import type { PlannerScene } from '../../planner/types';

interface CommandConsoleProps {
  history: PlannerHistory;
  venue: VenueTwin;
  onSceneResult: (scene: PlannerScene, message?: string) => void;
}

export function CommandConsole({ history, venue, onSceneResult }: CommandConsoleProps) {
  const [commandText, setCommandText] = useState('');
  const [message, setMessage] = useState('Ready');

  function runCommand() {
    const command = parsePlannerCommand(commandText, history.present.selectedObjectId);
    if (!command) {
      setMessage('Command not recognized');
      return;
    }
    const result = dispatchPlannerCommand(history.present, venue, command);
    setMessage(result.message ?? (result.rejected ? 'Command rejected' : 'Command applied'));
    if (!result.rejected) {
      onSceneResult(result.scene, result.message);
      setCommandText('');
    }
  }

  return (
    <section className="planner-panel command-console" aria-label="Command console">
      <div className="panel-heading">
        <div><span className="eyebrow">COMMANDS</span><h2>Dispatcher</h2></div>
      </div>
      <div className="inline-form">
        <input value={commandText} onChange={(event) => setCommandText(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === 'Enter') runCommand(); }} aria-label="Planner command" placeholder="move drt-b-stage 0 0" />
        <button onClick={runCommand} aria-label="Run planner command"><Send size={15} /></button>
      </div>
      <p className="muted-line">{message}</p>
    </section>
  );
}
