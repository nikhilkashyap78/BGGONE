'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import UploadArea from '@/components/UploadArea';
import ResultArea from '@/components/ResultArea';
import { removeBackground } from './utils/backgroundRemover';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setOriginalImage(file);
    setIsProcessing(true);
    setProcessedImage(null);
    setError(null);

    try {
      const resultBlob = await removeBackground(file);
      setProcessedImage(resultBlob);
    } catch (err) {
      console.error(err);
      setError("Failed to process image. Please try again.");
      setOriginalImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div id="root">
      <Header />
      <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* ... existing main content ... */}
        {/* Skip link for accessibility */}
        <a href="#main-content" className="skip-to-main">Skip to content</a>

        <div id="main-content">
          {!originalImage && (
            <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="fade-in">
              <h1 style={{ background: 'linear-gradient(to right, #1e293b, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                Remove Image Background <br /> Instantly
              </h1>
              <p style={{ fontSize: '1.25rem', color: 'var(--color-text-light)', maxWidth: '600px', margin: '1.5rem auto 0' }}>
                Free, 100% automatic, and high-quality. Just upload your image and get a transparent PNG in seconds.
              </p>
            </div>
          )}

          <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            {error && (
              <div role="alert" style={{ padding: '1rem', marginBottom: '2rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {!originalImage ? (
              <UploadArea onFileSelect={handleFileSelect} />
            ) : (
              <ResultArea
                originalImage={originalImage}
                processedImage={processedImage}
                onReset={handleReset}
              />
            )}
          </div>

          {!originalImage && (
            <>
              <section id="how-it-works" style={{ marginTop: '6rem', textAlign: 'center' }} className="fade-in">
                <h2 style={{ marginBottom: '3rem' }}>How it Works</h2>
                <div className="grid-auto-fit">
                  <div className="card" style={{ padding: '2.5rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>1</div>
                    <h3 style={{ marginBottom: '1rem' }}>Upload Image</h3>
                    <p style={{ color: 'var(--color-text-light)' }}>Drag & drop or click to upload your image (JPG, PNG, WEBP).</p>
                  </div>
                  <div className="card" style={{ padding: '2.5rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>2</div>
                    <h3 style={{ marginBottom: '1rem' }}>Auto Process</h3>
                    <p style={{ color: 'var(--color-text-light)' }}>Our AI automatically detects and removes the background instantly.</p>
                  </div>
                  <div className="card" style={{ padding: '2.5rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>3</div>
                    <h3 style={{ marginBottom: '1rem' }}>Download</h3>
                    <p style={{ color: 'var(--color-text-light)' }}>Get your transparent PNG image ready for use.</p>
                  </div>
                </div>
              </section>

              <section id="faq" style={{ marginTop: '6rem', marginBottom: '3rem', maxWidth: '800px', margin: '6rem auto 3rem' }} className="fade-in">
                <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Frequently Asked Questions</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <article>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Is BGGONE free to use?</h3>
                    <p style={{ color: 'var(--color-text-light)' }}>Yes, BGGONE is a 100% free background remover tool. You can process unlimited images without any hidden costs or subscriptions.</p>
                  </article>

                  <article>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>How do I make a transparent PNG?</h3>
                    <p style={{ color: 'var(--color-text-light)' }}>Simply upload your image (JPG, PNG, or WEBP) to our tool. Our AI will automatically remove the background, allowing you to download a high-quality transparent PNG instantly.</p>
                  </article>

                  <article>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Do you store my images?</h3>
                    <p style={{ color: 'var(--color-text-light)' }}>No, we process images locally in your browser using secure WebAssembly technology. Your photos never leave your device, ensuring maximum privacy.</p>
                  </article>

                  <article>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>What image formats are supported?</h3>
                    <p style={{ color: 'var(--color-text-light)' }}>We support common image formats including JPG, JPEG, PNG, and WEBP. The tool works best on images with clear subjects like people, animals, or products.</p>
                  </article>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '3rem 0', marginTop: 'auto', backgroundColor: '#fff' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
          <div>&copy; {new Date().getFullYear()} BGGONE. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="#" style={{ color: 'inherit' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'inherit' }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
