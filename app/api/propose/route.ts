import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { proposeSchedule } from "@/lib/mock-planner";
import { Order, Disruption, Proposal } from "@/lib/types";
import { aiKnowledge } from "@/lib/seed";
import { machines, getMachineUtilization, getPartSummaries } from "@/lib/machine-data";

const SYSTEM_PROMPT = `You are a scheduling assistant for a precision aerospace manufacturer. You help a human Master Planner (a Program Manager) respond to shop-floor disruptions by proposing a revised schedule and a confidence-rated delivery date.

You never make the final call. The Master Planner does. Your job is to give them a clear, inspectable starting point for the conversation they will have with their team and, if needed, the customer.

You will receive:
- The current order (parts, quantity, promised date, operations)
- A disruption that just occurred on the shop floor
- A list of things you know, and a list of things you explicitly don't know
- Machine capacity data showing utilization, queue depth, and breakdown history

You must respond with a single JSON object and nothing else. The schema is:

{
  "proposedDate": "YYYY-MM-DD",
  "confidencePct": <integer 0-100>,
  "reasoning": [<3-5 short sentences explaining the date>],
  "assumptions": [<2-4 assumptions you made; be specific about what you treated as fixed>],
  "unknowns": [<2-3 factors you cannot see that could move the date>],
  "operationChanges": [
    {"op": "<operation name>", "shift": "<+N days / -N days / unchanged>"}
  ]
}

Rules:
- Your confidence percentage must reflect the unknowns honestly. If you cannot see QA inspector availability and QA is on the critical path, do not report >85% confidence.
- Never propose a date earlier than physically possible given operation durations. Respect the critical path.
- If the honest answer is "we cannot hit the original date by more than X days without cutting QA," say so in reasoning.
- Do not invent data. If you don't know, list it under unknowns.
- Keep reasoning concise — the Master Planner is reading this under time pressure.

Output the JSON only. No preamble, no trailing text, no code fences.`;

export async function POST(request: NextRequest) {
  try {
    const { order, disruption } = (await request.json()) as {
      order: Order;
      disruption: Disruption;
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const fallback = proposeSchedule(order, disruption);
      return NextResponse.json({ ...fallback, source: "mock" });
    }

    const client = new Anthropic({ apiKey });

    const userMessage = `Current order:
${JSON.stringify(order, null, 2)}

Disruption that just occurred:
${JSON.stringify(disruption, null, 2)}

What the AI knows:
${aiKnowledge.knows.map((k) => `- ${k}`).join("\n")}

What the AI does NOT know:
${aiKnowledge.doesNotKnow.map((k) => `- ${k}`).join("\n")}

Machine capacity context:
${machines.map((m) => {
  const util = getMachineUtilization(m);
  const parts = getPartSummaries(m);
  const lateJobs = parts.filter((p) => p.isLate);
  return `- ${m.id}: ${m.hoursPerDay}h/day, ${m.daysPerWeek}d/wk | ${util.utilizationPct}% utilized | ${util.totalJobs} jobs queued through ${util.bookedThrough} | ${util.productivePct}% productive cutting | ${lateJobs.length} jobs behind planned dates`;
}).join("\n")}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const proposal: Proposal = JSON.parse(text);
    return NextResponse.json({ ...proposal, source: "ai" });
  } catch (error) {
    console.error("AI proposal error, falling back to mock:", error);
    try {
      const { order, disruption } = await request
        .clone()
        .json()
        .catch(() => ({ order: null, disruption: null }));
      if (order && disruption) {
        const fallback = proposeSchedule(order, disruption);
        return NextResponse.json({
          ...fallback,
          source: "mock",
          fallbackReason: "AI unavailable",
        });
      }
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
