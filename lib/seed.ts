import { Order, OrderConfidence, AgentAction } from "./types";

export const currentUser = {
  name: "Priya Chen",
  role: "Master Planner",
  team: "Program Management",
};

export const orders: Order[] = [
  {
    id: "AV-2847",
    customer: "Northern Aerospace (Tier 1)",
    part: "Turboprop reduction gearbox, PN G-447-R3",
    qty: 12,
    promisedDate: "2026-11-14",
    currentConfidence: 82,
    status: "in-progress",
    operations: [
      { id: "op1", name: "Material prep (4340 steel bar)", machine: "SawLine-2", plannedStart: "2026-10-22", duration: 2 },
      { id: "op2", name: "Gear blank turning", machine: "CNC-Lathe-7", plannedStart: "2026-10-26", duration: 3 },
      { id: "op3", name: "Gear cutting A-12", machine: "Gleason-3", plannedStart: "2026-10-31", duration: 4 },
      { id: "op4", name: "Heat treat (outsourced)", machine: "EXT-HeatTreat", plannedStart: "2026-11-05", duration: 3 },
      { id: "op5", name: "Grinding", machine: "Reishauer-1", plannedStart: "2026-11-09", duration: 2 },
      { id: "op6", name: "Final inspection (AS9100)", machine: "CMM-Lab", plannedStart: "2026-11-12", duration: 2 },
    ],
  },
  {
    id: "AV-2852",
    customer: "Defence Canada — LAV program",
    part: "Spline shaft assembly, PN S-201-A",
    qty: 40,
    promisedDate: "2026-12-02",
    currentConfidence: 91,
    status: "in-progress",
    operations: [
      { id: "op1", name: "Bar stock cutting", machine: "SawLine-1", plannedStart: "2026-11-01", duration: 1 },
      { id: "op2", name: "CNC turning (rough)", machine: "CNC-Lathe-3", plannedStart: "2026-11-03", duration: 3 },
      { id: "op3", name: "Spline broaching", machine: "Broach-2", plannedStart: "2026-11-08", duration: 4 },
      { id: "op4", name: "Heat treat (in-house)", machine: "Furnace-1", plannedStart: "2026-11-14", duration: 2 },
      { id: "op5", name: "Final inspection (MIL-STD)", machine: "CMM-Lab", plannedStart: "2026-11-28", duration: 3 },
    ],
  },
  {
    id: "AV-2859",
    customer: "Bruce Power (nuclear)",
    part: "Precision coupling, PN C-118-N",
    qty: 6,
    promisedDate: "2026-11-28",
    currentConfidence: 76,
    status: "at-risk",
    operations: [
      { id: "op1", name: "Material certification review", machine: "QA-Desk", plannedStart: "2026-10-28", duration: 2 },
      { id: "op2", name: "CNC turning (precision)", machine: "CNC-Lathe-7", plannedStart: "2026-11-01", duration: 4 },
      { id: "op3", name: "Keyway milling", machine: "VMC-5", plannedStart: "2026-11-07", duration: 2 },
      { id: "op4", name: "Surface grinding", machine: "Reishauer-1", plannedStart: "2026-11-11", duration: 3 },
      { id: "op5", name: "Nuclear-grade inspection (N-stamp)", machine: "CMM-Lab", plannedStart: "2026-11-22", duration: 5 },
    ],
  },
  {
    id: "AV-2863",
    customer: "Northern Aerospace (Tier 1)",
    part: "Bevel gear set, PN BG-330",
    qty: 8,
    promisedDate: "2026-10-30",
    currentConfidence: 96,
    status: "on-track",
    operations: [
      { id: "op1", name: "Forging receipt & inspection", machine: "Receiving", plannedStart: "2026-10-14", duration: 1 },
      { id: "op2", name: "Gear blank turning", machine: "CNC-Lathe-3", plannedStart: "2026-10-16", duration: 2 },
      { id: "op3", name: "Bevel gear cutting", machine: "Gleason-3", plannedStart: "2026-10-20", duration: 4 },
      { id: "op4", name: "Lapping & finishing", machine: "Lap-1", plannedStart: "2026-10-25", duration: 2 },
      { id: "op5", name: "Final inspection (AS9100)", machine: "CMM-Lab", plannedStart: "2026-10-28", duration: 2 },
    ],
  },
];

