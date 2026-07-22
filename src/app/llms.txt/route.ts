import { AI_POLICY_TEXT, aiPolicyResponse } from "@/lib/aiPolicy";

export const dynamic = "force-static";

/** Same opt-out under the `llms.txt` convention some agents look for. */
export function GET() {
  return aiPolicyResponse(AI_POLICY_TEXT);
}
