export interface MachineJob {
  pn: number;
  op: number;
  qty: number;
  startDate: string;
  endDate: string;
  setupMin: number;
  cycleMin: number;
  firstOffMin: number;
  breakdownMin: number;
  targetPerShift: number;
  plannedDate: string | null;
}

export interface Machine {
  id: string;
  name: string;
  hoursPerDay: number;
  daysPerWeek: number;
  jobs: MachineJob[];
}

// Derived from excel.xlsx — VF2-A72 production scheduler
export const machines: Machine[] = [
  {
    id: "VF2-A72",
    name: "VF2-A72",
    hoursPerDay: 16,
    daysPerWeek: 5,
    jobs: [
      { pn: 1, op: 1, qty: 20, startDate: "2026-03-17", endDate: "2026-03-20", setupMin: 0, cycleMin: 150, firstOffMin: 75, breakdownMin: 90, targetPerShift: 4, plannedDate: null },
      { pn: 1, op: 2, qty: 20, startDate: "2026-03-20", endDate: "2026-03-27", setupMin: 1440, cycleMin: 90, firstOffMin: 45, breakdownMin: 1140, targetPerShift: 6, plannedDate: null },
      { pn: 2, op: 1, qty: 26, startDate: "2026-03-27", endDate: "2026-04-01", setupMin: 0, cycleMin: 120, firstOffMin: 0, breakdownMin: 0, targetPerShift: 4, plannedDate: null },
      { pn: 2, op: 2, qty: 26, startDate: "2026-04-01", endDate: "2026-04-06", setupMin: 240, cycleMin: 90, firstOffMin: 45, breakdownMin: 120, targetPerShift: 6, plannedDate: null },
      { pn: 2, op: 3, qty: 26, startDate: "2026-04-06", endDate: "2026-04-10", setupMin: 240, cycleMin: 30, firstOffMin: 30, breakdownMin: 2600, targetPerShift: 16, plannedDate: null },
      { pn: 3, op: 1, qty: 24, startDate: "2026-04-10", endDate: "2026-04-20", setupMin: 180, cycleMin: 240, firstOffMin: 60, breakdownMin: 120, targetPerShift: 2, plannedDate: null },
      { pn: 4, op: 1, qty: 12, startDate: "2026-04-20", endDate: "2026-04-22", setupMin: 180, cycleMin: 120, firstOffMin: 0, breakdownMin: 0, targetPerShift: 4, plannedDate: null },
      { pn: 4, op: 2, qty: 12, startDate: "2026-04-22", endDate: "2026-04-28", setupMin: 120, cycleMin: 30, firstOffMin: 0, breakdownMin: 3360, targetPerShift: 12, plannedDate: null },
      { pn: 4, op: 3, qty: 12, startDate: "2026-04-28", endDate: "2026-04-28", setupMin: 120, cycleMin: 15, firstOffMin: 0, breakdownMin: 0, targetPerShift: 12, plannedDate: null },
      { pn: 5, op: 1, qty: 22, startDate: "2026-04-28", endDate: "2026-05-06", setupMin: 240, cycleMin: 150, firstOffMin: 1920, breakdownMin: 0, targetPerShift: 4, plannedDate: null },
      { pn: 6, op: 1, qty: 22, startDate: "2026-05-06", endDate: "2026-05-11", setupMin: 0, cycleMin: 150, firstOffMin: 0, breakdownMin: 60, targetPerShift: 4, plannedDate: null },
      { pn: 7, op: 1, qty: 21, startDate: "2026-05-12", endDate: "2026-05-12", setupMin: 120, cycleMin: 20, firstOffMin: 20, breakdownMin: 30, targetPerShift: 21, plannedDate: null },
      { pn: 8, op: 1, qty: 14, startDate: "2026-05-13", endDate: "2026-05-13", setupMin: 120, cycleMin: 20, firstOffMin: 20, breakdownMin: 30, targetPerShift: 14, plannedDate: null },
      { pn: 9, op: 1, qty: 30, startDate: "2026-05-13", endDate: "2026-05-15", setupMin: 180, cycleMin: 45, firstOffMin: 60, breakdownMin: 0, targetPerShift: 11, plannedDate: null },
      { pn: 10, op: 1, qty: 8, startDate: "2026-05-15", endDate: "2026-05-21", setupMin: 2880, cycleMin: 0, firstOffMin: 960, breakdownMin: 0, targetPerShift: 8, plannedDate: null },
      { pn: 10, op: 2, qty: 8, startDate: "2026-05-21", endDate: "2026-05-22", setupMin: 240, cycleMin: 150, firstOffMin: 60, breakdownMin: 60, targetPerShift: 4, plannedDate: null },
      { pn: 10, op: 3, qty: 8, startDate: "2026-05-25", endDate: "2026-05-27", setupMin: 120, cycleMin: 30, firstOffMin: 30, breakdownMin: 2400, targetPerShift: 8, plannedDate: null },
      { pn: 10, op: 4, qty: 8, startDate: "2026-05-28", endDate: "2026-05-29", setupMin: 240, cycleMin: 150, firstOffMin: 30, breakdownMin: 60, targetPerShift: 4, plannedDate: null },
      { pn: 11, op: 1, qty: 35, startDate: "2026-06-01", endDate: "2026-06-02", setupMin: 180, cycleMin: 30, firstOffMin: 15, breakdownMin: 0, targetPerShift: 16, plannedDate: "2026-04-15" },
      { pn: 11, op: 2, qty: 35, startDate: "2026-06-02", endDate: "2026-06-02", setupMin: 120, cycleMin: 15, firstOffMin: 10, breakdownMin: 0, targetPerShift: 32, plannedDate: null },
      { pn: 11, op: 3, qty: 35, startDate: "2026-06-03", endDate: "2026-06-03", setupMin: 180, cycleMin: 20, firstOffMin: 10, breakdownMin: 0, targetPerShift: 24, plannedDate: null },
      { pn: 12, op: 1, qty: 11, startDate: "2026-06-04", endDate: "2026-06-04", setupMin: 90, cycleMin: 30, firstOffMin: 30, breakdownMin: 0, targetPerShift: 11, plannedDate: "2026-04-18" },
      { pn: 13, op: 1, qty: 22, startDate: "2026-06-04", endDate: "2026-06-08", setupMin: 120, cycleMin: 60, firstOffMin: 120, breakdownMin: 0, targetPerShift: 8, plannedDate: "2026-04-18" },
      { pn: 13, op: 2, qty: 22, startDate: "2026-06-08", endDate: "2026-06-09", setupMin: 60, cycleMin: 45, firstOffMin: 45, breakdownMin: 0, targetPerShift: 11, plannedDate: null },
      { pn: 14, op: 1, qty: 30, startDate: "2026-06-09", endDate: "2026-06-10", setupMin: 180, cycleMin: 45, firstOffMin: 30, breakdownMin: 0, targetPerShift: 11, plannedDate: "2026-04-18" },
      { pn: 14, op: 2, qty: 30, startDate: "2026-06-11", endDate: "2026-06-12", setupMin: 180, cycleMin: 30, firstOffMin: 30, breakdownMin: 0, targetPerShift: 16, plannedDate: null },
      { pn: 14, op: 3, qty: 30, startDate: "2026-06-12", endDate: "2026-06-12", setupMin: 120, cycleMin: 10, firstOffMin: 30, breakdownMin: 0, targetPerShift: 30, plannedDate: null },
      { pn: 15, op: 1, qty: 53, startDate: "2026-06-15", endDate: "2026-06-15", setupMin: 60, cycleMin: 15, firstOffMin: 30, breakdownMin: 0, targetPerShift: 32, plannedDate: "2026-04-18" },
      { pn: 15, op: 2, qty: 53, startDate: "2026-06-16", endDate: "2026-06-16", setupMin: 60, cycleMin: 15, firstOffMin: 30, breakdownMin: 0, targetPerShift: 32, plannedDate: null },
      { pn: 16, op: 1, qty: 30, startDate: "2026-06-17", endDate: "2026-06-18", setupMin: 120, cycleMin: 45, firstOffMin: 60, breakdownMin: 0, targetPerShift: 11, plannedDate: "2026-04-18" },
      { pn: 17, op: 1, qty: 11, startDate: "2026-06-19", endDate: "2026-06-19", setupMin: 90, cycleMin: 30, firstOffMin: 60, breakdownMin: 0, targetPerShift: 11, plannedDate: "2026-04-18" },
      { pn: 17, op: 2, qty: 11, startDate: "2026-06-19", endDate: "2026-06-22", setupMin: 90, cycleMin: 30, firstOffMin: 60, breakdownMin: 0, targetPerShift: 11, plannedDate: null },
      { pn: 17, op: 3, qty: 11, startDate: "2026-06-22", endDate: "2026-06-22", setupMin: 90, cycleMin: 30, firstOffMin: 60, breakdownMin: 0, targetPerShift: 11, plannedDate: null },
      { pn: 18, op: 1, qty: 21, startDate: "2026-06-22", endDate: "2026-06-22", setupMin: 90, cycleMin: 15, firstOffMin: 30, breakdownMin: 0, targetPerShift: 21, plannedDate: null },
      { pn: 19, op: 1, qty: 7, startDate: "2026-06-23", endDate: "2026-06-23", setupMin: 60, cycleMin: 20, firstOffMin: 30, breakdownMin: 30, targetPerShift: 7, plannedDate: null },
      { pn: 19, op: 2, qty: 7, startDate: "2026-06-23", endDate: "2026-06-23", setupMin: 45, cycleMin: 15, firstOffMin: 30, breakdownMin: 30, targetPerShift: 7, plannedDate: null },
      { pn: 19, op: 3, qty: 7, startDate: "2026-06-23", endDate: "2026-06-25", setupMin: 30, cycleMin: 10, firstOffMin: 15, breakdownMin: 1550, targetPerShift: 7, plannedDate: null },
      { pn: 20, op: 1, qty: 10, startDate: "2026-06-25", endDate: "2026-06-25", setupMin: 120, cycleMin: 45, firstOffMin: 45, breakdownMin: 0, targetPerShift: 10, plannedDate: null },
      { pn: 21, op: 1, qty: 9, startDate: "2026-06-26", endDate: "2026-07-17", setupMin: 120, cycleMin: 45, firstOffMin: 45, breakdownMin: 14000, targetPerShift: 9, plannedDate: null },
      { pn: 22, op: 1, qty: 11, startDate: "2026-07-17", endDate: "2026-07-17", setupMin: 120, cycleMin: 20, firstOffMin: 15, breakdownMin: 30, targetPerShift: 11, plannedDate: null },
      { pn: 22, op: 2, qty: 11, startDate: "2026-07-20", endDate: "2026-07-20", setupMin: 120, cycleMin: 20, firstOffMin: 15, breakdownMin: 30, targetPerShift: 11, plannedDate: null },
      { pn: 23, op: 1, qty: 22, startDate: "2026-07-20", endDate: "2026-07-21", setupMin: 120, cycleMin: 60, firstOffMin: 30, breakdownMin: 30, targetPerShift: 8, plannedDate: null },
      { pn: 23, op: 2, qty: 22, startDate: "2026-07-22", endDate: "2026-07-22", setupMin: 90, cycleMin: 15, firstOffMin: 15, breakdownMin: 30, targetPerShift: 22, plannedDate: null },
      { pn: 24, op: 1, qty: 11, startDate: "2026-07-22", endDate: "2026-07-23", setupMin: 120, cycleMin: 30, firstOffMin: 30, breakdownMin: 30, targetPerShift: 11, plannedDate: null },
      { pn: 24, op: 2, qty: 11, startDate: "2026-07-23", endDate: "2026-07-23", setupMin: 120, cycleMin: 30, firstOffMin: 30, breakdownMin: 30, targetPerShift: 11, plannedDate: null },
      { pn: 25, op: 1, qty: 22, startDate: "2026-07-23", endDate: "2026-07-24", setupMin: 120, cycleMin: 30, firstOffMin: 30, breakdownMin: 30, targetPerShift: 16, plannedDate: null },
      { pn: 25, op: 2, qty: 22, startDate: "2026-07-24", endDate: "2026-07-27", setupMin: 120, cycleMin: 30, firstOffMin: 30, breakdownMin: 30, targetPerShift: 16, plannedDate: null },
      { pn: 26, op: 1, qty: 22, startDate: "2026-07-27", endDate: "2026-07-27", setupMin: 60, cycleMin: 10, firstOffMin: 30, breakdownMin: 30, targetPerShift: 22, plannedDate: null },
      { pn: 26, op: 2, qty: 22, startDate: "2026-07-28", endDate: "2026-07-28", setupMin: 60, cycleMin: 10, firstOffMin: 30, breakdownMin: 30, targetPerShift: 22, plannedDate: null },
      { pn: 27, op: 1, qty: 15, startDate: "2026-07-28", endDate: "2026-07-29", setupMin: 120, cycleMin: 30, firstOffMin: 30, breakdownMin: 30, targetPerShift: 15, plannedDate: null },
      { pn: 28, op: 1, qty: 4, startDate: "2026-07-29", endDate: "2026-07-29", setupMin: 120, cycleMin: 180, firstOffMin: 0, breakdownMin: 0, targetPerShift: 3, plannedDate: null },
      { pn: 28, op: 2, qty: 4, startDate: "2026-07-30", endDate: "2026-08-04", setupMin: 360, cycleMin: 600, firstOffMin: 120, breakdownMin: 0, targetPerShift: 1, plannedDate: null },
      { pn: 28, op: 3, qty: 4, startDate: "2026-08-04", endDate: "2026-08-05", setupMin: 240, cycleMin: 60, firstOffMin: 960, breakdownMin: 0, targetPerShift: 4, plannedDate: null },
      { pn: 29, op: 1, qty: 6, startDate: "2026-08-05", endDate: "2026-08-06", setupMin: 0, cycleMin: 180, firstOffMin: 0, breakdownMin: 0, targetPerShift: 3, plannedDate: null },
      { pn: 29, op: 2, qty: 6, startDate: "2026-08-07", endDate: "2026-09-01", setupMin: 120, cycleMin: 600, firstOffMin: 120, breakdownMin: 12480, targetPerShift: 1, plannedDate: null },
      { pn: 29, op: 3, qty: 6, startDate: "2026-09-01", endDate: "2026-09-01", setupMin: 0, cycleMin: 60, firstOffMin: 30, breakdownMin: 0, targetPerShift: 6, plannedDate: null },
      { pn: 30, op: 1, qty: 3, startDate: "2026-09-01", endDate: "2026-09-02", setupMin: 60, cycleMin: 180, firstOffMin: 0, breakdownMin: 0, targetPerShift: 3, plannedDate: null },
      { pn: 30, op: 2, qty: 3, startDate: "2026-09-02", endDate: "2026-09-04", setupMin: 120, cycleMin: 600, firstOffMin: 480, breakdownMin: 0, targetPerShift: 1, plannedDate: null },
      { pn: 30, op: 3, qty: 3, startDate: "2026-09-04", endDate: "2026-09-04", setupMin: 0, cycleMin: 60, firstOffMin: 30, breakdownMin: 0, targetPerShift: 3, plannedDate: null },
      { pn: 31, op: 1, qty: 2, startDate: "2026-09-07", endDate: "2026-09-07", setupMin: 0, cycleMin: 180, firstOffMin: 0, breakdownMin: 0, targetPerShift: 2, plannedDate: null },
      { pn: 31, op: 2, qty: 2, startDate: "2026-09-07", endDate: "2026-09-08", setupMin: 0, cycleMin: 600, firstOffMin: 0, breakdownMin: 0, targetPerShift: 1, plannedDate: null },
      { pn: 31, op: 3, qty: 2, startDate: "2026-09-09", endDate: "2026-09-09", setupMin: 0, cycleMin: 60, firstOffMin: 30, breakdownMin: 0, targetPerShift: 2, plannedDate: null },
      { pn: 32, op: 1, qty: 1, startDate: "2026-09-09", endDate: "2026-09-09", setupMin: 0, cycleMin: 180, firstOffMin: 0, breakdownMin: 60, targetPerShift: 1, plannedDate: null },
      { pn: 32, op: 2, qty: 1, startDate: "2026-09-09", endDate: "2026-09-10", setupMin: 120, cycleMin: 600, firstOffMin: 120, breakdownMin: 60, targetPerShift: 1, plannedDate: null },
      { pn: 32, op: 3, qty: 1, startDate: "2026-09-10", endDate: "2026-09-10", setupMin: 0, cycleMin: 60, firstOffMin: 30, breakdownMin: 60, targetPerShift: 1, plannedDate: null },
    ],
  },
];

