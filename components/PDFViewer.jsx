import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import styles from '../styles/ObjectPreview.module.css';

// Set up the worker for PDF.js - use a local worker file
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

const PDFViewer = ({ url }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Log the URL for debugging
  useEffect(() => {
    console.log('PDFViewer received URL:', url);
  }, [url]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. The file might not be accessible.');
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));
  };

  // If URL is not provided or invalid, show error
  if (!url || typeof url !== 'string') {
    return (
      <div className={styles.error}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
        </svg>
        <p>Invalid PDF URL provided.</p>
      </div>
    );
  }

  return (
    <div className={styles.pdfViewer}>
      <div className={styles.pdfControls}>
        <button 
          onClick={goToPrevPage} 
          disabled={pageNumber <= 1 || loading}
          className={styles.pdfButton}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.pdfButtonIcon}>
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <span className={styles.pdfPageInfo}>
          {loading ? 'Loading...' : `Page ${pageNumber} of ${numPages}`}
        </span>
        <button 
          onClick={goToNextPage} 
          disabled={pageNumber >= (numPages || 1) || loading}
          className={styles.pdfButton}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.pdfButtonIcon}>
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>

      {error ? (
        <div className={styles.error}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
          </svg>
          <p>{error}</p>
          <a 
            href={url} 
            className={styles.downloadLink} 
            target="_blank" 
            rel="noopener noreferrer"
            download
          >
            Download the PDF instead
          </a>
        </div>
      ) : (
        <div className={styles.pdfContainer}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading PDF...</p>
            </div>
          )}
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null} // We're handling loading state ourselves
            options={{
              cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
              cMapPacked: true,
            }}
          >
            {numPages > 0 && (
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className={styles.pdfPage}
                width={300} // Fixed width instead of dynamic calculation
              />
            )}
          </Document>
        </div>
      )}
    </div>
  );
};

export default PDFViewer; 