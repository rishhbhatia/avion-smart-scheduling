export interface Operation {
  id: string;
  name: string;
  machine: string;
  plannedStart: string;
  duration: number;
}

export interface Order {
  id: string;
  customer: string;
  part: string;
  qty: number;
  promisedDate: string;
  currentConfidence: number;
  status: "in-progress" | "at-risk" | "on-track";
  operations: Operation[];
}

export interface Disruption {
  id: string;
  label: string;
  detail: string;
}

export interface Proposal {
  proposedDate: string;
  confidencePct: number;
  reasoning: string[];
  assumptions: string[];
  unknowns: string[];
  operationChanges: { op: string; shift: string }[];
}

export interface AuditEntry {
  timestamp: string;
  action: "accept" | "override" | "decline";
  orderId: string;
  aiProposedDate: string;
  aiConfidence: number;
  humanChosenDate: string | null;
  rationale: string;
  humanName: string;
}
