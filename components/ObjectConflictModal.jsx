import React from 'react';
import styles from '../styles/ObjectConflictModal.module.css';

export default function ObjectConflictModal({ 
  isOpen, 
  onClose, 
  conflictObject, 
  onSkip, 
  onReplace, 
  onRename 
}) {
  if (!isOpen || !conflictObject) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>File Already Exists</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p>
            The object <strong>{conflictObject.name}</strong> already exists in this location.
            What would you like to do?
          </p>
          
          <div className={styles.options}>
            <button 
              className={`${styles.optionButton} ${styles.skipButton}`} 
              onClick={onSkip}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.optionIcon}>
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Skip
              <span className={styles.optionDescription}>
                Don't upload this object
              </span>
            </button>
            
            <button 
              className={`${styles.optionButton} ${styles.renameButton}`} 
              onClick={onRename}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.optionIcon}>
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              Rename
              <span className={styles.optionDescription}>
                Upload as a copy with incremented name
              </span>
            </button>
            
            <button 
              className={`${styles.optionButton} ${styles.replaceButton}`} 
              onClick={onReplace}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.optionIcon}>
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14zM6 7v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zm8 7v4h-4v-4H8l4-4 4 4h-2z" />
              </svg>
              Replace
              <span className={styles.optionDescription}>
                Overwrite the existing object
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 