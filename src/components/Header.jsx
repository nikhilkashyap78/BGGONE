import logo from '../assets/logo.png';

export default function Header() {
    return (
        <header style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div className="container" style={{ height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text)' }}>
                    <img src={logo} alt="BGGONE Logo" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em' }}>BGGONE</span>
                </a>

                <nav style={{ display: 'flex', gap: '1.5rem' }}>
                    <a href="#" style={{ textDecoration: 'none', color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: '500' }}>Home</a>
                    <a href="#how-it-works" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontSize: '0.875rem', fontWeight: '500' }}>How it Works</a>
                </nav>
            </div>
        </header>
    );
}
