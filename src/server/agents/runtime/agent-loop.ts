import "server-only";

import { AIMessage, HumanMessage, SystemMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";
import { tool, type StructuredToolInterface } from "@langchain/core/tools";
import { Annotation, END, START, StateGraph, messagesStateReducer } from "@langchain/langgraph";
import type { z } from "zod";

import type { AgentName } from "@/domain/pipelines/types";
import { createChatModel, type ModelRole } from "@/server/agents/llm/model";
import type { AgentEventSink } from "./events";

export type AgentLoopOptions<Report extends z.ZodObject> = {
  agent: AgentName;
  systemPrompt: string;
  task: string;
  tools: StructuredToolInterface[];
  /** Schema of the final report; the agent ends its loop by calling `submit_report`. */
  reportSchema: Report;
  sink: AgentEventSink;
  maxIterations: number;
  /** Wall-clock budget; the loop stops at the next turn after this. */
  maxDurationMs: number;
  modelRole?: ModelRole;
};

export type AgentLoopResult<Report> = {
  report: Report | null;
  iterations: number;
  stopReason: "submitted" | "max_iterations" | "timeout" | "no_progress";
};

const CONTEXT_CHAR_BUDGET = 140_000;
const KEEP_RECENT_MESSAGES = 8;

/**
 * Keeps the conversation inside the model's budget without breaking
 * tool-call/tool-result pairing: old tool outputs are elided, not removed.
 */
function compact(messages: BaseMessage[]): BaseMessage[] {
  const size = (list: BaseMessage[]) => list.reduce((total, message) => total + String(message.content).length, 0);
  if (size(messages) <= CONTEXT_CHAR_BUDGET) return messages;
  return messages.map((message, index) => {
    if (index >= messages.length - KEEP_RECENT_MESSAGES || !(message instanceof ToolMessage)) return message;
    const content = String(message.content);
    if (content.length < 400) return message;
    return new ToolMessage({ content: `${content.slice(0, 200)}\n…[older output elided to save context]`, tool_call_id: message.tool_call_id, name: message.name });
  });
}

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: messagesStateReducer, default: () => [] }),
  iterations: Annotation<number>({ reducer: (_current, update) => update, default: () => 0 }),
  nudges: Annotation<number>({ reducer: (_current, update) => update, default: () => 0 }),
  submitted: Annotation<boolean>({ reducer: (_current, update) => update, default: () => false }),
});

/**
 * A single agent as an explicit LangGraph loop:
 *
 *   START → think ─┬─(tool calls)──→ act ─→ think …
 *                  ├─(no tool call)→ nudge → think   (once, then stop)
 *                  └─(submitted / budget spent)→ END
 *
 * Budgets (iterations + wall clock) bound every loop; guardrails live in the tools.
 */
export async function runAgentLoop<Report extends z.ZodObject>(options: AgentLoopOptions<Report>): Promise<AgentLoopResult<z.infer<Report>>> {
  const { agent, sink, maxIterations } = options;
  const deadline = Date.now() + options.maxDurationMs;
  let report: z.infer<Report> | null = null;

  const submitTool = tool(
    async (input) => {
      report = input as z.infer<Report>;
      return "Report received. Stop now.";
    },
    {
      name: "submit_report",
      description: "Submit your final report. Call this exactly once, when your work is verified or your budget is nearly spent.",
      schema: options.reportSchema,
    },
  );

  const tools: StructuredToolInterface[] = [...options.tools, submitTool as unknown as StructuredToolInterface];
  const toolsByName = new Map<string, StructuredToolInterface>(tools.map((entry) => [entry.name, entry]));
  const model = createChatModel(options.modelRole ?? "reasoning").bindTools(tools);
  const system = new SystemMessage(options.systemPrompt);

  const think = async (state: typeof AgentState.State) => {
    const response = await model.invoke([system, ...compact(state.messages)]);
    const text = typeof response.content === "string" ? response.content : "";
    if (text.trim()) await sink.emit(agent, "thought", text.trim().slice(0, 600));
    return { messages: [response], iterations: state.iterations + 1 };
  };

  // Tools run sequentially: parallel writes/commands in one workspace would race.
  const act = async (state: typeof AgentState.State) => {
    const last = state.messages.at(-1) as AIMessage;
    const results: ToolMessage[] = [];
    for (const call of last.tool_calls ?? []) {
      const selected = toolsByName.get(call.name);
      let content: string;
      try {
        content = selected ? String(await selected.invoke(call.args)) : `Unknown tool "${call.name}".`;
      } catch (error) {
        content = `Tool error: ${error instanceof Error ? error.message : String(error)}`;
      }
      results.push(new ToolMessage({ content, tool_call_id: call.id ?? call.name, name: call.name }));
    }
    return { messages: results, submitted: report !== null };
  };

  const nudge = async (state: typeof AgentState.State) => ({
    messages: [new HumanMessage("Continue by calling a tool. When you are done, call submit_report with your verified results.")],
    nudges: state.nudges + 1,
  });

  const outOfBudget = (state: typeof AgentState.State) => state.iterations >= maxIterations || Date.now() > deadline;

  const graph = new StateGraph(AgentState)
    .addNode("think", think)
    .addNode("act", act)
    .addNode("nudge", nudge)
    .addEdge(START, "think")
    .addConditionalEdges("think", (state) => {
      const last = state.messages.at(-1) as AIMessage;
      if (last.tool_calls?.length) return "act";
      if (state.nudges < 1 && !outOfBudget(state)) return "nudge";
      return END;
    })
    .addConditionalEdges("act", (state) => (state.submitted || outOfBudget(state) ? END : "think"))
    .addEdge("nudge", "think")
    .compile();

  const final = await graph.invoke(
    { messages: [new HumanMessage(options.task)] },
    { recursionLimit: maxIterations * 3 + 10 },
  );

  const stopReason: AgentLoopResult<unknown>["stopReason"] = report
    ? "submitted"
    : Date.now() > deadline ? "timeout" : final.iterations >= maxIterations ? "max_iterations" : "no_progress";
  if (!report) await sink.emit(agent, "guardrail", `Stopped without a report (${stopReason.replace("_", " ")}) after ${final.iterations} turns.`);
  return { report, iterations: final.iterations, stopReason };
}
