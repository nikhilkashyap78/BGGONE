import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
    return (
        <header style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div className="container" style={{ height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text)' }}>
                    <Image src="/logo.png" alt="BGGONE Logo" width={32} height={32} style={{ borderRadius: '6px' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em' }}>BGGONE</span>
                </Link>

                <nav style={{ display: 'flex', gap: '1.5rem' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: '500' }}>Home</Link>
                    <a href="#how-it-works" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontSize: '0.875rem', fontWeight: '500' }}>How it Works</a>
                </nav>
            </div>
        </header>
    );
}
