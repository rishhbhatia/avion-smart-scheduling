import { Disruption } from "./types";

export const disruptions: Disruption[] = [
  {
    id: "material-slip",
    label: "Material delay",
    detail: "4340 steel bar stock from supplier delayed 4 days (ETA pushed from Oct 22 to Oct 26)",
  },
  {
    id: "machine-fault",
    label: "Machine breakdown",
    detail: "Gleason-3 gear cutter requires unplanned spindle service. Est. 3 days downtime.",
  },
  {
    id: "qa-reject",
    label: "QA reject",
    detail: "First article inspection on PN G-447-R3 flagged a dimensional non-conformance. 2 parts require rework.",
  },
  {
    id: "rush-in",
    label: "Rush order",
    detail: "Northern Aerospace requested expedited PN BG-330 (AV-2863). Needs delivery 5 days earlier.",
  },
];
