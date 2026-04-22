import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const question = `Mock question ${uuid} for OG image`;
    const verdict = "HALLUCINATION_CAUGHT" as string;
    const color = verdict === "TRUTH_VERIFIED" ? "#28a745" : verdict === "HALLUCINATION_CAUGHT" ? "#d73a49" : "#f5c518";

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center', color: '#333' }}>
            {question}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: color, color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '32px', fontWeight: 'bold' }}>
            {verdict.replace(/_/g, ' ')}
          </div>
          <div style={{ position: 'absolute', bottom: '40px', right: '40px', fontSize: '24px', color: '#888' }}>
            trustchat.dev
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
