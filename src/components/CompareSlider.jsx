import { useState, useRef, useEffect } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

export default function CompareSlider({ original, processed }) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);

    // Handle drag for custom slider behavior (better than range input for this specific UI)
    const handleMouseDown = () => setIsResizing(true);

    const handleMouseUp = () => setIsResizing(false);

    const handleMouseMove = (e) => {
        if (!isResizing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPosition(percent);
    };

    // Touch support
    const handleTouchMove = (e) => {
        if (!isResizing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPosition(percent);
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchend', handleMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="compare-container select-none"
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: '800px',
                height: '500px',
                margin: '0 auto',
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem',
                cursor: 'ew-resize',
                backgroundColor: '#f1f5f9',
                border: '1px solid var(--color-border)'
            }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
        >
            {/* Background Image (Original/Before) */}
            <img
                src={original}
                alt="Original"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    zIndex: 10
                }}
            >
                Original
            </div>

            {/* Foreground Image (Processed/After) - Clipped */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                    pointerEvents: 'none'
                }}
            >
                {/* Checkerboard background for transparency */}
                <div className="checkerboard" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -1
                }} />

                <img
                    src={processed}
                    alt="Processed"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        userSelect: 'none'
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        zIndex: 10
                    }}
                >
                    Result
                </div>
            </div>

            {/* Slider Handle */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${sliderPosition}%`,
                    width: '2px',
                    backgroundColor: 'white',
                    cursor: 'ew-resize',
                    zIndex: 20,
                    boxShadow: '0 0 5px rgba(0,0,0,0.5)'
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        color: 'var(--color-primary)'
                    }}
                >
                    <ChevronsLeftRight size={20} />
                </div>
            </div>
        </div>
    );
}
