import Link from 'next/link';

export default function ConfirmPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Authentication Confirmed</h1>
      <p>Your magic link was successful. You can resume using TrustChat.</p>
      <Link href="/">Return to Home</Link>
    </div>
  )
}
