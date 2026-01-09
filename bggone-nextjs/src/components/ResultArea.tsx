'use client';

import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { RefreshCcw, Eraser, Check, X, Undo, Redo, ZoomIn, ZoomOut, Download } from 'lucide-react';
import CompareSlider from './CompareSlider';
/* eslint-disable @next/next/no-img-element */

interface ResultAreaProps {
    originalImage: File;
    processedImage: Blob | null;
    onReset: () => void;
}

interface BgConfig {
    type: 'transparent' | 'color' | 'gradient' | 'image';
    value: string;
}

export default function ResultArea({ originalImage, processedImage, onReset }: ResultAreaProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<'side-by-side' | 'compare'>('side-by-side');
    const [brushSize, setBrushSize] = useState(20);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [currentImageBlob, setCurrentImageBlob] = useState<Blob | null>(processedImage);
    const [originalUrl, setOriginalUrl] = useState('');
    const [processedUrl, setProcessedUrl] = useState('');

    // History management
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Zoom & Dimensions
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
    const [scaleMode, setScaleMode] = useState<'fit' | 'custom'>('fit');
    const [tool, setTool] = useState<'erase' | 'restore'>('erase');

    // Brush Properties
    const [brushHardness, setBrushHardness] = useState(100); // 0-100
    const [brushOpacity, setBrushOpacity] = useState(100); // 0-100

    // Background Replacement
    const [bgConfig, setBgConfig] = useState<BgConfig>({
        type: 'transparent',
        value: '',
    });

    // Canvas refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawingRef = useRef(false);
    const originalImgRef = useRef<HTMLImageElement | null>(null);
    const tipCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const prevPosRef = useRef({ x: 0, y: 0 });

    // Initialize tip canvas once
    useEffect(() => {
        if (typeof document !== 'undefined') {
            tipCanvasRef.current = document.createElement('canvas');
        }
    }, []);

    // Memoize and cleanup URLs
    useEffect(() => {
        if (originalImage) {
            const url = URL.createObjectURL(originalImage);
            setOriginalUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setOriginalUrl('');
        }
    }, [originalImage]);

    useEffect(() => {
        if (currentImageBlob) {
            const url = URL.createObjectURL(currentImageBlob);
            setProcessedUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setProcessedUrl('');
        }
    }, [currentImageBlob]);

    // Update local state when prop changes
    useEffect(() => {
        setCurrentImageBlob(processedImage);
    }, [processedImage]);

    // Initialize Canvas when entering edit mode
    useEffect(() => {
        if (isEditing && currentImageBlob && typeof window !== 'undefined') {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Load original image for Restore pattern
            if (originalImage) {
                const origImg = new Image();
                origImg.src = URL.createObjectURL(originalImage);
                origImg.onload = () => {
                    originalImgRef.current = origImg;
                };
            }

            const img = new Image();
            img.src = URL.createObjectURL(currentImageBlob);
            img.onload = () => {
                // Store natural dimensions
                setImgDimensions({ width: img.width, height: img.height });
                // Default to fit
                setScaleMode('fit');

                // Set canvas size to image size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Set up drawing styles
                contextRef.current = ctx;

                // Save initial state
                if (history.length === 0) {
                    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    setHistory([initialState]);
                    setHistoryIndex(0);
                }
            };
        } else {
            // Reset history when exiting
            setHistory([]);
            setHistoryIndex(-1);
            setZoomLevel(1);
            setScaleMode('fit');
            setTool('erase');
            setBrushHardness(100);
            setBrushOpacity(100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, currentImageBlob, originalImage]);

    // Reset Background and other state only when a NEW image is loaded
    useEffect(() => {
        setBgConfig({ type: 'transparent', value: '' });
        setHistory([]);
        setHistoryIndex(-1);
        setZoomLevel(1);
        setTool('erase');
    }, [originalImage]);

    // Update Brush Tip (Gradient) when Size or Hardness changes
    useEffect(() => {
        const tipCanvas = tipCanvasRef.current;
        if (!tipCanvas) return;

        tipCanvas.width = brushSize;
        tipCanvas.height = brushSize;
        const ctx = tipCanvas.getContext('2d');
        if (!ctx) return;

        const radius = brushSize / 2;

        ctx.clearRect(0, 0, brushSize, brushSize);

        if (brushHardness >= 100) {
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.beginPath();
            ctx.arc(radius, radius, radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const innerRadius = radius * (brushHardness / 100);
            const gradient = ctx.createRadialGradient(radius, radius, innerRadius, radius, radius, radius);

            gradient.addColorStop(0, 'rgba(0,0,0,1)'); // Opaque center
            gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Transparent edge

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, brushSize, brushSize);
        }

    }, [brushSize, brushHardness]);

    // Drawing Logic Helper: Stamp
    const stampBrush = (x: number, y: number) => {
        const ctx = contextRef.current;
        const tipCanvas = tipCanvasRef.current;
        if (!ctx || !tipCanvas) return;

        const r = brushSize / 2;
        const topLeftX = x - r;
        const topLeftY = y - r;

        ctx.globalAlpha = brushOpacity / 100;

        if (tool === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(tipCanvas, topLeftX, topLeftY);
        } else if (tool === 'restore') {
            if (originalImgRef.current) {
                const stampCanvas = document.createElement('canvas'); // Helper canvas
                stampCanvas.width = brushSize;
                stampCanvas.height = brushSize;
                const sCtx = stampCanvas.getContext('2d');
                if (!sCtx) return;

                // 1. Draw Tip (Mask)
                sCtx.drawImage(tipCanvas, 0, 0);

                // 2. Composite Original Image INTO the mask
                sCtx.globalCompositeOperation = 'source-in';
                sCtx.drawImage(
                    originalImgRef.current,
                    topLeftX, topLeftY, brushSize, brushSize,
                    0, 0, brushSize, brushSize
                );

                // 3. Draw result to Main Canvas
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(stampCanvas, topLeftX, topLeftY);
            }
        }

        ctx.globalAlpha = 1.0;
    };

    // Helper to get coordinates relative to canvas
    const getCoordinates = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            offsetX: (clientX - rect.left) * scaleX,
            offsetY: (clientY - rect.top) * scaleY
        };
    };

    // Drawing handlers
    const startDrawing = (e: ReactMouseEvent<HTMLCanvasElement>) => {
        if (!contextRef.current) return;
        const { offsetX, offsetY } = getCoordinates(e.clientX, e.clientY);
        prevPosRef.current = { x: offsetX, y: offsetY };
        isDrawingRef.current = true;

        // Stamp start point
        stampBrush(offsetX, offsetY);
    };

    const draw = (e: ReactMouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || !contextRef.current) return;

        const { offsetX, offsetY } = getCoordinates(e.clientX, e.clientY);

        // Interpolate stroke
        const dist = Math.hypot(offsetX - prevPosRef.current.x, offsetY - prevPosRef.current.y);
        const step = brushSize * 0.1;

        if (dist > step) {
            const angle = Math.atan2(offsetY - prevPosRef.current.y, offsetX - prevPosRef.current.x);
            for (let i = 0; i < dist; i += step) {
                const x = prevPosRef.current.x + Math.cos(angle) * i;
                const y = prevPosRef.current.y + Math.sin(angle) * i;
                stampBrush(x, y);
            }
            prevPosRef.current = { x: offsetX, y: offsetY };
        }

        stampBrush(offsetX, offsetY);
    };

    const stopDrawing = () => {
        if (!contextRef.current || !isDrawingRef.current) return;
        isDrawingRef.current = false;
        saveToHistory();
    };

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        const newState = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // If we are in the middle of history, discard future states
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);

        // Limit history size
        if (newHistory.length > 20) {
            newHistory.shift();
        }

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            restoreState(history[newIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            restoreState(history[newIndex]);
        }
    };

    const restoreState = (imageData: ImageData) => {
        const ctx = contextRef.current;
        if (!ctx || !imageData) return;

        // We need to temporarily reset composite operation to put data back
        // const globalCompositeOperation = ctx.globalCompositeOperation; // unused
        ctx.globalCompositeOperation = 'source-over';
        ctx.putImageData(imageData, 0, 0);
    };

    const handleZoomIn = () => {
        setScaleMode('custom');
        setZoomLevel(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setScaleMode('custom');
        setZoomLevel(prev => Math.max(prev - 0.25, 0.25));
    };

    const handleFitScreen = () => {
        setScaleMode('fit');
        setZoomLevel(1);
    };

    const handleSaveEdit = () => {
        if (canvasRef.current) {
            canvasRef.current.toBlob((blob) => {
                setCurrentImageBlob(blob);
                setIsEditing(false);
            }, 'image/png');
        }
    };

    const handleDownload = async (format = 'png') => {
        if (!currentImageBlob) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Helper to load image
        const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });

        try {
            // Load Foreground
            const fgImg = await loadImage(URL.createObjectURL(currentImageBlob));

            // Set canvas size
            canvas.width = fgImg.width;
            canvas.height = fgImg.height;

            // 1. Draw Background
            if (bgConfig.type === 'color') {
                ctx.fillStyle = bgConfig.value;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (bgConfig.type === 'gradient') {
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                // Mapping presets
                if (bgConfig.value.includes('#ff7e5f')) { gradient.addColorStop(0, '#ff7e5f'); gradient.addColorStop(1, '#feb47b'); }
                else if (bgConfig.value.includes('#43e97b')) { gradient.addColorStop(0, '#43e97b'); gradient.addColorStop(1, '#38f9d7'); }
                else if (bgConfig.value.includes('#00c6ff')) { gradient.addColorStop(0, '#00c6ff'); gradient.addColorStop(1, '#0072ff'); }
                else if (bgConfig.value.includes('#f83600')) { gradient.addColorStop(0, '#f83600'); gradient.addColorStop(1, '#f9d423'); }
                else {
                    ctx.fillStyle = '#ffffff'; // default
                }

                if (bgConfig.value.includes('gradient')) {
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            } else if (bgConfig.type === 'image' && bgConfig.value) {
                try {
                    const bgImg = await loadImage(bgConfig.value);
                    // Draw cover style
                    const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
                    const x = (canvas.width / 2) - (bgImg.width / 2) * scale;
                    const y = (canvas.height / 2) - (bgImg.height / 2) * scale;
                    ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
                } catch (e) {
                    console.error("Failed to load background image for export", e);
                }
            }

            // 2. Draw Foreground
            ctx.drawImage(fgImg, 0, 0);

            // 3. Export
            const link = document.createElement('a');
            link.download = `removed-bg.${format}`;
            link.href = canvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Export failed", error);
        }
    };

    // Cursor handling
    const cursorRef = useRef<HTMLDivElement>(null);

    const updateCursor = (clientX: number, clientY: number) => {
        if (!cursorRef.current) return;
        cursorRef.current.style.left = `${clientX}px`;
        cursorRef.current.style.top = `${clientY}px`;

        let visualScale = 1;
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            visualScale = rect.width / canvasRef.current.width;
        }

        cursorRef.current.style.width = `${brushSize * visualScale}px`;
        cursorRef.current.style.height = `${brushSize * visualScale}px`;
        cursorRef.current.style.backgroundColor = tool === 'erase'
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(0, 255, 0, 0.2)';
        cursorRef.current.style.borderColor = tool === 'erase' ? 'rgba(0,0,0,0.5)' : 'rgba(0,100,0,0.5)';
        cursorRef.current.style.opacity = Math.max(0.3, brushOpacity / 100).toString();
    };

    const handleMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
        updateCursor(e.clientX, e.clientY);
        draw(e);
    };


    // Touch Handling (Basic mapping)
    const handleTouchStart = (e: ReactTouchEvent<HTMLCanvasElement>) => {
        if (!contextRef.current) return;
        // e.preventDefault(); // In React touch events are passive by default, can't preventDefault easily here w/o ref listener but CSS touch-action: none handles it.
        const touch = e.touches[0];
        const { offsetX, offsetY } = getCoordinates(touch.clientX, touch.clientY);
        prevPosRef.current = { x: offsetX, y: offsetY };
        isDrawingRef.current = true;
        stampBrush(offsetX, offsetY);
    };

    const handleTouchMove = (e: ReactTouchEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || !contextRef.current) return;
        const touch = e.touches[0];

        if (cursorRef.current) {
            // For touch we might want to hide cursor or show it under finger?
            updateCursor(touch.clientX, touch.clientY);
            cursorRef.current.style.display = 'block';
        }

        const { offsetX, offsetY } = getCoordinates(touch.clientX, touch.clientY);

        const dist = Math.hypot(offsetX - prevPosRef.current.x, offsetY - prevPosRef.current.y);
        const step = brushSize * 0.1;

        if (dist > step) {
            const angle = Math.atan2(offsetY - prevPosRef.current.y, offsetX - prevPosRef.current.x);
            for (let i = 0; i < dist; i += step) {
                const x = prevPosRef.current.x + Math.cos(angle) * i;
                const y = prevPosRef.current.y + Math.sin(angle) * i;
                stampBrush(x, y);
            }
            prevPosRef.current = { x: offsetX, y: offsetY };
        }
        stampBrush(offsetX, offsetY);
    };

    const handleTouchEnd = () => {
        if (cursorRef.current) cursorRef.current.style.display = 'none';
        stopDrawing();
    };

    return (
        <div className="fade-in">
            {isEditing ? (
                /* EDIT MODE */
                <div className="card" style={{ padding: '1rem', marginBottom: '2rem' }}>
                    <div
                        ref={cursorRef}
                        style={{
                            position: 'fixed',
                            pointerEvents: 'none',
                            transform: 'translate(-50%, -50%)',
                            border: '1px solid rgba(0,0,0,0.5)',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            zIndex: 9999,
                            display: 'none',
                        }}
                    />

                    <div className="flex-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem' }}>Refine Image</h3>
                            {/* Tool Selector */}
                            <div className="btn-group">
                                <button
                                    className={`btn ${tool === 'erase' ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ borderRadius: 0, padding: '0.5rem 1rem' }}
                                    onClick={() => setTool('erase')}
                                >
                                    <Eraser size={16} style={{ marginRight: '0.5rem' }} /> Erase
                                </button>
                                <button
                                    className={`btn ${tool === 'restore' ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ borderRadius: 0, padding: '0.5rem 1rem' }}
                                    onClick={() => setTool('restore')}
                                >
                                    <RefreshCcw size={16} style={{ marginRight: '0.5rem' }} /> Restore
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            {/* Zoom Controls */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={18} /></button>
                                <button className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} onClick={handleFitScreen} title="Fit to Screen">
                                    {scaleMode === 'fit' ? 'Fit' : `${Math.round(zoomLevel * 100)}%`}
                                </button>
                                <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={handleZoomIn} title="Zoom In"><ZoomIn size={18} /></button>
                            </div>

                            {/* Undo/Redo Controls */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-outline" style={{ padding: '0.5rem', opacity: historyIndex > 0 ? 1 : 0.5 }} onClick={handleUndo} disabled={historyIndex <= 0} title="Undo"><Undo size={18} /></button>
                                <button className="btn btn-outline" style={{ padding: '0.5rem', opacity: historyIndex < history.length - 1 ? 1 : 0.5 }} onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo"><Redo size={18} /></button>
                            </div>
                        </div>
                    </div>

                    {/* REFINE TOOLS */}
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', flexDirection: 'column' }}>
                            Size: {brushSize}px
                            <input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} style={{ width: '100px' }} />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', flexDirection: 'column' }}>
                            Hardness: {brushHardness}%
                            <input type="range" min="0" max="100" value={brushHardness} onChange={(e) => setBrushHardness(parseInt(e.target.value))} style={{ width: '100px' }} />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', flexDirection: 'column' }}>
                            Opacity: {brushOpacity}%
                            <input type="range" min="1" max="100" value={brushOpacity} onChange={(e) => setBrushOpacity(parseInt(e.target.value))} style={{ width: '100px' }} />
                        </label>
                    </div>

                    <div className="checkerboard" style={{
                        overflow: 'auto',
                        width: '100%',
                        maxWidth: '600px',
                        margin: '0 auto',
                        aspectRatio: '1 / 1',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        position: 'relative',
                        cursor: 'none',
                        backgroundColor: '#f1f5f9',
                        touchAction: 'none'
                    }}
                        onMouseEnter={() => { if (cursorRef.current) cursorRef.current.style.display = 'block'; }}
                        onMouseLeave={() => { if (cursorRef.current) cursorRef.current.style.display = 'none'; }}
                    >
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={handleMouseMove}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                style={{
                                    maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block',
                                    backgroundImage: bgConfig.type === 'image' ? `url(${bgConfig.value})` : undefined,
                                    backgroundColor: bgConfig.type === 'color' ? bgConfig.value : (bgConfig.type === 'transparent' ? undefined : '#fff'),
                                    backgroundSize: 'cover',
                                    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={() => setIsEditing(false)}><X size={20} /> Cancel</button>
                        <button className="btn btn-primary" onClick={handleSaveEdit}><Check size={20} /> Done</button>
                    </div>
                </div>
            ) : (
                /* VIEW MODE */
                <div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                        <div className="btn-group">
                            <button
                                style={{ padding: '0.5rem 1rem', backgroundColor: viewMode === 'side-by-side' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'side-by-side' ? '#fff' : 'var(--color-text)', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                onClick={() => setViewMode('side-by-side')}
                            >
                                Side by Side
                            </button>
                            <button
                                style={{ padding: '0.5rem 1rem', backgroundColor: viewMode === 'compare' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'compare' ? '#fff' : 'var(--color-text)', border: 'none', cursor: 'pointer', fontWeight: 500, borderLeft: '1px solid var(--color-border)' }}
                                onClick={() => setViewMode('compare')}
                            >
                                Compare Slider
                            </button>
                        </div>
                    </div>

                    {viewMode === 'compare' ? (
                        <CompareSlider original={originalUrl} processed={processedUrl} />
                    ) : (
                        <div className="flex-wrap" style={{ gap: '2rem', marginBottom: '3rem', justifyContent: 'center' }}>
                            {/* Original Image */}
                            <div className="card" style={{ padding: '1rem', height: 'auto', flex: '1 1 300px', minWidth: '300px' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-light)' }}>Original Image</h3>
                                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '400px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {originalUrl ? (
                                        <img src={originalUrl} alt="Original" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{ color: 'var(--color-text-light)' }}>Loading...</div>
                                    )}
                                </div>
                            </div>

                            {/* Processed Image */}
                            <div className="card" style={{ padding: '1rem', height: 'auto', flex: '1 1 300px', minWidth: '300px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', color: 'var(--color-text-light)', margin: 0 }}>Background Removed</h3>
                                        {processedImage && (
                                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => setIsEditing(true)}>
                                                <Eraser size={16} /> Refine / Erase
                                            </button>
                                        )}
                                    </div>

                                    {/* Background Controls */}
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => setBgConfig({ type: 'transparent', value: '' })} title="Clear Background">
                                            <div style={{ width: 16, height: 16, background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px', backgroundColor: '#fff', border: '1px solid #ddd' }}></div>
                                        </button>
                                        <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)' }}></div>
                                        <input type="color" value={bgConfig.type === 'color' ? bgConfig.value : '#ffffff'} onChange={(e) => setBgConfig({ type: 'color', value: e.target.value })} style={{ width: '24px', height: '24px', padding: 0, border: 'none', cursor: 'pointer' }} title="Custom Color" />
                                        {/* Quick Presets */}
                                        {['#ffffff', '#000000', '#ff0000'].map(c => (
                                            <button key={c} onClick={() => setBgConfig({ type: 'color', value: c })} style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: c, border: '1px solid #ddd', cursor: 'pointer' }} title={c} />
                                        ))}
                                    </div>
                                </div>

                                <div className="checkerboard" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {/* Dynamic Background */}
                                    <div style={{
                                        position: 'absolute', inset: 0, zIndex: 0,
                                        backgroundColor: bgConfig.type === 'color' ? bgConfig.value : undefined,
                                        backgroundImage: bgConfig.type === 'image'
                                            ? `url(${bgConfig.value})`
                                            : (bgConfig.type === 'gradient' ? bgConfig.value : undefined),
                                        backgroundSize: 'cover'
                                    }} />

                                    {processedUrl ? (
                                        <img src={processedUrl} alt="Background Removed" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                                    ) : (
                                        <div className="spinner" style={{ color: 'var(--color-primary)' }} />
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleDownload('png')}>
                                        <Download size={16} /> Download PNG
                                    </button>
                                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleDownload('jpeg')}>
                                        <Download size={16} /> Download JPG
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button className="btn btn-ghost" onClick={onReset}>
                            <RefreshCcw size={16} style={{ marginRight: '0.5rem' }} /> Process Another Image
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
