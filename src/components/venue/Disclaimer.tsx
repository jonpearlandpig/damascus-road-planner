import { AlertTriangle } from "lucide-react";

export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 border-l-2 border-firelight bg-firelight/5 px-3 py-2 text-xs text-ink-soft">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-firelight" />
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}
