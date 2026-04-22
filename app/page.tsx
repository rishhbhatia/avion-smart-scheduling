"use client";

import { useState, useCallback, useMemo } from "react";
import { orders, currentUser, aiKnowledge } from "@/lib/seed";
import { disruptions } from "@/lib/disruptions";
import { proposeSchedule } from "@/lib/mock-planner";
import { Disruption, Proposal, AuditEntry } from "@/lib/types";
import {
  machines,
  getPartSummaries,
  getMachineUtilization,
  Machine,
  PartSummary,
} from "@/lib/machine-data";
import {
  machineDisruptions,
  computeCascade,
  MachineDisruption,
  CascadeResult,
} from "@/lib/machine-cascade";

// ── Shared components ──

function Badge({ type }: { type: "ai" | "human" | "assumption" }) {
  const styles = {
    ai: "bg-blue-100 text-blue-800 border-blue-300",
    human: "bg-green-100 text-green-800 border-green-300",
    assumption: "bg-amber-100 text-amber-800 border-amber-300",
  };
  const labels = { ai: "AI", human: "HUMAN", assumption: "ASSUMPTION" };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border rounded ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

function ConfidenceBar({ pct }: { pct: number }) {
  const color =
    pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums">{pct}%</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
}

// ── Utilization Donut ──

function UtilizationDonut({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const size = 120;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0">
        {data.map((d, i) => {
          const pct = d.value / total;
          const offset = cumulative;
          cumulative += pct;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${pct * circumference} ${circumference}`}
              strokeDashoffset={-offset * circumference}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          className="text-lg font-bold fill-gray-900"
        >
          {Math.round((data[0].value / total) * 100)}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 12}
          textAnchor="middle"
          className="text-[9px] fill-gray-500"
        >
          productive
        </text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gray-600">{d.label}</span>
            <span className="text-gray-400 ml-auto font-mono">
              {formatMinutes(d.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Gantt Chart ──

function GanttChart({
  parts,
  machine,
  originalParts,
}: {
  parts: PartSummary[];
  machine: Machine;
  originalParts?: PartSummary[];
}) {
  // When showing cascade, extend the range to include shifted end dates
  const allStart = new Date(machine.jobs[0].startDate).getTime();
  const partsEnd = parts.reduce(
    (max, p) => Math.max(max, new Date(p.endDate).getTime()),
    0
  );
  const allEnd = Math.max(
    new Date(machine.jobs[machine.jobs.length - 1].endDate).getTime(),
    partsEnd
  );
  const totalSpan = allEnd - allStart;

  // Generate month labels
  const months: { label: string; leftPct: number }[] = [];
  const startMonth = new Date(machine.jobs[0].startDate);
  startMonth.setDate(1);
  const cursor = new Date(startMonth);
  while (cursor.getTime() <= allEnd) {
    const pct = ((cursor.getTime() - allStart) / totalSpan) * 100;
    if (pct >= 0 && pct <= 100) {
      months.push({
        label: cursor.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        leftPct: pct,
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Today marker
  const today = new Date("2026-04-21").getTime();
  const todayPct = ((today - allStart) / totalSpan) * 100;

  return (
    <div>
      {/* Month headers */}
      <div className="relative h-5 mb-1 text-[9px] text-gray-400 font-mono">
        {months.map((m, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: `${Math.max(0, m.leftPct)}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>
      {/* Bars */}
      <div className="space-y-1">
        {parts.map((part) => {
          const s = new Date(part.startDate).getTime();
          const e = new Date(part.endDate).getTime();
          const leftPct = ((s - allStart) / totalSpan) * 100;
          const widthPct = Math.max(0.5, ((e - s) / totalSpan) * 100);

          // Original position (ghost bar) when showing cascade
          const orig = originalParts?.find((p) => p.pn === part.pn);
          const isShifted =
            orig && (orig.startDate !== part.startDate || orig.endDate !== part.endDate);
          const origLeftPct = orig
            ? ((new Date(orig.startDate).getTime() - allStart) / totalSpan) * 100
            : 0;
          const origWidthPct = orig
            ? Math.max(
                0.5,
                ((new Date(orig.endDate).getTime() -
                  new Date(orig.startDate).getTime()) /
                  totalSpan) *
                  100
              )
            : 0;

          return (
            <div key={part.pn} className="flex items-center gap-2 h-6">
              <span
                className={`text-[10px] font-mono w-8 shrink-0 text-right ${isShifted ? "text-red-500 font-bold" : "text-gray-400"}`}
              >
                PN{part.pn}
              </span>
              <div className="flex-1 relative h-5 bg-gray-100 rounded">
                {/* Today line */}
                {todayPct > 0 && todayPct < 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-blue-400 z-10"
                    style={{ left: `${todayPct}%` }}
                  />
                )}
                {/* Ghost bar showing original position */}
                {isShifted && (
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-sm bg-gray-300 opacity-40"
                    style={{
                      left: `${origLeftPct}%`,
                      width: `${origWidthPct}%`,
                      minWidth: "4px",
                    }}
                  />
                )}
                {/* Current / shifted bar */}
                <div
                  className={`absolute top-0.5 bottom-0.5 rounded-sm ${
                    isShifted
                      ? "bg-red-500"
                      : part.isLate
                        ? "bg-red-400"
                        : part.totalBreakdownMin > 1000
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                  }`}
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    minWidth: "4px",
                  }}
                  title={`PN${part.pn}: ${formatDateShort(part.startDate)} → ${formatDateShort(part.endDate)}${isShifted ? " (SHIFTED)" : ""}${part.isLate ? ` (${part.daysLate}d late)` : ""}`}
                />
              </div>
              <span className="text-[10px] text-gray-400 w-16 shrink-0">
                {isShifted ? (
                  <span className="text-red-500">
                    +{Math.round(
                      (new Date(part.endDate).getTime() -
                        new Date(orig!.endDate).getTime()) /
                        86400000
                    )}d
                  </span>
                ) : (
                  formatDateShort(part.startDate)
                )}
              </span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-2 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-emerald-400 rounded-sm" /> On schedule
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-amber-400 rounded-sm" /> High breakdown
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-red-400 rounded-sm" /> Late vs planned
        </span>
        {originalParts && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-sm" /> Shifted
          </span>
        )}
        {originalParts && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-300 rounded-sm opacity-40" /> Original
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-px h-3 bg-blue-400" /> Today
        </span>
      </div>
    </div>
  );
}

// ── Main ──

export default function Home() {
  const [viewMode, setViewMode] = useState<"orders" | "machines">("orders");
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0].id);
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0].id);
  const [showDisruptionPicker, setShowDisruptionPicker] = useState(false);
  const [activeDisruption, setActiveDisruption] = useState<Disruption | null>(
    null
  );
  const [proposal, setProposal] = useState<
    (Proposal & { source?: string; fallbackReason?: string }) | null
  >(null);
  const [isThinking, setIsThinking] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [actionMode, setActionMode] = useState<
    "accept" | "override" | "decline" | null
  >(null);
  const [rationale, setRationale] = useState("");
  const [overrideDate, setOverrideDate] = useState("");
  const [confidenceExpanded, setConfidenceExpanded] = useState(false);
  const [expandedJobPn, setExpandedJobPn] = useState<number | null>(null);
  const [activeMachineDisruption, setActiveMachineDisruption] =
    useState<MachineDisruption | null>(null);
  const [cascadeResult, setCascadeResult] = useState<CascadeResult | null>(
    null
  );

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)!;
  const selectedMachine = machines.find((m) => m.id === selectedMachineId)!;

  const machineUtil = useMemo(
    () => getMachineUtilization(selectedMachine),
    [selectedMachine]
  );
  const partSummaries = useMemo(
    () => getPartSummaries(selectedMachine),
    [selectedMachine]
  );
  const lateJobs = partSummaries.filter((p) => p.isLate);
  const highBreakdownJobs = partSummaries.filter(
    (p) => p.totalBreakdownMin > 1000
  );

  const handleInjectDisruption = useCallback(
    async (disruption: Disruption) => {
      setActiveDisruption(disruption);
      setShowDisruptionPicker(false);
      setProposal(null);
      setActionMode(null);
      setRationale("");
      setIsThinking(true);

      try {
        const res = await fetch("/api/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: selectedOrder, disruption }),
        });
        if (res.ok) {
          const data = await res.json();
          setProposal(data);
        } else {
          throw new Error("API error");
        }
      } catch {
        const mock = proposeSchedule(selectedOrder, disruption);
        setProposal({
          ...mock,
          source: "mock",
          fallbackReason: "AI unavailable",
        });
      } finally {
        setIsThinking(false);
      }
    },
    [selectedOrder]
  );

  const handleMachineDisruption = useCallback(
    (disruption: MachineDisruption) => {
      setActiveMachineDisruption(disruption);
      setShowDisruptionPicker(false);
      const result = computeCascade(selectedMachine, disruption);
      setCascadeResult(result);
    },
    [selectedMachine]
  );

  const handleAction = useCallback(
    (action: "accept" | "override" | "decline") => {
      if (!proposal) return;
      const entry: AuditEntry = {
        timestamp: new Date().toISOString(),
        action,
        orderId: selectedOrder.id,
        aiProposedDate: proposal.proposedDate,
        aiConfidence: proposal.confidencePct,
        humanChosenDate:
          action === "accept"
            ? proposal.proposedDate
            : action === "override"
              ? overrideDate || proposal.proposedDate
              : null,
        rationale,
        humanName: currentUser.name,
      };
      setAuditLog((prev) => [entry, ...prev]);
      setActionMode(null);
      setRationale("");
      setOverrideDate("");
    },
    [proposal, selectedOrder.id, rationale, overrideDate]
  );

  const resetDemo = () => {
    setActiveDisruption(null);
    setProposal(null);
    setActionMode(null);
    setRationale("");
    setOverrideDate("");
    setAuditLog([]);
    setIsThinking(false);
    setSelectedOrderId(orders[0].id);
    setConfidenceExpanded(false);
    setExpandedJobPn(null);
    setActiveMachineDisruption(null);
    setCascadeResult(null);
  };

  const statusColors = {
    "in-progress": "text-blue-600 bg-blue-50",
    "at-risk": "text-red-600 bg-red-50",
    "on-track": "text-emerald-600 bg-emerald-50",
  };

  const donutData = [
    { label: "Cutting", value: machineUtil.totalCycleMin, color: "#10b981" },
    { label: "Setup", value: machineUtil.totalSetupMin, color: "#3b82f6" },
    {
      label: "First-off",
      value: machineUtil.totalFirstOffMin,
      color: "#8b5cf6",
    },
    {
      label: "Breakdown",
      value: machineUtil.totalBreakdownMin,
      color: "#ef4444",
    },
    { label: "Idle / gaps", value: machineUtil.totalIdleMin, color: "#e5e7eb" },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-tight">
            Avion Smart Scheduling
          </h1>
          <span className="text-xs font-medium bg-gray-900 text-white px-2 py-0.5 rounded">
            HUMAN-IN-THE-LOOP MODE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetDemo}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 px-2 py-1 rounded hover:bg-gray-50"
          >
            Reset demo
          </button>
          <span className="text-sm text-gray-600">
            Logged in as: <strong>{currentUser.name}</strong>,{" "}
            {currentUser.role} <Badge type="human" />
          </span>
        </div>
      </header>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ══ Left column ══ */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          {/* View toggle */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("orders")}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${viewMode === "orders" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              >
                Orders
              </button>
              <button
                onClick={() => setViewMode("machines")}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${viewMode === "machines" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              >
                Machines
              </button>
            </div>
          </div>

          {viewMode === "orders" ? (
            <>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setActiveDisruption(null);
                      setProposal(null);
                      setActionMode(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedOrderId === order.id
                        ? "bg-gray-100 ring-1 ring-gray-300"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-sm">
                        {order.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${statusColors[order.status]}`}
                      >
                        {order.status === "at-risk"
                          ? "At Risk"
                          : order.status === "on-track"
                            ? "On Track"
                            : "In Progress"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {order.customer}
                    </p>
                    <div className="mt-1.5">
                      <ConfidenceBar pct={order.currentConfidence} />
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={() => setShowDisruptionPicker(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Inject Disruption
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {machines.map((machine) => {
                  const util = getMachineUtilization(machine);
                  return (
                    <button
                      key={machine.id}
                      onClick={() => setSelectedMachineId(machine.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedMachineId === machine.id
                          ? "bg-gray-100 ring-1 ring-gray-300"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-sm">
                          {machine.id}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          {machine.hoursPerDay}h/day
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {util.totalJobs} jobs &middot; Booked thru{" "}
                        {formatDateShort(util.bookedThrough)}
                      </p>
                      <div className="mt-1.5">
                        {/* Utilization bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${util.utilizationPct >= 85 ? "bg-red-500" : util.utilizationPct >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${util.utilizationPct}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold tabular-nums">
                            {util.utilizationPct}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={() => setShowDisruptionPicker(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Inject Disruption
                </button>
              </div>
            </>
          )}
        </aside>

        {/* ══ Center column ══ */}
        <main className="flex-1 overflow-y-auto p-6">
          {viewMode === "orders" ? (
            // ─── ORDER VIEW ───
            <>
              {/* Order header */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">
                        {selectedOrder.id}
                      </h2>
                      <Badge type="human" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedOrder.customer}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {selectedOrder.part} — Qty {selectedOrder.qty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Promised delivery
                    </p>
                    <p className="text-lg font-bold">
                      {formatDate(selectedOrder.promisedDate)}
                    </p>
                    <div className="mt-1 w-40">
                      <ConfidenceBar
                        pct={selectedOrder.currentConfidence}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations timeline */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Operations Schedule <Badge type="human" />
                </h3>
                <div className="space-y-2">
                  {selectedOrder.operations.map((op, i) => {
                    const change = proposal?.operationChanges.find(
                      (c) => c.op === op.name
                    );
                    const isShifted =
                      change && change.shift !== "unchanged";
                    return (
                      <div
                        key={op.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${
                          isShifted
                            ? "bg-amber-50 border border-amber-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <span className="text-gray-400 font-mono text-xs w-5">
                          {i + 1}
                        </span>
                        <span className="flex-1 font-medium">
                          {op.name}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {op.machine}
                        </span>
                        <span className="text-xs text-gray-500 w-24 text-right">
                          {formatDate(op.plannedStart)}
                        </span>
                        <span className="text-xs text-gray-400 w-16 text-right">
                          {op.duration}d
                        </span>
                        {isShifted && (
                          <span className="text-xs font-bold text-amber-700">
                            {change.shift}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active disruption */}
              {activeDisruption && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <span className="text-red-600 font-bold text-sm">
                    Active Disruption
                  </span>
                  <p className="text-sm text-red-800 mt-1">
                    {activeDisruption.detail}
                  </p>
                </div>
              )}

              {/* AI thinking */}
              {isThinking && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-blue-700">
                      AI is analyzing disruption impact...
                    </span>
                    <Badge type="ai" />
                  </div>
                </div>
              )}

              {/* Proposal */}
              {proposal && !isThinking && (
                <div className="bg-white rounded-xl border-2 border-blue-200 p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700">
                      Proposed Schedule Revision
                    </h3>
                    <Badge type="ai" />
                    {proposal.fallbackReason && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        {proposal.fallbackReason} — showing cached logic
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        New proposed date
                      </p>
                      <p className="text-2xl font-bold">
                        {formatDate(proposal.proposedDate)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() =>
                          setConfidenceExpanded(!confidenceExpanded)
                        }
                        className="text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                      >
                        {proposal.confidencePct}% confident{" "}
                        {confidenceExpanded ? "▴" : "▾"}
                      </button>
                      {confidenceExpanded && (
                        <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium mb-1">
                            What drives the{" "}
                            {100 - proposal.confidencePct}% risk:
                          </p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {proposal.unknowns.map((u, i) => (
                              <li key={i}>{u}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Reasoning <Badge type="ai" />
                    </h4>
                    <ul className="space-y-1">
                      {proposal.reasoning.map((r, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-700 flex gap-2"
                        >
                          <span className="text-gray-400 shrink-0">
                            •
                          </span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Assumptions <Badge type="assumption" />
                    </h4>
                    <ul className="space-y-1">
                      {proposal.assumptions.map((a, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-700 flex gap-2"
                        >
                          <span className="text-amber-500 shrink-0">
                            ~
                          </span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action buttons */}
                  {actionMode === null && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setActionMode("accept")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                      >
                        Accept proposal
                      </button>
                      <button
                        onClick={() => {
                          setActionMode("override");
                          setOverrideDate(proposal.proposedDate);
                        }}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                      >
                        Override with my date
                      </button>
                      <button
                        onClick={() => setActionMode("decline")}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Rationale capture */}
                  {actionMode && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge type="human" />
                        <span className="text-sm font-medium">
                          {actionMode === "accept"
                            ? "Why are you accepting this proposal?"
                            : actionMode === "override"
                              ? "What are you changing and why?"
                              : "Why is this proposal not acceptable?"}
                        </span>
                      </div>
                      {actionMode === "override" && (
                        <div className="mb-2">
                          <label className="text-xs text-gray-500 block mb-1">
                            Your delivery date:
                          </label>
                          <input
                            type="date"
                            value={overrideDate}
                            onChange={(e) =>
                              setOverrideDate(e.target.value)
                            }
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                      )}
                      <textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="Your reasoning (required, min 10 characters)..."
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {rationale.length}/10 characters minimum
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setActionMode(null);
                              setRationale("");
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={rationale.length < 10}
                            onClick={() => handleAction(actionMode)}
                            className="bg-gray-900 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                          >
                            Submit decision
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No disruption placeholder */}
              {!activeDisruption && !isThinking && !proposal && (
                <div className="bg-gray-100 border border-dashed border-gray-300 rounded-xl p-8 mb-4 text-center">
                  <p className="text-gray-400 text-sm">
                    No active disruption. Click{" "}
                    <strong>Inject Disruption</strong> to simulate a
                    shop-floor event.
                  </p>
                </div>
              )}

              {/* Audit trail */}
              {auditLog.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Decision Audit Trail
                  </h3>
                  <div className="space-y-3">
                    {auditLog.map((entry, i) => (
                      <div
                        key={i}
                        className="border border-gray-100 rounded-lg p-3 text-sm"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge type="ai" />
                          <span>
                            proposed {formatDate(entry.aiProposedDate)}{" "}
                            ({entry.aiConfidence}%)
                          </span>
                          <span className="text-gray-400">&rarr;</span>
                          <Badge type="human" />
                          <span className="font-medium">
                            {entry.humanName}{" "}
                            {entry.action === "accept"
                              ? "accepted"
                              : entry.action === "override"
                                ? `overrode → ${formatDate(entry.humanChosenDate!)}`
                                : "declined"}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1.5 italic">
                          &ldquo;{entry.rationale}&rdquo;
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(entry.timestamp).toLocaleString()}{" "}
                          &middot; {entry.orderId}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // ─── MACHINE VIEW ───
            <>
              {/* Machine header / capacity summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold font-mono">
                        {selectedMachine.id}
                      </h2>
                      <Badge type="human" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      CNC Vertical Machining Center
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Capacity
                    </p>
                    <p className="text-lg font-bold">
                      {selectedMachine.hoursPerDay}h/day &middot;{" "}
                      {selectedMachine.daysPerWeek}d/wk
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Utilization</p>
                    <p className="text-2xl font-bold">
                      {machineUtil.utilizationPct}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Jobs in queue</p>
                    <p className="text-2xl font-bold">
                      {machineUtil.totalJobs}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Booked through</p>
                    <p className="text-lg font-bold">
                      {formatDate(machineUtil.bookedThrough)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Schedule span</p>
                    <p className="text-lg font-bold">
                      {machineUtil.totalCalendarDays} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Active machine disruption */}
              {activeMachineDisruption && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <span className="text-red-600 font-bold text-sm">
                    Active Disruption — {activeMachineDisruption.label}
                  </span>
                  <p className="text-sm text-red-800 mt-1">
                    {activeMachineDisruption.detail}
                  </p>
                </div>
              )}

              {/* Cascade impact summary */}
              {cascadeResult && (
                <div className="bg-white rounded-xl border-2 border-red-200 p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-red-700">
                      Cascade Impact Analysis
                    </h3>
                    <Badge type="ai" />
                  </div>

                  {/* Impact stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">
                        +{cascadeResult.scheduleExtensionDays}d
                      </p>
                      <p className="text-[10px] text-red-600 uppercase">
                        Schedule extension
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-amber-700">
                        {cascadeResult.affectedPartCount}
                      </p>
                      <p className="text-[10px] text-amber-600 uppercase">
                        Parts affected
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">
                        {cascadeResult.newlyLatePartPns.length}
                      </p>
                      <p className="text-[10px] text-red-600 uppercase">
                        Newly late
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-700">
                        {cascadeResult.affectedJobCount}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Operations shifted
                      </p>
                    </div>
                  </div>

                  {/* Before/after comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">
                        Before disruption
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Schedule ends</span>
                          <span className="font-medium">
                            {formatDate(cascadeResult.originalUtil.bookedThrough)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Utilization</span>
                          <span className="font-medium">
                            {cascadeResult.originalUtil.utilizationPct}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Late jobs</span>
                          <span className="font-medium">
                            {cascadeResult.originalParts.filter((p) => p.isLate).length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <h4 className="text-[10px] font-bold text-red-600 uppercase mb-2">
                        After disruption
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-red-600">Schedule ends</span>
                          <span className="font-bold text-red-700">
                            {formatDate(cascadeResult.shiftedUtil.bookedThrough)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Utilization</span>
                          <span className="font-bold text-red-700">
                            {cascadeResult.shiftedUtil.utilizationPct}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Late jobs</span>
                          <span className="font-bold text-red-700">
                            {cascadeResult.shiftedParts.filter((p) => p.isLate).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Newly late parts detail */}
                  {cascadeResult.newlyLatePartPns.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 mb-3">
                      <h4 className="text-[10px] font-bold text-red-700 uppercase mb-1.5">
                        Newly late — these parts now miss their planned dates
                      </h4>
                      <div className="space-y-1">
                        {cascadeResult.newlyLatePartPns.map((pn) => {
                          const shifted = cascadeResult.shiftedParts.find(
                            (p) => p.pn === pn
                          )!;
                          const orig = cascadeResult.originalParts.find(
                            (p) => p.pn === pn
                          )!;
                          return (
                            <div
                              key={pn}
                              className="text-xs flex items-center gap-2"
                            >
                              <span className="font-mono font-bold text-red-800">
                                PN{pn}
                              </span>
                              <span className="text-red-600">
                                Planned {formatDateShort(shifted.plannedDate!)}
                                {" → "}Was ending{" "}
                                {formatDateShort(orig.endDate)}, now ending{" "}
                                {formatDateShort(shifted.endDate)} (
                                {shifted.daysLate}d late)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Worsened parts */}
                  {cascadeResult.worsenedPartPns.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <h4 className="text-[10px] font-bold text-amber-700 uppercase mb-1.5">
                        Already late — now further behind
                      </h4>
                      <div className="space-y-1">
                        {cascadeResult.worsenedPartPns.map((pn) => {
                          const shifted = cascadeResult.shiftedParts.find(
                            (p) => p.pn === pn
                          )!;
                          const orig = cascadeResult.originalParts.find(
                            (p) => p.pn === pn
                          )!;
                          return (
                            <div
                              key={pn}
                              className="text-xs flex items-center gap-2"
                            >
                              <span className="font-mono font-bold text-amber-800">
                                PN{pn}
                              </span>
                              <span className="text-amber-600">
                                Was {orig.daysLate}d late → now{" "}
                                {shifted.daysLate}d late
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Utilization breakdown donut */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                  Time Utilization Breakdown <Badge type="ai" />
                </h3>
                <UtilizationDonut data={donutData} />
              </div>

              {/* Gantt timeline */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Job Queue Timeline{" "}
                    {cascadeResult ? (
                      <span className="text-red-600">
                        — showing disruption impact
                      </span>
                    ) : null}{" "}
                    <Badge type="human" />
                  </h3>
                  {cascadeResult && (
                    <button
                      onClick={() => {
                        setActiveMachineDisruption(null);
                        setCascadeResult(null);
                      }}
                      className="text-[10px] text-gray-500 hover:text-gray-700 border border-gray-300 px-2 py-0.5 rounded"
                    >
                      Clear disruption
                    </button>
                  )}
                </div>
                <GanttChart
                  parts={
                    cascadeResult
                      ? cascadeResult.shiftedParts
                      : partSummaries
                  }
                  machine={selectedMachine}
                  originalParts={
                    cascadeResult
                      ? cascadeResult.originalParts
                      : undefined
                  }
                />
              </div>

              {/* Alerts: late jobs and high breakdown */}
              {(lateJobs.length > 0 || highBreakdownJobs.length > 0) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {lateJobs.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-red-700 uppercase mb-2">
                        Late vs Planned ({lateJobs.length})
                      </h4>
                      <div className="space-y-1.5">
                        {lateJobs.map((p) => (
                          <div
                            key={p.pn}
                            className="text-xs flex justify-between"
                          >
                            <span className="font-mono font-medium text-red-800">
                              PN{p.pn}
                            </span>
                            <span className="text-red-600">
                              {p.daysLate}d late (planned{" "}
                              {formatDateShort(p.plannedDate!)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {highBreakdownJobs.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-amber-700 uppercase mb-2">
                        High Breakdown Time ({highBreakdownJobs.length})
                      </h4>
                      <div className="space-y-1.5">
                        {highBreakdownJobs.map((p) => (
                          <div
                            key={p.pn}
                            className="text-xs flex justify-between"
                          >
                            <span className="font-mono font-medium text-amber-800">
                              PN{p.pn}
                            </span>
                            <span className="text-amber-600">
                              {formatMinutes(p.totalBreakdownMin)} breakdown
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Job queue detail table */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Job Queue Detail <Badge type="human" />
                </h3>
                {/* Header */}
                <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <span className="w-12">Part</span>
                  <span className="w-8 text-center">Ops</span>
                  <span className="w-10 text-center">Qty</span>
                  <span className="w-20">Start</span>
                  <span className="w-20">End</span>
                  <span className="flex-1">Time Breakdown</span>
                  <span className="w-16 text-right">Status</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {partSummaries.map((part) => {
                    const totalMin =
                      part.totalCycleMin +
                      part.totalSetupMin +
                      part.totalFirstOffMin +
                      part.totalBreakdownMin;
                    const isExpanded = expandedJobPn === part.pn;
                    const jobOps = selectedMachine.jobs.filter(
                      (j) => j.pn === part.pn
                    );

                    return (
                      <div key={part.pn}>
                        <button
                          onClick={() =>
                            setExpandedJobPn(isExpanded ? null : part.pn)
                          }
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors ${isExpanded ? "bg-gray-50" : ""}`}
                        >
                          <span className="w-12 font-mono font-semibold text-xs">
                            PN{part.pn}
                          </span>
                          <span className="w-8 text-center text-xs text-gray-500">
                            {part.totalOps}
                          </span>
                          <span className="w-10 text-center text-xs text-gray-500">
                            {part.qty}
                          </span>
                          <span className="w-20 text-xs text-gray-500">
                            {formatDateShort(part.startDate)}
                          </span>
                          <span className="w-20 text-xs text-gray-500">
                            {formatDateShort(part.endDate)}
                          </span>
                          {/* Stacked time bar */}
                          <span className="flex-1">
                            <span className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                              {totalMin > 0 && (
                                <>
                                  <span
                                    className="bg-emerald-400"
                                    style={{
                                      width: `${(part.totalCycleMin / totalMin) * 100}%`,
                                    }}
                                  />
                                  <span
                                    className="bg-blue-400"
                                    style={{
                                      width: `${(part.totalSetupMin / totalMin) * 100}%`,
                                    }}
                                  />
                                  <span
                                    className="bg-violet-400"
                                    style={{
                                      width: `${(part.totalFirstOffMin / totalMin) * 100}%`,
                                    }}
                                  />
                                  <span
                                    className="bg-red-400"
                                    style={{
                                      width: `${(part.totalBreakdownMin / totalMin) * 100}%`,
                                    }}
                                  />
                                </>
                              )}
                            </span>
                          </span>
                          <span className="w-16 text-right">
                            {part.isLate ? (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                {part.daysLate}d LATE
                              </span>
                            ) : part.totalBreakdownMin > 1000 ? (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                ALERT
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">
                                OK
                              </span>
                            )}
                          </span>
                        </button>

                        {/* Expanded op details */}
                        {isExpanded && (
                          <div className="ml-14 mr-2 mb-2 bg-gray-50 rounded-lg p-3">
                            {part.plannedDate && (
                              <p className="text-xs text-red-600 mb-2">
                                Planned date:{" "}
                                {formatDate(part.plannedDate)} — Actual
                                start:{" "}
                                {formatDate(part.startDate)}
                              </p>
                            )}
                            <div className="space-y-1">
                              {jobOps.map((op, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 text-xs"
                                >
                                  <span className="text-gray-400 font-mono w-8">
                                    Op {op.op}
                                  </span>
                                  <span className="text-gray-500 w-20">
                                    {formatDateShort(op.startDate)} →{" "}
                                    {formatDateShort(op.endDate)}
                                  </span>
                                  <span className="text-emerald-600 w-16">
                                    Cut: {formatMinutes(op.cycleMin * op.qty)}
                                  </span>
                                  <span className="text-blue-600 w-16">
                                    Set: {formatMinutes(op.setupMin)}
                                  </span>
                                  <span className="text-violet-600 w-14">
                                    FAI: {formatMinutes(op.firstOffMin)}
                                  </span>
                                  {op.breakdownMin > 0 && (
                                    <span className="text-red-600 font-medium">
                                      Brk: {formatMinutes(op.breakdownMin)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-4 mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
                              <span>
                                Total cutting:{" "}
                                {formatMinutes(part.totalCycleMin)}
                              </span>
                              <span>
                                Total setup:{" "}
                                {formatMinutes(part.totalSetupMin)}
                              </span>
                              <span>
                                Total first-off:{" "}
                                {formatMinutes(part.totalFirstOffMin)}
                              </span>
                              <span>
                                Total breakdown:{" "}
                                {formatMinutes(part.totalBreakdownMin)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Bar legend */}
                <div className="flex gap-4 mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-sm" />{" "}
                    Cutting
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-sm" />{" "}
                    Setup
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-violet-400 rounded-sm" />{" "}
                    First-off
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-400 rounded-sm" />{" "}
                    Breakdown
                  </span>
                </div>
              </div>
            </>
          )}
        </main>

        {/* ══ Right column: AI Transparency Panel ══ */}
        <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                AI Transparency Panel
              </h2>
              <Badge type="ai" />
            </div>
          </div>

          <div className="p-4 space-y-5 text-sm">
            {/* What I know */}
            <div>
              <h3 className="font-semibold text-emerald-700 mb-2 text-xs uppercase tracking-wide">
                What I know
              </h3>
              <ul className="space-y-1.5">
                {aiKnowledge.knows.map((item, i) => (
                  <li key={i} className="text-gray-600 flex gap-2 text-xs">
                    <span className="text-emerald-500 shrink-0 mt-0.5">
                      ●
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What I don't know */}
            <div>
              <h3 className="font-semibold text-red-700 mb-2 text-xs uppercase tracking-wide">
                What I don&apos;t know
              </h3>
              <ul className="space-y-1.5">
                {aiKnowledge.doesNotKnow.map((item, i) => (
                  <li key={i} className="text-gray-600 flex gap-2 text-xs">
                    <span className="text-red-400 shrink-0 mt-0.5">●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Machine-specific context when in machine view */}
            {viewMode === "machines" && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-blue-700 mb-2 text-xs uppercase tracking-wide">
                  Machine Context <Badge type="ai" />
                </h3>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  <li className="flex gap-2">
                    <span className="text-blue-500 shrink-0 mt-0.5">●</span>
                    {selectedMachine.id} runs{" "}
                    {selectedMachine.hoursPerDay}h/day,{" "}
                    {selectedMachine.daysPerWeek} days/week (2 shifts)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 shrink-0 mt-0.5">●</span>
                    {machineUtil.totalJobs} parts queued through{" "}
                    {formatDate(machineUtil.bookedThrough)}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 shrink-0 mt-0.5">●</span>
                    {machineUtil.utilizationPct}% utilized ({machineUtil.productivePct}% productive cutting)
                  </li>
                  {lateJobs.length > 0 && (
                    <li className="flex gap-2">
                      <span className="text-red-500 shrink-0 mt-0.5">
                        ●
                      </span>
                      {lateJobs.length} job(s) running behind planned
                      dates
                    </li>
                  )}
                  {highBreakdownJobs.length > 0 && (
                    <li className="flex gap-2">
                      <span className="text-amber-500 shrink-0 mt-0.5">
                        ●
                      </span>
                      {highBreakdownJobs.length} job(s) with significant
                      breakdown time
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Data sources */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-500 mb-2 text-xs uppercase tracking-wide">
                Data Sources
              </h3>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>• ERP machine schedule (live)</li>
                <li>• Material PO tracker (daily sync)</li>
                <li>• Historical slip-rate database (12mo)</li>
                <li>• AS9100 cycle time standards</li>
                {viewMode === "machines" && (
                  <li>• Machine capacity settings (16h/day, 5d/wk)</li>
                )}
              </ul>
            </div>

            {/* Active proposal unknowns */}
            {proposal && !isThinking && viewMode === "orders" && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-amber-700 mb-2 text-xs uppercase tracking-wide">
                  Current Proposal Unknowns <Badge type="ai" />
                </h3>
                <ul className="space-y-1.5">
                  {proposal.unknowns.map((u, i) => (
                    <li
                      key={i}
                      className="text-gray-600 flex gap-2 text-xs"
                    >
                      <span className="text-amber-500 shrink-0 mt-0.5">
                        ?
                      </span>
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 text-[10px] text-gray-400">
              <p>
                This panel is always visible so you can evaluate what the AI
                sees and what it doesn&apos;t. Your expertise fills the gaps.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Disruption picker modal */}
      {showDisruptionPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold">
                Inject Shop-Floor Disruption
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Select a disruption to simulate
                {viewMode === "orders"
                  ? ` on order ${selectedOrder.id}`
                  : ` on machine ${selectedMachine.id}`}
              </p>
            </div>
            <div className="p-3 space-y-2">
              {viewMode === "orders"
                ? disruptions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleInjectDisruption(d)}
                      className="w-full text-left p-4 rounded-xl hover:bg-red-50 border border-gray-200 hover:border-red-300 transition-colors"
                    >
                      <div className="font-medium text-sm">{d.label}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {d.detail}
                      </p>
                    </button>
                  ))
                : machineDisruptions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleMachineDisruption(d)}
                      className="w-full text-left p-4 rounded-xl hover:bg-red-50 border border-gray-200 hover:border-red-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {d.label}
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">
                          +{d.delayDays}d at PN{d.affectedPn}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {d.detail}
                      </p>
                    </button>
                  ))}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => setShowDisruptionPicker(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