// Helper: aggregate jobs by part number for the Gantt view
export interface PartSummary {
  pn: number;
  totalOps: number;
  qty: number;
  startDate: string;
  endDate: string;
  plannedDate: string | null;
  totalSetupMin: number;
  totalCycleMin: number;
  totalFirstOffMin: number;
  totalBreakdownMin: number;
  isLate: boolean;
  daysLate: number;
}

export function getPartSummaries(machine: Machine): PartSummary[] {
  const map = new Map<number, MachineJob[]>();
  for (const job of machine.jobs) {
    if (!map.has(job.pn)) map.set(job.pn, []);
    map.get(job.pn)!.push(job);
  }

  const summaries: PartSummary[] = [];
  for (const [pn, jobs] of map) {
    const startDate = jobs.reduce((min, j) => (j.startDate < min ? j.startDate : min), jobs[0].startDate);
    const endDate = jobs.reduce((max, j) => (j.endDate > max ? j.endDate : max), jobs[0].endDate);
    const plannedDate = jobs.find((j) => j.plannedDate)?.plannedDate ?? null;
    const isLate = plannedDate ? startDate > plannedDate : false;
    const daysLate = isLate
      ? Math.round((new Date(startDate).getTime() - new Date(plannedDate!).getTime()) / 86400000)
      : 0;

    summaries.push({
      pn,
      totalOps: jobs.length,
      qty: jobs[0].qty,
      startDate,
      endDate,
      plannedDate,
      totalSetupMin: jobs.reduce((s, j) => s + j.setupMin, 0),
      totalCycleMin: jobs.reduce((s, j) => s + j.cycleMin * j.qty, 0),
      totalFirstOffMin: jobs.reduce((s, j) => s + j.firstOffMin, 0),
      totalBreakdownMin: jobs.reduce((s, j) => s + j.breakdownMin, 0),
      isLate,
      daysLate,
    });
  }
  return summaries;
}

