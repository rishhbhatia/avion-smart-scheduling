import { Order } from "./types";

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
