import { useState, useEffect } from 'react';
import styles from '../styles/ObjectPreview.module.css';
import dynamic from 'next/dynamic';

// Use dynamic import for PDFViewer to ensure it only loads on the client side
const PDFViewer = dynamic(
  () => import('./PDFViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading PDF viewer...</p>
      </div>
    )
  }
);

export default function ObjectPreview({ objectname, downloadUrl, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [objectType, setObjectType] = useState('unknown');

  useEffect(() => {
    if (!objectname || !downloadUrl) return;

    const determineObjectType = () => {
      const extension = objectname.split('.').pop().toLowerCase();
      
      // Image types
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return 'image';
      }
      
      // Video types
      if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
        return 'video';
      }
      
      // Audio types
      if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
        return 'audio';
      }
      
      // PDF
      if (extension === 'pdf') {
        return 'pdf';
      }
      
      // Text files
      if (['txt', 'md', 'json', 'csv', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'rs', 'toml'].includes(extension)) {
        return 'text';
      }
      
      // Code files
      if (['rs', 'py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'c', 'cpp', 'h', 'java', 'go', 'rb', 'php'].includes(extension)) {
        return 'code';
      }
      
      return 'unknown';
    };

    const fetchContent = async () => {
      try {
        setLoading(true);
        const type = determineObjectType();
        setObjectType(type);
        
        // Log the download URL for debugging
        console.log('Fetching content from URL:', downloadUrl);
        
        if (type === 'text' || type === 'code') {
          try {
            const response = await fetch(downloadUrl);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch object: ${response.status} ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('Content fetched successfully, length:', text.length);
            setContent(text);
          } catch (fetchError) {
            console.error('Error fetching text content:', fetchError);
            setError(`Failed to load object preview: ${fetchError.message}`);
          }
        } else {
          // For non-text files, we'll just use the URL directly in the component
          setContent(downloadUrl);
        }
      } catch (err) {
        console.error('Error in fetchContent:', err);
        setError('Failed to load file preview: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [objectname, downloadUrl]);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading preview...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.error}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
          </svg>
          <p>{error}</p>
        </div>
      );
    }

    switch (objectType) {
      case 'image':
        return (
          <div className={styles.imagePreview}>
            <img src={content} alt={objectname} onError={(e) => {
              console.error('Image failed to load:', content);
              setError('Failed to load image. The object might not be accessible.');
            }} />
          </div>
        );
      
      case 'video':
        return (
          <div className={styles.videoPreview}>
            <video controls onError={(e) => {
              console.error('Video failed to load:', content);
              setError('Failed to load video. The object might not be accessible.');
            }}>
              <source src={content} type={`video/${objectname.split('.').pop().toLowerCase()}`} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className={styles.audioPreview}>
            <audio controls onError={(e) => {
              console.error('Audio failed to load:', content);
              setError('Failed to load audio. The file might not be accessible.');
            }}>
              <source src={content} type={`audio/${objectname.split('.').pop().toLowerCase()}`} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      
      case 'pdf':
        // Construct the view URL using the correct endpoint
        // Extract the bucket and key from the download URL
        const downloadUrlParts = downloadUrl.split('/');
        const bucketIndex = downloadUrlParts.indexOf('bucket');
        
        if (bucketIndex !== -1 && bucketIndex + 1 < downloadUrlParts.length) {
          const bucket = downloadUrlParts[bucketIndex + 1];
          // The key is everything after "download/" in the URL
          const downloadIndex = downloadUrlParts.indexOf('download');
          
          if (downloadIndex !== -1 && downloadIndex + 1 < downloadUrlParts.length) {
            // Join the remaining parts to form the key
            const key = downloadUrlParts.slice(downloadIndex + 1).join('/');
            
            // Construct the view URL using the correct endpoint structure
            const baseUrl = downloadUrl.split('/api')[0];
            const viewUrl = `${baseUrl}/api/v1/bucket/${bucket}/view/${key}`;
            console.log('PDF view URL:', viewUrl);
            
            // Add a timestamp to prevent caching issues
            const urlWithTimestamp = `${viewUrl}?t=${new Date().getTime()}`;
            console.log('PDF URL with timestamp:', urlWithTimestamp);
            
            return <PDFViewer url={urlWithTimestamp} />;
          }
        }
        
        // Fallback to the original method if we couldn't parse the URL
        console.warn('Could not parse download URL to construct view URL, falling back to default method');
        const viewUrl = downloadUrl.replace('/download/', '/view/');
        console.log('PDF view URL (fallback):', viewUrl);
        
        // Add a timestamp to prevent caching issues
        const urlWithTimestamp = `${viewUrl}?t=${new Date().getTime()}`;
        console.log('PDF URL with timestamp (fallback):', urlWithTimestamp);
        
        return <PDFViewer url={urlWithTimestamp} />;
      
      case 'text':
        return (
          <div className={styles.textPreview}>
            <pre>{content}</pre>
          </div>
        );
      
      case 'code':
        return (
          <div className={styles.codePreview}>
            <pre><code>{content}</code></pre>
          </div>
        );
      
      default:
        return (
          <div className={styles.noPreview}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.noPreviewIcon}>
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
            </svg>
            <p>No preview available for this file type</p>
            <a href={downloadUrl} className={styles.downloadLink} target="_blank" rel="noopener noreferrer">
              Download to view
            </a>
          </div>
        );
    }
  };

  return (
    <div className={styles.previewSidebar}>
      <div className={styles.previewHeader}>
        <h2 className={styles.previewTitle}>{objectname}</h2>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.closeIcon}>
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>
      <div className={styles.preview}>
        {renderPreview()}
      </div>
      <div className={styles.previewFooter}>
        <a 
          href={downloadUrl} 
          className={styles.downloadButton} 
          target="_blank" 
          rel="noopener noreferrer"
          download={objectname}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.downloadIcon}>
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          Download
        </a>
      </div>
    </div>
  );
} 