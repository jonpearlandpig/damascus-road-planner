import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CircleDot } from "lucide-react";
import { repository } from "@/lib/drt/repository";
import { Disclaimer } from "@/components/venue/Disclaimer";
import type {
  ModelFidelity,
  RiggingStatus,
  LogisticsStatus,
  TourShow,
} from "@/lib/drt/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DRT Venue Twin · Spring 2027 Tour" },
      {
        name: "description",
        content:
          "Production-planning platform for the 19-show Damascus Road Tour Spring 2027 — venue twins, tour package versions and per-show placement.",
      },
      { property: "og:title", content: "DRT Venue Twin · Spring 2027 Tour" },
      {
        property: "og:description",
        content:
          "19-venue tour dashboard: model fidelity, source score, rigging, logistics, PM/TM actions.",
      },
    ],
  }),
  loader: () => ({ shows: repository.listShows() }),
  component: Dashboard,
});

function Dashboard() {
  const { shows } = Route.useLoaderData();

  const stats = summarize(shows);

  return (
    <div className="min-h-dvh bg-background text-ink">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="rule-label">Damascus Road Tour</div>
              <h1 className="font-display text-3xl leading-none tracking-tight text-ink">
                Spring 2027 · Venue Twin
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-ink-soft">
                Nineteen shows. Independent venue twins, one tour production
                package, per-show placement. Advance the model, not the guesswork.
              </p>
            </div>
            <div className="hidden gap-6 md:flex">
              <Stat label="Shows" value={String(stats.total)} />
              <Stat label="Pilots" value={String(stats.pilot)} />
              <Stat label="Avg. source score" value={`${stats.avgScore}`} />
              <Stat label="Rigging in review" value={String(stats.rigReview)} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="mb-4">
          <Disclaimer text="Planning and advance system only. Does not replace venue rigging approval, engineering, fire marshal, life safety, seating manifest or ADA review." />
        </div>

        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <div className="grid grid-cols-[1fr_1.4fr_100px_120px_120px_140px_1.4fr_120px] gap-x-3 border-b border-border bg-sand/60 px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground max-lg:hidden">
            <div>Date · City</div>
            <div>Venue</div>
            <div>Fidelity</div>
            <div>Source score</div>
            <div>Rigging</div>
            <div>Logistics</div>
            <div>PM / TM action</div>
            <div className="text-right">Last rev.</div>
          </div>
          <ul>
            {shows.map((s: TourShow) => (
              <ShowRow key={s.id} show={s} />
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="rule-label">{label}</div>
      <div className="font-display text-2xl leading-none tabular text-ink">{value}</div>
    </div>
  );
}

function ShowRow({ show }: { show: TourShow }) {
  const hasWorkspace = Boolean(show.venueSlug);
  const content = (
    <div className="grid grid-cols-[1fr_1.4fr_100px_120px_120px_140px_1.4fr_120px] items-center gap-x-3 gap-y-1 px-4 py-3 text-sm max-lg:grid-cols-2">
      <div>
        <div className="font-mono text-xs tabular text-ink-soft">
          {formatDate(show.date)}
        </div>
        <div className="text-ink">{show.city}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-ink">{show.venueName}</div>
        {hasWorkspace && <ArrowUpRight className="h-3.5 w-3.5 text-firelight" />}
      </div>
      <div>
        <FidelityBadge f={show.fidelity} />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-sand">
          <div
            className={cn(
              "h-full rounded-full",
              show.sourceScore >= 60 ? "bg-verified" : show.sourceScore >= 40 ? "bg-caution" : "bg-conflict",
            )}
            style={{ width: `${show.sourceScore}%` }}
          />
        </div>
        <span className="w-8 font-mono text-xs tabular text-ink-soft">
          {show.sourceScore}
        </span>
      </div>
      <div>
        <RigBadge s={show.riggingStatus} />
      </div>
      <div>
        <LogBadge s={show.logisticsStatus} />
      </div>
      <div className="text-xs text-ink-soft">
        {show.pmAction && (
          <div>
            <span className="rule-label mr-1">PM</span>
            {show.pmAction}
          </div>
        )}
        {show.tmAction && (
          <div>
            <span className="rule-label mr-1">TM</span>
            {show.tmAction}
          </div>
        )}
        {!show.pmAction && !show.tmAction && <span className="text-muted-foreground">—</span>}
      </div>
      <div className="font-mono text-[11px] tabular text-muted-foreground max-lg:hidden text-right">
        {show.lastRevision}
      </div>
    </div>
  );

  return (
    <li className="border-b border-border last:border-none hover:bg-sand/50">
      {show.venueSlug === "spectrum-center" ? (
        <Link to="/venues/spectrum-center">{content}</Link>
      ) : show.venueSlug === "bok-center" ? (
        <Link to="/venues/bok-center">{content}</Link>
      ) : (
        <div className="cursor-default">{content}</div>
      )}
    </li>
  );
}

function FidelityBadge({ f }: { f: ModelFidelity }) {
  const map: Record<ModelFidelity, string> = {
    SEED: "border-border bg-sand text-ink-soft",
    PILOT: "border-firelight/40 bg-firelight/10 text-firelight",
    CALIBRATED: "border-verified/40 bg-verified/10 text-verified",
    APPROVED: "border-ink bg-ink text-primary-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        map[f],
      )}
    >
      {f}
    </span>
  );
}

function RigBadge({ s }: { s: RiggingStatus }) {
  const label = {
    NOT_STARTED: "Not started",
    IN_REVIEW: "In review",
    CONFIRMED: "Confirmed",
    BLOCKED: "Blocked",
  }[s];
  const tone = {
    NOT_STARTED: "text-muted-foreground",
    IN_REVIEW: "text-caution",
    CONFIRMED: "text-verified",
    BLOCKED: "text-conflict",
  }[s];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", tone)}>
      <CircleDot className="h-3 w-3" /> {label}
    </span>
  );
}

function LogBadge({ s }: { s: LogisticsStatus }) {
  const label = { PENDING: "Pending", SCHEDULED: "Scheduled", CONFIRMED: "Confirmed" }[s];
  const tone = {
    PENDING: "text-muted-foreground",
    SCHEDULED: "text-caution",
    CONFIRMED: "text-verified",
  }[s];
  return <span className={cn("text-xs", tone)}>{label}</span>;
}

function summarize(shows: TourShow[]) {
  const total = shows.length;
  const pilot = shows.filter((s) => s.fidelity === "PILOT").length;
  const avgScore = Math.round(shows.reduce((a, s) => a + s.sourceScore, 0) / total);
  const rigReview = shows.filter((s) => s.riggingStatus === "IN_REVIEW").length;
  return { total, pilot, avgScore, rigReview };
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