export function getMachineUtilization(machine: Machine) {
  const firstStart = new Date(machine.jobs[0].startDate);
  const lastEnd = new Date(machine.jobs[machine.jobs.length - 1].endDate);
  const totalCalendarDays = Math.round((lastEnd.getTime() - firstStart.getTime()) / 86400000);

  // Approximate working days (5/7 of calendar)
  const workingDays = Math.round(totalCalendarDays * (machine.daysPerWeek / 7));
  const totalAvailableMin = workingDays * machine.hoursPerDay * 60;

  let totalCycleMin = 0;
  let totalSetupMin = 0;
  let totalFirstOffMin = 0;
  let totalBreakdownMin = 0;

  for (const job of machine.jobs) {
    totalCycleMin += job.cycleMin * job.qty;
    totalSetupMin += job.setupMin;
    totalFirstOffMin += job.firstOffMin;
    totalBreakdownMin += job.breakdownMin;
  }

  const totalProductiveMin = totalCycleMin;
  const totalOverheadMin = totalSetupMin + totalFirstOffMin;
  const totalUsedMin = totalProductiveMin + totalOverheadMin + totalBreakdownMin;
  const totalIdleMin = Math.max(0, totalAvailableMin - totalUsedMin);

  const utilizationPct = totalAvailableMin > 0 ? Math.round((totalUsedMin / totalAvailableMin) * 100) : 0;
  const productivePct = totalAvailableMin > 0 ? Math.round((totalProductiveMin / totalAvailableMin) * 100) : 0;

  return {
    totalCalendarDays,
    workingDays,
    totalAvailableMin,
    totalCycleMin,
    totalSetupMin,
    totalFirstOffMin,
    totalBreakdownMin,
    totalIdleMin,
    utilizationPct,
    productivePct,
    totalJobs: new Set(machine.jobs.map((j) => j.pn)).size,
    bookedThrough: machine.jobs[machine.jobs.length - 1].endDate,
    scheduleStart: machine.jobs[0].startDate,
  };
}