export const aiKnowledge = {
  knows: [
    "Machine schedules and capacity (30 machines tracked)",
    "Material purchase orders and current ETAs",
    "Order specs, quantities, and contracted delivery dates",
    "12-month history of operation-level slip rates per machine",
    "Published AS9100 inspection cycle times",
  ],
  doesNotKnow: [
    "QA inspector individual availability this week",
    "Customer's flexibility tolerance on delivery dates",
    "Preventive maintenance scheduled beyond the current week",
    "Operator training status on specialty processes",
    "Vendor risk signals beyond published ETAs",
  ],
};

export const orderConfidenceData: Record<string, OrderConfidence> = {
  "AV-2847": {
    modelEstimateDate: "2026-11-17",
    uncertaintyDays: 3,
    confidencePercent: 78,
    bottleneckOperation: {
      name: "Gear cutting A-12",
      machine: "Gleason-3",
      historicalSlipRate: 0.12,
      queueDepth: 6,
    },
    riskFactors: [
      {
        description:
          "Heat treat (outsourced) — vendor avg 4.2d actual vs 3d planned",
        severity: "medium",
      },
      {
        description:
          "CMM-Lab final inspection — QA inspector availability unknown this week",
        severity: "low",
      },
    ],
    confidenceBreakdown: {
      scheduleData: "high",
      vendorEtas: "medium",
      inspectorCapacity: "low",
      customerFlexibility: "unknown",
    },
    recommendation:
      "Promise Nov 17 to customer, or accept Nov 14 with 22% slip risk. Planner decision required.",
  },
  "AV-2852": {
    modelEstimateDate: "2026-12-04",
    uncertaintyDays: 2,
    confidencePercent: 87,
    bottleneckOperation: {
      name: "Spline broaching",
      machine: "Broach-2",
      historicalSlipRate: 0.08,
      queueDepth: 3,
    },
    riskFactors: [
      {
        description:
          "Final inspection (MIL-STD) — 2 jobs ahead at CMM-Lab this week",
        severity: "low",
      },
    ],
    confidenceBreakdown: {
      scheduleData: "high",
      vendorEtas: "high",
      inspectorCapacity: "medium",
      customerFlexibility: "unknown",
    },
    recommendation:
      "Likely to deliver Dec 2–4. High confidence; proceed with current plan.",
  },
  "AV-2859": {
    modelEstimateDate: "2026-12-06",
    uncertaintyDays: 5,
    confidencePercent: 52,
    bottleneckOperation: {
      name: "Nuclear-grade inspection (N-stamp)",
      machine: "CMM-Lab",
      historicalSlipRate: 0.21,
      queueDepth: 9,
    },
    riskFactors: [
      {
        description:
          "N-stamp inspection backlog at CMM-Lab — 9 jobs deep, priority queue unknown",
        severity: "high",
      },
      {
        description:
          "Material certification non-conformance risk — rework possible after review",
        severity: "high",
      },
      {
        description:
          "Surface grinding on Reishauer-1 — 3 priority jobs ahead in queue",
        severity: "medium",
      },
    ],
    confidenceBreakdown: {
      scheduleData: "medium",
      vendorEtas: "low",
      inspectorCapacity: "low",
      customerFlexibility: "unknown",
    },
    recommendation:
      "Advise Bruce Power of likely 8-day slip. Do not commit to Nov 28 without planner review.",
  },
  "AV-2863": {
    modelEstimateDate: "2026-10-30",
    uncertaintyDays: 1,
    confidencePercent: 91,
    bottleneckOperation: {
      name: "Bevel gear cutting",
      machine: "Gleason-3",
      historicalSlipRate: 0.04,
      queueDepth: 2,
    },
    riskFactors: [
      {
        description:
          "Gear blank turning completed 1 day early — positive schedule buffer",
        severity: "low",
      },
    ],
    confidenceBreakdown: {
      scheduleData: "high",
      vendorEtas: "high",
      inspectorCapacity: "medium",
      customerFlexibility: "unknown",
    },
    recommendation: "On track to meet Oct 30. No action required.",
  },
};

