'use client';

import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface CompareSliderProps {
    original: string;
    processed: string;
}

export default function CompareSlider({ original, processed }: CompareSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle drag for custom slider behavior
    const handleMouseDown = () => setIsResizing(true);

    // Memoize handleMouseUp to be stable for useEffect
    const handleMouseUp = useCallback(() => setIsResizing(false), []);

    const handleMouseMove = (e: ReactMouseEvent | globalThis.MouseEvent) => {
        if (!isResizing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate X relative to the container
        let clientX;
        if ('touches' in e) {
            // For touch events but we are in mouse move? No, this is shared logic or separate?
            // Actually ReactMouseEvent doesn't have touches.
            // We'll separate logic or cast if we reused.
            // Let's stick to simple implementation.
            clientX = (e as unknown as MouseEvent).clientX;
        } else {
            clientX = (e as ReactMouseEvent).clientX;
        }

        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPosition(percent);
    };

    // Touch support
    const handleTouchMove = (e: ReactTouchEvent) => {
        if (!isResizing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPosition(percent);
    };

    useEffect(() => {
        const handleWindowMouseUp = () => handleMouseUp();
        const handleWindowMouseMove = (e: MouseEvent) => {
            if (isResizing && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const percent = (x / rect.width) * 100;
                setSliderPosition(percent);
            }
        };

        window.addEventListener('mouseup', handleWindowMouseUp);
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('touchend', handleWindowMouseUp);
        // Window touch move is acceptable but usually we bind to element for touch.

        return () => {
            window.removeEventListener('mouseup', handleWindowMouseUp);
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('touchend', handleWindowMouseUp);
        };
    }, [isResizing, handleMouseUp]);

    return (
        <div
            ref={containerRef}
            className="compare-container select-none"
            role="slider"
            aria-valuenow={sliderPosition}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Comparison slider"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setSliderPosition(p => Math.max(0, p - 5));
                if (e.key === 'ArrowRight') setSliderPosition(p => Math.min(100, p + 5));
            }}
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
                border: '1px solid var(--color-border)',
                touchAction: 'none' // Important for touch dragging
            }}
            // Events on container for direct interaction
            onMouseMove={(e) => isResizing && handleMouseMove(e)}
            onTouchMove={handleTouchMove}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
        >
            {/* Background Image (Original/Before) */}
            {/* Using standard img for complex comparison logic often easier than next/image for absolute positioning hacks, 
                but create-next-app complains if not next/image. 
                However, for dynamic comparison, standard img with unoptimized can be safer or use unoptimized prop.
            */}
            <img
                src={original}
                alt="Original version"
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
                    alt="Processed version"
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
