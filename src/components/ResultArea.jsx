
import { useState, useRef, useEffect } from 'react';
import { Download, RefreshCcw, Eraser, Check, X, Undo, Redo, ZoomIn, ZoomOut } from 'lucide-react';

export default function ResultArea({ originalImage, processedImage, onReset }) {
    const [isEditing, setIsEditing] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [currentImageBlob, setCurrentImageBlob] = useState(processedImage);
    const [originalUrl, setOriginalUrl] = useState('');
    const [processedUrl, setProcessedUrl] = useState('');

    // History management
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Zoom & Dimensions
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
    const [scaleMode, setScaleMode] = useState('fit'); // 'fit' or 'custom'
    const [tool, setTool] = useState('erase'); // 'erase' or 'restore'

    // Brush Properties
    const [brushHardness, setBrushHardness] = useState(100); // 0-100
    const [brushOpacity, setBrushOpacity] = useState(100); // 0-100

    // Background Replacement
    const [bgConfig, setBgConfig] = useState({
        type: 'transparent', // 'transparent', 'color', 'gradient', 'image'
        value: '', // Hex, gradient string, or url
    });

    // Canvas refs
    // Canvas refs
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const isDrawingRef = useRef(false);
    const originalImgRef = useRef(null); // To store the loaded original image for pattern
    const tipCanvasRef = useRef(document.createElement('canvas')); // Cached brush tip (gradient)
    const prevPosRef = useRef({ x: 0, y: 0 }); // For stroke interpolation

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
        if (isEditing && currentImageBlob) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

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
            setTool('erase'); // Reset tool
            setBrushHardness(100);
            setBrushOpacity(100);
        }
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
        tipCanvas.width = brushSize;
        tipCanvas.height = brushSize;
        const ctx = tipCanvas.getContext('2d');
        const radius = brushSize / 2;

        ctx.clearRect(0, 0, brushSize, brushSize);

        // Create Radial Gradient for Hardness
        const innerRadius = radius * (brushHardness / 100);

        const gradient = ctx.createRadialGradient(radius, radius, innerRadius, radius, radius, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,1)'); // Opaque center
        if (brushHardness < 100) {
            gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Transparent edge
        } else {
            gradient.addColorStop(0.99, 'rgba(0,0,0,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, brushSize, brushSize);

    }, [brushSize, brushHardness]);

    // Drawing Logic Helper: Stamp
    const stampBrush = (x, y) => {
        const ctx = contextRef.current;
        const tipCanvas = tipCanvasRef.current;
        const r = brushSize / 2;
        const topLeftX = x - r;
        const topLeftY = y - r;

        ctx.globalAlpha = brushOpacity / 100; // Apply Opacity

        if (tool === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(tipCanvas, topLeftX, topLeftY);
        } else if (tool === 'restore') {
            // For Restore: We need to mask the Original Image with the Tip
            if (originalImgRef.current) {
                const stampCanvas = document.createElement('canvas'); // Helper canvas
                stampCanvas.width = brushSize;
                stampCanvas.height = brushSize;
                const sCtx = stampCanvas.getContext('2d');

                // 1. Draw Tip (Mask)
                sCtx.drawImage(tipCanvas, 0, 0);

                // 2. Composite Original Image INTO the mask
                sCtx.globalCompositeOperation = 'source-in';
                // Draw relevant slice of original image
                sCtx.drawImage(
                    originalImgRef.current,
                    topLeftX, topLeftY, brushSize, brushSize, // Source Slice
                    0, 0, brushSize, brushSize                // Dest
                );

                // 3. Draw result to Main Canvas
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(stampCanvas, topLeftX, topLeftY);
            }
        }

        ctx.globalAlpha = 1.0; // Reset
    };

    // Drawing handlers
    const startDrawing = ({ nativeEvent }) => {
        if (!contextRef.current) return;
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        prevPosRef.current = { x: offsetX, y: offsetY };
        isDrawingRef.current = true;

        // Stamp start point
        stampBrush(offsetX, offsetY);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawingRef.current || !contextRef.current) return;

        const { offsetX, offsetY } = getCoordinates(nativeEvent);

        // Interpolate stroke
        const dist = Math.hypot(offsetX - prevPosRef.current.x, offsetY - prevPosRef.current.y);
        const step = brushSize * 0.1; // Stamp every 10% of brush size

        if (dist > step) {
            const angle = Math.atan2(offsetY - prevPosRef.current.y, offsetX - prevPosRef.current.x);
            for (let i = 0; i < dist; i += step) {
                const x = prevPosRef.current.x + Math.cos(angle) * i;
                const y = prevPosRef.current.y + Math.sin(angle) * i;
                stampBrush(x, y);
            }
            prevPosRef.current = { x: offsetX, y: offsetY };
        }

        // Always stamp current position
        stampBrush(offsetX, offsetY);
    };

    const stopDrawing = () => {
        if (!contextRef.current || !isDrawingRef.current) return;
        isDrawingRef.current = false; // No need to closePath() as we are stamping
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

        // Limit history size to prevent memory issues (e.g., 20 steps)
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

    const restoreState = (imageData) => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx || !imageData) return;

        // We need to temporarily reset composite operation to put data back
        const globalCompositeOperation = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'source-over';
        ctx.putImageData(imageData, 0, 0);
        // We don't restore globalCompositeOperation here because startDrawing sets it
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

    // Helper to get coordinates relative to canvas, handling scaling if CSS size != pixel size
    const getCoordinates = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            offsetX: (event.clientX - rect.left) * scaleX,
            offsetY: (event.clientY - rect.top) * scaleY
        };
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

        // Helper to load image
        const loadImage = (src) => new Promise((resolve, reject) => {
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
    const cursorRef = useRef(null);

    const updateCursor = (e) => {
        if (!cursorRef.current) return;
        const { clientX, clientY } = e;
        cursorRef.current.style.left = `${clientX}px`;
        cursorRef.current.style.top = `${clientY}px`;

        // Calculate visual scaling of the brush
        // If fit mode: The image is scaled down/up to fit checkboard.
        // We need to know the RATIO of displayed width to natural width.
        // But getting that React-style is hard without LayoutEffect/State reading rect.
        // However, 'getCoordinates' gives us scale factors!
        // But updateCursor runs before we might have these specific scales handy for cursor size?
        // Actually, for cursor visualization, we want screen pixels.
        // BrushSize is in IMAGE pixels.
        // So CursorSize = BrushSize / ScaleFactor. (If 1000px image is shown as 500px, ScaleX = 2. Brush 20px -> 10px screen).

        let visualScale = 1;
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            // scaleX = natural / displayed
            // displayed = natural / scaleX
            // so visual / natural = 1 / scaleX
            visualScale = rect.width / canvasRef.current.width;
        }

        cursorRef.current.style.width = `${brushSize * visualScale}px`;
        cursorRef.current.style.height = `${brushSize * visualScale}px`;
        // Update cursor color based on tool
        cursorRef.current.style.backgroundColor = tool === 'erase'
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(0, 255, 0, 0.2)'; // Green tint for restore
        cursorRef.current.style.borderColor = tool === 'erase' ? 'rgba(0,0,0,0.5)' : 'rgba(0,100,0,0.5)';

        // Show opacity visually
        cursorRef.current.style.opacity = Math.max(0.3, brushOpacity / 100);
    };

    const handleMouseMove = (e) => {
        updateCursor(e);
        draw(e);
    };


    return (
        <div className="fade-in">
            {isEditing ? (
                /* EDIT MODE */
                <div className="card" style={{ padding: '1rem', marginBottom: '2rem' }}>
                    {/* Custom Brush Cursor */}
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
                            display: 'none', // Hidden by default, shown on hover
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem' }}>Refine Image</h3>
                            {/* Tool Selector */}
                            <div className="btn-group" style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem' }}
                                    onClick={handleZoomOut}
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                                    onClick={handleFitScreen}
                                    title="Fit to Screen"
                                >
                                    {scaleMode === 'fit' ? 'Fit' : `${Math.round(zoomLevel * 100)}%`}
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem' }}
                                    onClick={handleZoomIn}
                                    title="Zoom In"
                                >
                                    <ZoomIn size={18} />
                                </button>
                            </div>

                            {/* Undo/Redo Controls */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem', opacity: historyIndex > 0 ? 1 : 0.5 }}
                                    onClick={handleUndo}
                                    disabled={historyIndex <= 0}
                                    title="Undo"
                                >
                                    <Undo size={18} />
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem', opacity: historyIndex < history.length - 1 ? 1 : 0.5 }}
                                    onClick={handleRedo}
                                    disabled={historyIndex >= history.length - 1}
                                    title="Redo"
                                >
                                    <Redo size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* REFINE TOOLS - Always visible in Edit Mode now */}
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {/* Brush Settings: Size, Hardness, Opacity */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', flexDirection: 'column' }}>
                            Size: {brushSize}px
                            <input
                                type="range"
                                min="5"
                                max="100"
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                title="Brush Size"
                                style={{ width: '100px' }}
                            />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', flexDirection: 'column' }}>
                            Hardness: {brushHardness}%
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={brushHardness}
                                onChange={(e) => setBrushHardness(parseInt(e.target.value))}
                                title="Brush Hardness"
                                style={{ width: '100px' }}
                            />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', flexDirection: 'column' }}>
                            Opacity: {brushOpacity}%
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={brushOpacity}
                                onChange={(e) => setBrushOpacity(parseInt(e.target.value))}
                                title="Brush Opacity"
                                style={{ width: '100px' }}
                            />
                        </label>
                    </div>

                    <div className="checkerboard" style={{
                        overflow: 'auto',
                        maxHeight: '600px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', // Flex for container
                        position: 'relative',
                        cursor: 'none', // Hide default cursor
                        // Dynamic Background
                        backgroundColor: bgConfig.type === 'color' ? bgConfig.value : '#fff',
                        backgroundImage: bgConfig.type === 'gradient'
                            ? bgConfig.value
                            : bgConfig.type === 'image'
                                ? `url(${bgConfig.value})`
                                : bgConfig.type === 'color' ? 'none' // Disable checkerboard for solid color
                                    : undefined, // Keep checkerboard for transparent
                        backgroundSize: bgConfig.type === 'image' ? 'cover' : undefined,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                        onMouseEnter={() => { if (cursorRef.current) cursorRef.current.style.display = 'block'; }}
                        onMouseLeave={() => { if (cursorRef.current) cursorRef.current.style.display = 'none'; }}
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={handleMouseMove}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            style={
                                scaleMode === 'fit' ? {
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    margin: 'auto',
                                    display: 'block'
                                } : {
                                    width: `${imgDimensions.width * zoomLevel}px`,
                                    height: 'auto',
                                    margin: 'auto',
                                    display: 'block'
                                }
                            }
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                            <X size={20} /> Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSaveEdit}>
                            <Check size={20} /> Done
                        </button>
                    </div>
                </div>
            ) : (
                /* VIEW MODE - Refactored to Flexbox */
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem', justifyContent: 'center' }}>
                    {/* Original Image */}
                    <div className="card" style={{ padding: '1rem', height: 'auto', flex: '1 1 300px', minWidth: '300px' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-light)' }}>Original Image</h3>
                        <div style={{
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            height: '400px',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* Keep image centered and taking mostly full size but contained */}
                            {originalUrl ? (
                                <img
                                    src={originalUrl}
                                    alt="Original"
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
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
                                    <button
                                        className="btn btn-outline"
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Eraser size={16} /> Refine / Erase
                                    </button>
                                )}
                            </div>

                            {/* Background Controls in View Mode */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Clear */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => setBgConfig({ type: 'transparent', value: '' })} title="Clear Background">
                                        <div style={{ width: 16, height: 16, background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px', backgroundColor: '#fff', border: '1px solid #ddd' }}></div>
                                    </button>
                                </div>

                                <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)' }}></div>

                                {/* Color Section */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Color:</span>
                                    <input
                                        type="color"
                                        value={bgConfig.type === 'color' ? bgConfig.value : '#ffffff'}
                                        onChange={(e) => setBgConfig({ type: 'color', value: e.target.value })}
                                        style={{ width: '24px', height: '24px', padding: 0, border: 'none', cursor: 'pointer' }}
                                        title="Custom Color"
                                    />
                                    {/* Quick Presets */}
                                    {['#ffffff', '#000000', '#ff0000'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setBgConfig({ type: 'color', value: c })}
                                            style={{
                                                width: '20px', height: '20px',
                                                backgroundColor: c,
                                                border: '1px solid #ddd',
                                                cursor: 'pointer',
                                                borderRadius: '4px'
                                            }}
                                            title={c}
                                        />
                                    ))}
                                </div>

                                <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)' }}></div>

                                {/* Image Section */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Image:</span>
                                    <label className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }} title="Upload Background Image">
                                        Upload
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const url = URL.createObjectURL(e.target.files[0]);
                                                    setBgConfig({ type: 'image', value: url });
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="checkerboard" style={{
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            height: '400px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--color-border)',
                            // Dynamic Background
                            backgroundColor: bgConfig.type === 'color' ? bgConfig.value : '#fff',
                            backgroundImage: bgConfig.type === 'gradient'
                                ? bgConfig.value
                                : bgConfig.type === 'image'
                                    ? `url(${bgConfig.value})`
                                    : bgConfig.type === 'color' ? 'none'
                                        : undefined,
                            backgroundSize: bgConfig.type === 'image' ? 'cover' : undefined,
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}>
                            {processedUrl ? (
                                <img
                                    src={processedUrl}
                                    alt="Processed"
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <div className="spinner" style={{ color: 'var(--color-primary)' }}></div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!isEditing && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', paddingBottom: '3rem' }}>
                    <button className="btn btn-outline" onClick={onReset}>
                        <RefreshCcw size={20} />
                        Upload Another
                    </button>
                    <div className="btn-group">
                        <button className="btn btn-primary" onClick={() => handleDownload('png')} disabled={!currentImageBlob}>
                            <Download size={20} style={{ marginRight: '0.5rem' }} /> PNG
                        </button>
                        <button className="btn btn-primary" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }} onClick={() => handleDownload('jpeg')} disabled={!currentImageBlob}>
                            JPG
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
