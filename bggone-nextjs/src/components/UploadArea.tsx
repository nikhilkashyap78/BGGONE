'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X } from 'lucide-react';

interface UploadAreaProps {
    onFileSelect: (file: File) => void;
}

export default function UploadArea({ onFileSelect }: UploadAreaProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const validateAndProcessFile = (file: File) => {
        setError(null);

        // Validate type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Unsupported file type. Please upload JPG, PNG, or WEBP.');
            return;
        }

        // Validate size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum size is 10MB.');
            return;
        }

        onFileSelect(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndProcessFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndProcessFile(e.target.files[0]);
        }
    };

    return (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', transition: 'all 0.2s' }}>
            <div
                role="button"
                tabIndex={0}
                aria-label="Upload image area"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click();
                    }
                }}
                style={{
                    border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '4rem 2rem',
                    cursor: 'pointer',
                    backgroundColor: isDragging ? '#eff6ff' : 'transparent',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem'
                }}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                }}>
                    <Upload size={32} />
                </div>

                <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Upload an Image to Remove Background</h3>
                    <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
                        Drag & drop or click to upload
                    </p>
                    <button className="btn btn-primary" tabIndex={-1}>
                        Upload Image
                    </button>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                    Supported types: PNG, JPG, WEBP (Max 10MB)
                </p>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                aria-hidden="true"
            />

            {error && (
                <div role="alert" style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}>
                    <X size={18} />
                    {error}
                </div>
            )}
        </div>
    );
}
