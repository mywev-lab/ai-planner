import { AI_POLICY_TEXT, aiPolicyResponse } from "@/lib/aiPolicy";

export const dynamic = "force-static";

/** Machine-readable opt-out for AI crawlers and dataset builders. */
export function GET() {
  return aiPolicyResponse(AI_POLICY_TEXT);
}
