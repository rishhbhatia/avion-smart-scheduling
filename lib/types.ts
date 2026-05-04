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

export interface OrderConfidence {
  modelEstimateDate: string;
  uncertaintyDays: number;
  confidencePercent: number;
  bottleneckOperation: {
    name: string;
    machine: string;
    historicalSlipRate: number;
    queueDepth: number;
  };
  riskFactors: Array<{
    description: string;
    severity: "low" | "medium" | "high";
  }>;
  confidenceBreakdown: {
    scheduleData: "high" | "medium" | "low";
    vendorEtas: "high" | "medium" | "low";
    inspectorCapacity: "high" | "medium" | "low";
    customerFlexibility: "high" | "medium" | "low" | "unknown";
  };
  recommendation: string;
}

export interface AgentAction {
  id: string;
  timestamp: string;
  type:
    | "reroute"
    | "schedule_update"
    | "disruption_response"
    | "confidence_recalc"
    | "recommendation"
    | "flag";
  status: "pending" | "approved" | "overridden" | "auto_applied";
  title: string;
  affectedOrder?: string;
  affectedOperation?: string;
  trigger: string;
  reasoning: string[];
  alternatives: Array<{
    description: string;
    deliveryImpactDays: number;
    costImpactDollars: number;
    picked: boolean;
  }>;
  dataSources: string[];
  decision?: {
    by: string;
    at: string;
    action: "approved" | "overridden";
    reason?: string;
  };
}
