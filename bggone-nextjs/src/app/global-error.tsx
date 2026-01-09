'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'red' }}>Global Application Error</h2>
                    <p style={{ marginBottom: '1rem' }}>{error.message}</p>
                    <button onClick={() => reset()} style={{ padding: '0.5rem 1rem', background: 'blue', color: 'white' }}>Try again</button>
                </div>
            </body>
        </html>
    );
}
