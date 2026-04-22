import { Order, Disruption, Proposal } from "./types";

export function proposeSchedule(order: Order, disruption: Disruption): Proposal {
  const baseDate = new Date(order.promisedDate);

  switch (disruption.id) {
    case "material-slip":
      return {
        proposedDate: addDays(baseDate, 4),
        confidencePct: 74,
        reasoning: [
          "Material delay pushes the start of all downstream operations by 4 days.",
          "Critical path runs through gear cutting and heat treat — both shift forward.",
          "No parallel work can absorb this delay since material prep is the first operation.",
        ],
        assumptions: [
          "Supplier's revised ETA of Oct 26 is reliable (no further slip).",
          "Downstream machine availability remains as currently scheduled.",
          "No overtime or weekend shifts applied to compress the schedule.",
        ],
        unknowns: [
          "Whether the customer has flexibility on the delivery date.",
          "If other orders on the same machines can be re-sequenced to recover time.",
        ],
        operationChanges: [
          { op: "Material prep (4340 steel bar)", shift: "+4 days" },
          { op: "Gear blank turning", shift: "+4 days" },
          { op: "Gear cutting A-12", shift: "+4 days" },
          { op: "Heat treat (outsourced)", shift: "+4 days" },
          { op: "Grinding", shift: "+4 days" },
          { op: "Final inspection (AS9100)", shift: "+4 days" },
        ],
      };

    case "machine-fault":
      return {
        proposedDate: addDays(baseDate, 3),
        confidencePct: 78,
        reasoning: [
          "Gleason-3 downtime delays gear cutting by 3 days.",
          "Heat treat, grinding, and inspection shift forward accordingly.",
          "Material prep and gear blank turning are unaffected — already upstream of the fault.",
        ],
        assumptions: [
          "Spindle repair will be completed within the estimated 3-day window.",
          "No alternative gear cutter is available to absorb the work.",
          "Heat treat vendor can accommodate the shifted schedule.",
        ],
        unknowns: [
          "Actual repair duration — could extend if parts need ordering.",
          "QA inspector availability for the shifted inspection window.",
        ],
        operationChanges: [
          { op: "Material prep (4340 steel bar)", shift: "unchanged" },
          { op: "Gear blank turning", shift: "unchanged" },
          { op: "Gear cutting A-12", shift: "+3 days" },
          { op: "Heat treat (outsourced)", shift: "+3 days" },
          { op: "Grinding", shift: "+3 days" },
          { op: "Final inspection (AS9100)", shift: "+3 days" },
        ],
      };

    case "qa-reject":
      return {
        proposedDate: addDays(baseDate, 5),
        confidencePct: 68,
        reasoning: [
          "2 parts require rework, re-entering the production cycle at gear blank turning.",
          "Rework adds approximately 5 days to the critical path for the rejected parts.",
          "Remaining 10 parts can proceed, but final shipment waits for the full batch.",
          "Lower confidence reflects uncertainty in rework first-pass yield.",
        ],
        assumptions: [
          "Root cause of non-conformance is identified and correctable.",
          "Rework uses the same machines and doesn't require new tooling.",
          "Material is available for rework (no new procurement needed).",
          "Customer requires full batch delivery (no partial shipments).",
        ],
        unknowns: [
          "Root cause may indicate a systemic issue affecting more parts.",
          "Customer willingness to accept partial delivery.",
        ],
        operationChanges: [
          { op: "Material prep (4340 steel bar)", shift: "unchanged" },
          { op: "Gear blank turning", shift: "+5 days (rework parts)" },
          { op: "Gear cutting A-12", shift: "+5 days (rework parts)" },
          { op: "Heat treat (outsourced)", shift: "+5 days (rework parts)" },
          { op: "Grinding", shift: "+5 days (rework parts)" },
          { op: "Final inspection (AS9100)", shift: "+5 days" },
        ],
      };

    case "rush-in":
      return {
        proposedDate: addDays(baseDate, 2),
        confidencePct: 71,
        reasoning: [
          "Expediting AV-2863 requires preempting Gleason-3 time currently allocated to this order.",
          "Gear cutting for this order shifts by 2 days to accommodate the rush.",
          "Downstream operations cascade forward.",
          "Confidence reduced because rush resequencing creates contention on shared machines.",
        ],
        assumptions: [
          "AV-2863 rush takes priority per customer agreement.",
          "Gleason-3 capacity is the binding constraint.",
          "No additional overtime authorized to run both orders in parallel.",
        ],
        unknowns: [
          "Whether Northern Aerospace would accept a 2-day slip on this order in exchange for the BG-330 rush.",
          "Operator availability for extended Gleason-3 runs.",
        ],
        operationChanges: [
          { op: "Material prep (4340 steel bar)", shift: "unchanged" },
          { op: "Gear blank turning", shift: "unchanged" },
          { op: "Gear cutting A-12", shift: "+2 days" },
          { op: "Heat treat (outsourced)", shift: "+2 days" },
          { op: "Grinding", shift: "+2 days" },
          { op: "Final inspection (AS9100)", shift: "+2 days" },
        ],
      };

    default:
      return {
        proposedDate: order.promisedDate,
        confidencePct: order.currentConfidence,
        reasoning: ["No recognized disruption pattern. Maintaining current schedule."],
        assumptions: ["Current schedule remains valid."],
        unknowns: ["Disruption type not recognized — manual review recommended."],
        operationChanges: order.operations.map((op) => ({ op: op.name, shift: "unchanged" })),
      };
  }
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}
