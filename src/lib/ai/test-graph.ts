import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

export const testGraphState = Annotation.Root({
  instruction: Annotation<string>,
  plan: Annotation<string[]>({
    reducer: (current, update) => update ?? current,
    default: () => [],
  }),
  status: Annotation<"planned" | "needs_review">({
    reducer: (_current, update) => update,
    default: () => "planned",
  }),
});

export const testPlanningGraph = new StateGraph(testGraphState)
  .addNode("create_plan", (state) => ({
    plan: [
      "Establish the target environment",
      `Execute the requested flow: ${state.instruction}`,
      "Verify visible results and capture evidence",
      "Check console and network errors",
    ],
  }))
  .addNode("quality_gate", (state) => ({
    status: state.plan.length >= 3 ? "planned" as const : "needs_review" as const,
  }))
  .addEdge(START, "create_plan")
  .addEdge("create_plan", "quality_gate")
  .addEdge("quality_gate", END)
  .compile();
