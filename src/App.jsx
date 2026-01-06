import { useState } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import ResultArea from './components/ResultArea';
import { removeBackground } from './utils/backgroundRemover';

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (file) => {
    setOriginalImage(file);
    setIsProcessing(true);
    setProcessedImage(null);
    setError(null);

    try {
      // Process the image
      const resultBlob = await removeBackground(file);
      setProcessedImage(resultBlob);
    } catch (err) {
      console.error(err);
      setError("Failed to process image. Please try again.");
      setOriginalImage(null); // Reset on error so user can try again
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
    <>
      <Header />

      <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Hero Text */}
        {!originalImage && (
          <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="fade-in">
            <h1 style={{ fontSize: '3rem', lineHeight: '1.2', marginBottom: '1.5rem', background: 'linear-gradient(to right, #1e293b, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Remove Image Background <br /> Instantly
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--color-text-light)', maxWidth: '600px', margin: '0 auto' }}>
              Free, 100% automatic, and high-quality. Just upload your image and get a transparent PNG in seconds.
            </p>
          </div>
        )}

        {/* content area */}
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
          {error && (
            <div style={{ padding: '1rem', marginBottom: '2rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
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

          {/* Loading Overlay if processing but not yet in result area fully populated (actually handled by ResultArea spinner, but we can add global loading if we want different UX)
              Here we just switch to ResultArea immediately and let it show loading spinner.
          */}
        </div>

        {/* How it Works Section */}
        {!originalImage && (
          <div id="how-it-works" style={{ marginTop: '5rem', textAlign: 'center' }} className="fade-in">
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>How it Works</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontWeight: 'bold' }}>1</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Upload Image</h3>
                <p style={{ color: 'var(--color-text-light)' }}>Drag & drop or click to upload your image (JPG, PNG, WEBP).</p>
              </div>
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontWeight: 'bold' }}>2</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Auto Process</h3>
                <p style={{ color: 'var(--color-text-light)' }}>Our AI automatically detects and removes the background instantly.</p>
              </div>
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontWeight: 'bold' }}>3</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Download</h3>
                <p style={{ color: 'var(--color-text-light)' }}>Get your transparent PNG image ready for use.</p>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section for SEO */}
        {!originalImage && (
          <div style={{ marginTop: '5rem', marginBottom: '3rem', textAlign: 'left', maxWidth: '800px', margin: '5rem auto 3rem' }} className="fade-in">
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Frequently Asked Questions</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Is BGGONE free to use?</h3>
              <p style={{ color: 'var(--color-text-light)' }}>Yes, BGGONE is a 100% free background remover tool. You can process unlimited images without any hidden costs or subscriptions.</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>How do I make a transparent PNG?</h3>
              <p style={{ color: 'var(--color-text-light)' }}>Simply upload your image (JPG, PNG, or WEBP) to our tool. Our AI will automatically remove the background, allowing you to download a high-quality transparent PNG instantly.</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Do you store my images?</h3>
              <p style={{ color: 'var(--color-text-light)' }}>No, we process images locally in your browser using secure WebAssembly technology. Your photos never leave your device, ensuring maximum privacy.</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>What image formats are supported?</h3>
              <p style={{ color: 'var(--color-text-light)' }}>We support common image formats including JPG, JPEG, PNG, and WEBP. The tool works best on images with clear subjects like people, animals, or products.</p>
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '2rem 0', marginTop: 'auto', backgroundColor: '#fff' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
          <div>&copy; {new Date().getFullYear()} BGGONE. All rights reserved.</div>

        </div>
      </footer>
    </>
  );
}

export default App;
