import { useState, useEffect } from 'react';
import styles from '../styles/UploadProgress.module.css';

export default function UploadProgress({ uploads, onClear }) {
  const [expanded, setExpanded] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  
  // Calculate progress stats
  useEffect(() => {
    let completed = 0;
    let failed = 0;
    
    uploads.forEach(upload => {
      if (upload.status === 'completed') completed++;
      if (upload.status === 'error') failed++;
    });
    
    setCompletedCount(completed);
    setFailedCount(failed);
    
    // Auto-expand on new uploads
    if (uploads.length > 0 && uploads.some(u => u.status === 'uploading')) {
      setExpanded(true);
    }
  }, [uploads]);
  
  // Auto-collapse after all uploads complete (with delay)
  useEffect(() => {
    if (uploads.length > 0 && uploads.every(u => u.status !== 'uploading')) {
      const timer = setTimeout(() => {
        setExpanded(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [uploads]);
  
  if (uploads.length === 0) return null;
  
  const totalUploads = uploads.length;
  const inProgress = totalUploads - completedCount - failedCount;
  const allCompleted = inProgress === 0;
  
  return (
    <div className={`${styles.progressContainer} ${expanded ? styles.expanded : ''}`}>
      <div 
        className={styles.progressHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={styles.progressSummary}>
          {inProgress > 0 ? (
            <>
              <div className={styles.progressSpinner}></div>
              <span>Uploading {inProgress} of {totalUploads} files</span>
            </>
          ) : (
            <>
              {failedCount > 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.successIcon}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
              <span>
                {failedCount > 0 
                  ? `Upload complete with ${failedCount} errors` 
                  : 'Upload complete'}
              </span>
            </>
          )}
        </div>
        <div className={styles.progressActions}>
          {allCompleted && (
            <button 
              className={styles.clearButton}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              Clear
            </button>
          )}
          <button 
            className={styles.toggleButton}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.toggleIcon}>
                <path d="M7 14l5-5 5 5z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.toggleIcon}>
                <path d="M7 10l5 5 5-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className={styles.progressDetails}>
          {uploads.map((upload, index) => (
            <div 
              key={upload.id} 
              className={`${styles.uploadItem} ${styles[upload.status]}`}
            >
              <div className={styles.uploadInfo}>
                <span className={styles.uploadFilename}>{upload.filename}</span>
                <span className={styles.uploadStatus}>
                  {upload.status === 'uploading' && `${Math.round(upload.progress)}%`}
                  {upload.status === 'completed' && 'Completed'}
                  {upload.status === 'error' && 'Failed'}
                </span>
              </div>
              <div className={styles.uploadProgressBar}>
                <div 
                  className={styles.uploadProgressFill} 
                  style={{ width: `${upload.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 