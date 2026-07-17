import type { Confidence, Authority } from "@/lib/drt/types";
import { cn } from "@/lib/utils";

const CONF_LABEL: Record<Confidence, string> = {
  VERIFIED: "Verified",
  CALIBRATED_PLANNING: "Calibrated planning",
  APPROXIMATE_PLANNING: "Approximate planning",
  UNVERIFIED: "Unverified",
  CONFLICT: "Conflict",
  ENGINEERING_CONFIRMATION_REQUIRED: "Eng. confirmation req.",
};

const CONF_TONE: Record<Confidence, string> = {
  VERIFIED: "bg-verified/15 text-verified border-verified/30",
  CALIBRATED_PLANNING: "bg-ink/5 text-ink border-ink/20",
  APPROXIMATE_PLANNING: "bg-caution/15 text-caution border-caution/40",
  UNVERIFIED: "bg-muted text-muted-foreground border-border",
  CONFLICT: "bg-conflict/15 text-conflict border-conflict/40",
  ENGINEERING_CONFIRMATION_REQUIRED: "bg-firelight/15 text-firelight border-firelight/40",
};

const AUTH_LABEL: Record<Authority, string> = {
  VENUE_ISSUED: "Venue issued",
  TOUR_ISSUED: "Tour issued",
  MANAGEMENT_CONFIRMED: "Mgmt confirmed",
  DEPARTMENT_CONFIRMED: "Dept confirmed",
  PRIOR_SHOW_REFERENCE: "Prior show ref.",
  PUBLIC_SOURCE: "Public source",
  INFERRED: "Inferred",
};

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: Confidence;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        CONF_TONE[confidence],
        className,
      )}
    >
      {CONF_LABEL[confidence]}
    </span>
  );
}

export function AuthorityBadge({
  authority,
  className,
}: {
  authority: Authority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-ink/15 bg-sand px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-soft",
        className,
      )}
    >
      {AUTH_LABEL[authority]}
    </span>
  );
}

export { CONF_LABEL, AUTH_LABEL };
