import Link from 'next/link';
import Header from '@/components/Header';

export default function NotFound() {
    return (
        <div id="root" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                <h1 style={{ fontSize: '6rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>404</h1>
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Page Not Found</h2>
                <p style={{ fontSize: '1.125rem', color: 'var(--color-text-light)', maxWidth: '500px', marginBottom: '2.5rem' }}>
                    Oops! The page you are looking for doesn't exist or has been moved.
                    Use the link below to get back to removing backgrounds.
                </p>
                <Link href="/" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                    Return to Home
                </Link>
            </main>
            <footer style={{ borderTop: '1px solid var(--color-border)', padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
                &copy; {new Date().getFullYear()} BGGONE. All rights reserved.
            </footer>
        </div>
    );
}