export const disruptionConfidenceEffects: Record<
  string,
  Record<string, Partial<OrderConfidence>>
> = {
  "machine-fault": {
    "AV-2847": {
      modelEstimateDate: "2026-11-19",
      uncertaintyDays: 4,
      confidencePercent: 58,
    },
    "AV-2863": {
      modelEstimateDate: "2026-11-02",
      uncertaintyDays: 2,
      confidencePercent: 74,
    },
  },
  "material-slip": {
    "AV-2847": {
      modelEstimateDate: "2026-11-21",
      uncertaintyDays: 4,
      confidencePercent: 62,
    },
  },
  "qa-reject": {
    "AV-2847": {
      modelEstimateDate: "2026-11-20",
      uncertaintyDays: 4,
      confidencePercent: 55,
    },
  },
  "rush-in": {
    "AV-2863": {
      modelEstimateDate: "2026-11-01",
      uncertaintyDays: 2,
      confidencePercent: 68,
    },
  },
};

export const seedActivityLog: AgentAction[] = [
  {
    id: "act-001",
    timestamp: "2026-11-04T14:32:00.000Z",
    type: "reroute",
    status: "pending",
    title: "Re-route proposal: AV-2847 Gear cutting",
    affectedOrder: "AV-2847",
    affectedOperation: "Gear cutting A-12",
    trigger:
      "Disruption injected: Gleason-3 reported down for 2-day repair starting Nov 8",
    reasoning: [
      "Gleason-3 down 2 days starting Nov 8 affects 4 queued jobs.",
      "AV-2847 has the tightest delivery window (Nov 14 promised, 4d gear cutting required).",
      "Gleason-1 has compatible tooling and capacity Nov 8–12.",
      "Net AV-2847 delivery impact: 0 days. Net impact on displaced AV-2871: +1 day (within slack).",
      "AV-2847 customer is Tier 1 (Northern Aerospace); AV-2871 has 5d delivery flexibility per contract.",
    ],
    alternatives: [
      {
        description: "Move to Gleason-1",
        deliveryImpactDays: 0,
        costImpactDollars: 0,
        picked: true,
      },
      {
        description: "Wait for Gleason-3 repair",
        deliveryImpactDays: 2,
        costImpactDollars: 0,
        picked: false,
      },
      {
        description: "Outsource to vendor",
        deliveryImpactDays: 0,
        costImpactDollars: 840,
        picked: false,
      },
      {
        description: "Split run across both Gleasons",
        deliveryImpactDays: 0,
        costImpactDollars: 200,
        picked: false,
      },
    ],
    dataSources: [
      "ERP machine schedule (live, last sync 14:30)",
      "Historical slip-rate database (12mo)",
      "Customer contract terms (AV-2847, AV-2871)",
      "Vendor performance log (EXT-HeatTreat)",
    ],
  },
  {
    id: "act-002",
    timestamp: "2026-11-04T09:18:00.000Z",
    type: "schedule_update",
    status: "approved",
    title: "Schedule update: AV-2859 downstream ops pushed +2 days",
    affectedOrder: "AV-2859",
    affectedOperation: "Heat treat (outsourced)",
    trigger:
      "Vendor ETA update: EXT-HeatTreat shifted PN-447 from Nov 5 to Nov 7",
    reasoning: [
      "EXT-HeatTreat reported 2-day delay on PN-447 heat treat batch.",
      "AV-2859 surface grinding and N-stamp inspection depend on heat treat completion.",
      "Pushing downstream ops +2 days shifts final delivery estimate from Nov 26 to Nov 28.",
      "Nov 28 matches the contracted promise date — no customer impact if compliant.",
      "No recovery action available within current machine capacity.",
    ],
    alternatives: [
      {
        description: "Push downstream ops +2 days",
        deliveryImpactDays: 2,
        costImpactDollars: 0,
        picked: true,
      },
      {
        description: "Expedite at alternate vendor",
        deliveryImpactDays: 0,
        costImpactDollars: 1200,
        picked: false,
      },
      {
        description: "Partial shipment to customer",
        deliveryImpactDays: -2,
        costImpactDollars: 450,
        picked: false,
      },
    ],
    dataSources: [
      "Vendor performance log (EXT-HeatTreat)",
      "ERP machine schedule (live)",
      "Customer contract terms (AV-2859)",
    ],
    decision: {
      by: "Priya Chen",
      at: "2026-11-04T09:31:00.000Z",
      action: "approved",
    },
  },
  {
    id: "act-003",
    timestamp: "2026-11-04T13:50:00.000Z",
    type: "confidence_recalc",
    status: "auto_applied",
    title: "Confidence recalculated: 4 orders updated after disruption",
    trigger:
      "Machine disruption injected at 13:50: Gleason-3 spindle fault, 3-day repair",
    reasoning: [
      "Gleason-3 spindle fault affects all queued jobs on that machine.",
      "AV-2847 and AV-2863 both have gear cutting ops on Gleason-3.",
      "AV-2847 confidence dropped from 82% to 58% — tight delivery window, no recovery slack.",
      "AV-2863 confidence dropped from 91% to 74% — some schedule buffer remains.",
      "AV-2852 and AV-2859 unaffected (no Gleason-3 dependency).",
      "Recalculation applied automatically. Planner review recommended for orders below 60%.",
    ],
    alternatives: [],
    dataSources: [
      "ERP machine schedule (live)",
      "Historical slip-rate database (12mo)",
      "Machine disruption log",
    ],
  },
  {
    id: "act-004",
    timestamp: "2026-11-03T16:41:00.000Z",
    type: "disruption_response",
    status: "overridden",
    title: "Disruption response: AV-2852 material prep delay",
    affectedOrder: "AV-2852",
    affectedOperation: "Bar stock cutting",
    trigger: "Material PO tracker: 4340 steel bar delayed 1 day at supplier",
    reasoning: [
      "Bar stock cutting for AV-2852 planned to start Nov 1; material now arriving Nov 2.",
      "1-day material slip propagates through all downstream operations.",
      "Earliest recovery point is spline broaching — no parallel recovery path available.",
      "Recommended: delay material prep start 1 day, accept +1 day on final delivery.",
    ],
    alternatives: [
      {
        description: "Delay material prep 1 day",
        deliveryImpactDays: 1,
        costImpactDollars: 0,
        picked: true,
      },
      {
        description: "Source bar stock from secondary supplier",
        deliveryImpactDays: 0,
        costImpactDollars: 320,
        picked: false,
      },
    ],
    dataSources: [
      "Material PO tracker (daily sync)",
      "ERP machine schedule (live)",
      "Supplier performance log",
    ],
    decision: {
      by: "Priya Chen",
      at: "2026-11-03T17:02:00.000Z",
      action: "overridden",
      reason: "Customer confirmed they can take partial shipment",
    },
  },
  {
    id: "act-005",
    timestamp: "2026-11-03T11:15:00.000Z",
    type: "flag",
    status: "approved",
    title: "Flag: PN21 breakdown 8d 16h — PM review recommended",
    affectedOperation: "VF2-A72 Op 2",
    trigger:
      "Daily schedule sweep at 08:00: PN21 breakdown time flagged at 8h 16m — highest in queue",
    reasoning: [
      "PN21 Op 2 has logged 8h 16m of unplanned breakdown time — highest in current queue.",
      "Historical pattern: breakdown clusters on this part suggest tooling wear.",
      "Preventive maintenance on VF2-A72 is not scheduled until next quarter.",
      "Recommending immediate PM review to prevent unplanned downtime mid-run.",
    ],
    alternatives: [
      {
        description: "Schedule PM review this week",
        deliveryImpactDays: 0,
        costImpactDollars: 0,
        picked: true,
      },
      {
        description: "Continue and monitor",
        deliveryImpactDays: 0,
        costImpactDollars: 0,
        picked: false,
      },
      {
        description: "Shift PN21 to alternate machine",
        deliveryImpactDays: 1,
        costImpactDollars: 0,
        picked: false,
      },
    ],
    dataSources: [
      "Machine breakdown log (VF2-A72)",
      "Historical slip-rate database (12mo)",
      "PM schedule database",
    ],
    decision: {
      by: "Priya Chen",
      at: "2026-11-03T11:28:00.000Z",
      action: "approved",
    },
  },
  {
    id: "act-006",
    timestamp: "2026-11-03T08:45:00.000Z",
    type: "reroute",
    status: "approved",
    title: "Re-sequence: 3 jobs on Reishauer-1 to cut setup time 4 hours",
    affectedOperation: "Reishauer-1 queue",
    trigger:
      "Daily schedule sweep at 08:00: setup time optimization opportunity identified",
    reasoning: [
      "Current Reishauer-1 job sequence requires 3 tooling changeovers totaling 6.5 hours.",
      "Grouping similar-geometry jobs (AV-2847 grinding, AV-2863 lapping) reduces changeovers to 1.",
      "Estimated setup time savings: 4 hours over current week.",
      "No delivery date impact — sequence change is within existing schedule slack.",
    ],
    alternatives: [
      {
        description: "Re-sequence by geometry family",
        deliveryImpactDays: 0,
        costImpactDollars: -240,
        picked: true,
      },
      {
        description: "Keep current sequence",
        deliveryImpactDays: 0,
        costImpactDollars: 0,
        picked: false,
      },
    ],
    dataSources: [
      "ERP machine schedule (live)",
      "Setup time database (Reishauer-1)",
      "Part geometry classification",
    ],
    decision: {
      by: "Priya Chen",
      at: "2026-11-03T09:00:00.000Z",
      action: "approved",
    },
  },
  {
    id: "act-007",
    timestamp: "2026-11-04T08:00:00.000Z",
    type: "recommendation",
    status: "auto_applied",
    title: "Daily sweep: 7 jobs behind, surfaced in Late vs Planned",
    trigger: "Scheduled daily sweep at 08:00",
    reasoning: [
      "Sweep completed across all 30 machines and 64 active jobs.",
      "7 jobs identified as running behind their planned completion dates.",
      "Late vs Planned view updated with current slip amounts.",
      "No automatic action taken — jobs surfaced for planner review.",
      "2 jobs flagged for potential disruption response (PN21, PN8).",
    ],
    alternatives: [],
    dataSources: [
      "ERP machine schedule (live, 08:00 sync)",
      "Historical slip-rate database (12mo)",
      "Machine capacity settings",
    ],
  },
  {
    id: "act-008",
    timestamp: "2026-11-02T14:20:00.000Z",
    type: "confidence_recalc",
    status: "approved",
    title: "Confidence update: AV-2863 revised 88% → 96%",
    affectedOrder: "AV-2863",
    trigger:
      "Operation completion logged: AV-2863 gear blank turning finished 1 day early",
    reasoning: [
      "Gear blank turning on AV-2863 completed Nov 1, 1 day ahead of the Nov 2 plan.",
      "Early completion creates a 1-day buffer ahead of bevel gear cutting on Gleason-3.",
      "Historical Gleason-3 slip rate for this part geometry: 4% — very low risk.",
      "Revised confidence model: 88% → 96% (buffer absorbed most remaining uncertainty).",
    ],
    alternatives: [],
    dataSources: [
      "ERP operation completion log",
      "Historical slip-rate database (12mo)",
      "Gleason-3 queue depth",
    ],
    decision: {
      by: "Priya Chen",
      at: "2026-11-02T14:35:00.000Z",
      action: "approved",
    },
  },
];
