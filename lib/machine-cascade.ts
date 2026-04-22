import { Machine, MachineJob, PartSummary, getPartSummaries, getMachineUtilization } from "./machine-data";

export interface MachineDisruption {
  id: string;
  label: string;
  detail: string;
  /** The part number where the disruption hits */
  affectedPn: number;
  /** Which op of that part is affected (1-based) */
  affectedOp: number;
  /** How many days the disruption adds at that point */
  delayDays: number;
}

export interface CascadeResult {
  originalJobs: MachineJob[];
  shiftedJobs: MachineJob[];
  originalParts: PartSummary[];
  shiftedParts: PartSummary[];
  /** Jobs that shift */
  affectedJobCount: number;
  /** Parts whose end date moves */
  affectedPartCount: number;
  /** Parts that were on time but are now late */
  newlyLatePartPns: number[];
  /** Parts that were already late and got worse */
  worsenedPartPns: number[];
  /** Total days added to the schedule end */
  scheduleExtensionDays: number;
  /** Utilization change */
  originalUtil: ReturnType<typeof getMachineUtilization>;
  shiftedUtil: ReturnType<typeof getMachineUtilization>;
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000
  );
}

/**
 * Given a machine schedule and a disruption, compute the cascaded schedule.
 *
 * Logic: find the affected job (pn + op). Every job that starts at or after
 * that job's start date gets pushed forward by delayDays. Jobs before the
 * disruption point are untouched.
 */
export function computeCascade(
  machine: Machine,
  disruption: MachineDisruption
): CascadeResult {
  const originalJobs = machine.jobs;

  // Find the disruption point
  const disruptionIdx = originalJobs.findIndex(
    (j) => j.pn === disruption.affectedPn && j.op === disruption.affectedOp
  );

  // If we can't find the exact job, find the first job for that PN
  const effectiveIdx =
    disruptionIdx >= 0
      ? disruptionIdx
      : originalJobs.findIndex((j) => j.pn === disruption.affectedPn);

  const cutoffDate =
    effectiveIdx >= 0 ? originalJobs[effectiveIdx].startDate : originalJobs[0].startDate;

  // Shift all jobs at or after the cutoff
  const shiftedJobs: MachineJob[] = originalJobs.map((job) => {
    if (job.startDate >= cutoffDate) {
      return {
        ...job,
        startDate: addDaysToDate(job.startDate, disruption.delayDays),
        endDate: addDaysToDate(job.endDate, disruption.delayDays),
      };
    }
    return { ...job };
  });

  // Build a temporary machine with shifted jobs to compute summaries
  const shiftedMachine: Machine = { ...machine, jobs: shiftedJobs };

  const originalParts = getPartSummaries(machine);
  const shiftedParts = getPartSummaries(shiftedMachine);

  // Count affected
  let affectedJobCount = 0;
  for (let i = 0; i < originalJobs.length; i++) {
    if (originalJobs[i].startDate !== shiftedJobs[i].startDate) {
      affectedJobCount++;
    }
  }

  const affectedPartPns = new Set<number>();
  const newlyLatePartPns: number[] = [];
  const worsenedPartPns: number[] = [];

  for (const sp of shiftedParts) {
    const op = originalParts.find((p) => p.pn === sp.pn)!;
    if (op.endDate !== sp.endDate) {
      affectedPartPns.add(sp.pn);
    }
    if (sp.plannedDate) {
      const wasLate = op.isLate;
      const isNowLate = sp.isLate;
      if (!wasLate && isNowLate) {
        newlyLatePartPns.push(sp.pn);
      } else if (wasLate && isNowLate && sp.daysLate > op.daysLate) {
        worsenedPartPns.push(sp.pn);
      }
    }
  }

  const originalEnd = originalJobs[originalJobs.length - 1].endDate;
  const shiftedEnd = shiftedJobs[shiftedJobs.length - 1].endDate;
  const scheduleExtensionDays = daysBetween(originalEnd, shiftedEnd);

  const originalUtil = getMachineUtilization(machine);
  const shiftedUtil = getMachineUtilization(shiftedMachine);

  return {
    originalJobs,
    shiftedJobs,
    originalParts,
    shiftedParts,
    affectedJobCount,
    affectedPartCount: affectedPartPns.size,
    newlyLatePartPns,
    worsenedPartPns,
    scheduleExtensionDays,
    originalUtil,
    shiftedUtil,
  };
}

/**
 * Machine-scoped disruption presets.
 * These are tied to specific points in the VF2-A72 queue.
 */
export const machineDisruptions: MachineDisruption[] = [
  {
    id: "spindle-fault",
    label: "Spindle fault on VF2-A72",
    detail:
      "Unplanned spindle bearing failure during PN4 Op1. Machine down for estimated 5 days while replacement bearing is sourced and installed.",
    affectedPn: 4,
    affectedOp: 1,
    delayDays: 5,
  },
  {
    id: "tooling-delay",
    label: "Tooling delivery delay",
    detail:
      "Specialty carbide insert tooling for PN10 delayed by supplier. 3-day delay before operations can begin.",
    affectedPn: 10,
    affectedOp: 1,
    delayDays: 3,
  },
  {
    id: "power-outage",
    label: "Extended power outage",
    detail:
      "Facility power outage affecting all machines. VF2-A72 queue paused for 2 days starting at PN6. Coolant system requires recalibration after restart.",
    affectedPn: 6,
    affectedOp: 1,
    delayDays: 2,
  },
  {
    id: "operator-shortage",
    label: "Operator shortage",
    detail:
      "Two CNC operators called in sick. VF2-A72 drops to single-shift for 4 days effective at PN11, adding 4 days to all downstream jobs.",
    affectedPn: 11,
    affectedOp: 1,
    delayDays: 4,
  },
  {
    id: "qa-hold",
    label: "Quality hold — full machine audit",
    detail:
      "AS9100 auditor flagged dimensional drift on recent parts. Full machine calibration and re-qualification required. 3-day hold starting at PN15.",
    affectedPn: 15,
    affectedOp: 1,
    delayDays: 3,
  },
];
