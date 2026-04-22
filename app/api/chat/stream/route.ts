import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

export async function POST() {
  const stream = new ReadableStream({
    async start(controller) {
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const send = (data: unknown) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const events = [
        {"type":"stage_update","stage":"parse_prompt","message":"reading your question…","keywords":[],"elapsed_ms":0},
        {"type":"stage_update","stage":"dispatch_llm","message":"asking the LLM. Trinity is thinking too…","keywords":[],"elapsed_ms":250},
        {"type":"stage_update","stage":"evidence_check","message":"checking the evidence behind the claim…","keywords":[],"elapsed_ms":500},
        {"type":"stage_update","stage":"certainty_measure","message":"weighing how confident it's pretending to be…","keywords":[],"elapsed_ms":750},
        {"type":"stage_update","stage":"uncertainty_measure","message":"measuring the genuine fog around this topic…","keywords":[],"elapsed_ms":1000},
        {"type":"stage_update","stage":"harm_assessment","message":"considering if being wrong here would hurt…","keywords":[],"elapsed_ms":1250},
        {"type":"stage_update","stage":"scope_check","message":"testing if it's talking past its training…","keywords":[],"elapsed_ms":1500},
        {"type":"stage_update","stage":"dissonance_calc","message":"running the dissonance check…","keywords":[],"elapsed_ms":1750},
        {"type":"stage_update","stage":"verdict_assembly","message":"almost done — HAL is making the call.","keywords":[],"elapsed_ms":2000},
        {"type":"llm_token","token":"Mock answer streaming..."},
        {"type":"signals_complete","signals":{"evidence_quality":0.72,"certainty_at_claim":0.91,"epistemic_uncertainty":0.34,"harm_probability":0.15,"scope_appropriateness":0.68}},
        {"type":"verdict","verdict":"HALLUCINATION_CAUGHT","dissonance_tier":"high","hal_answer":"Mock HAL corrective answer.","repid_delta":12},
        {"type":"complete","catch_uuid":uuidv4()}
      ];

      for (let i = 0; i < events.length; i++) {
        send(events[i]);
        if (i < 9) await wait(250);
        else await wait(100);
      }
      controller.close();
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
