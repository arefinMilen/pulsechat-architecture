import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
          backgroundColor: '#090d16',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, rgba(99, 102, 241, 0.15) 2%, transparent 0%)',
          backgroundSize: '50px 50px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '40px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            background: 'rgba(99, 102, 241, 0.2)',
            padding: '8px 24px',
            borderRadius: '999px',
            border: '1px solid rgba(99, 102, 241, 0.4)',
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#818cf8' }}>
            PulseChat Architecture Showcase
          </span>
        </div>

        <h1
          style={{
            fontSize: '54px',
            fontWeight: 800,
            textAlign: 'center',
            background: 'linear-gradient(to bottom, #ffffff, #94a3b8)',
            backgroundClip: 'text',
            color: 'transparent',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Enterprise Real-Time Messaging Engine
        </h1>

        <p
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            textAlign: 'center',
            marginTop: '20px',
            maxWidth: '900px',
          }}
        >
          Next.js 15 • Socket.io WebSockets • Optimistic State Reconciliation • Precision Scroll Lock
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
