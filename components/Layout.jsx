import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Layout.module.css';
import Logo from './Logo';
import { getBucketsUrl, getBaseApiUrl } from '../config';

export default function Layout({ children }) {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewBucketModal, setShowNewBucketModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [bucketNameError, setBucketNameError] = useState('');
  const [isDeletingBucket, setIsDeletingBucket] = useState(false);
  const [bucketToDelete, setBucketToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [bucketIsEmpty, setBucketIsEmpty] = useState(true);
  const router = useRouter();
  
  // Get the current bucket from the URL if we're on a bucket page
  const { bucket } = router.query;

  useEffect(() => {
    // Only run this effect when router is ready
    if (!router.isReady) return;

    const fetchBuckets = async () => {
      try {
        setLoading(true);
        
        // Get the buckets URL from the config
        const url = getBucketsUrl();
        console.log('Fetching buckets from:', url);
        
        // Fetch buckets using the configured URL
        const response = await fetch(url);
        
        if (!response.ok) {
          // Try to get more detailed error information
          try {
            const errorData = await response.json();
            throw new Error(
              `Failed to fetch buckets: ${response.status} ${response.statusText}. ` +
              `${errorData.error || ''} ${errorData.reason || ''} ${errorData.suggestion || ''}`
            );
          } catch (jsonError) {
            // If we can't parse the error as JSON, throw a generic error
            throw new Error(`Failed to fetch buckets: ${response.status} ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        console.log('Buckets received:', data);
        setBuckets(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching buckets:', err);
        setError('Failed to load buckets: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBuckets();
  }, [router.isReady]);

  const validateBucketName = (name) => {
    // Reset error
    setBucketNameError('');
    
    // Basic validation
    if (!name || name.trim().length === 0) {
      return false;
    }
    
    // Length check
    if (name.length < 3 || name.length > 63) {
      setBucketNameError('Bucket name must be between 3 and 63 characters long');
      return false;
    }
    
    // Character check
    if (!/^[a-z0-9.-]+$/.test(name)) {
      setBucketNameError('Bucket name can only contain lowercase letters, numbers, periods (.), and hyphens (-)');
      return false;
    }
    
    // First and last character check
    if (!/^[a-z0-9].*[a-z0-9]$/.test(name)) {
      setBucketNameError('Bucket name must begin and end with a letter or number');
      return false;
    }
    
    // Adjacent periods check
    if (name.includes('..')) {
      setBucketNameError('Bucket name must not contain two adjacent periods');
      return false;
    }
    
    // IP address format check
    if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
      setBucketNameError('Bucket name must not be formatted as an IP address');
      return false;
    }
    
    // Reserved prefixes
    if (name.startsWith('xn--') || name.startsWith('sthree-') || name.startsWith('amzn-s3-demo-')) {
      setBucketNameError('Bucket name contains a reserved prefix');
      return false;
    }
    
    // Reserved suffixes
    if (name.endsWith('-s3alias') || name.endsWith('--ol-s3') || name.endsWith('.mrap') || name.endsWith('--x-s3')) {
      setBucketNameError('Bucket name contains a reserved suffix');
      return false;
    }
    
    return true;
  };

  const handleCreateBucket = async () => {
    if (!validateBucketName(newBucketName.trim())) {
      return;
    }
    
    setIsCreatingBucket(true);
    try {
      // Get the buckets URL from the config
      const url = getBucketsUrl();
      console.log('Creating bucket at:', url);
      
      // Create bucket using the configured URL
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newBucketName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Failed to create bucket';
        throw new Error(errorMessage);
      }
      
      // Refresh buckets list
      const bucketsResponse = await fetch(url);
      
      if (bucketsResponse.ok) {
        const data = await bucketsResponse.json();
        setBuckets(data);
      }
      
      // Navigate to the new bucket
      router.push(`/bucket/${newBucketName}`);
    } catch (error) {
      console.error('Error creating bucket:', error);
      alert('Failed to create bucket: ' + error.message);
    } finally {
      setIsCreatingBucket(false);
      setShowNewBucketModal(false);
      setNewBucketName('');
    }
  };

  const checkBucketIsEmpty = async (bucketName) => {
    try {
      // Use the config to get the bucket objects URL
      const baseUrl = getBaseApiUrl();
      const url = `${baseUrl}/bucket/${bucketName}/objects`;
      console.log('Checking bucket contents at:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to check bucket contents');
      }
      
      const data = await response.json();
      console.log('Bucket contents response:', data);
      
      // Check if the response is an array (the API returns an array of files directly)
      if (!Array.isArray(data)) {
        console.error('Unexpected API response format:', data);
        return false; // Assume not empty to be safe
      }
      
      // If we got here, we have a valid response with an array of files
      return data.length === 0;
    } catch (error) {
      console.error('Error checking if bucket is empty:', error);
      return false; // Assume not empty on error to be safe
    }
  };

  const confirmDeleteBucket = async (bucketName, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setBucketToDelete(bucketName);
    
    // Check if bucket is empty
    const isEmpty = await checkBucketIsEmpty(bucketName);
    setBucketIsEmpty(isEmpty);
    
    setShowDeleteConfirmation(true);
  };

  const handleDeleteBucket = async (bucketName) => {
    if (isDeletingBucket) return;
    
    // Double-check that the bucket is empty
    const isEmpty = await checkBucketIsEmpty(bucketName);
    if (!isEmpty) {
      setShowDeleteConfirmation(false);
      alert('Cannot delete a non-empty bucket. Please empty the bucket first.');
      return;
    }
    
    setIsDeletingBucket(true);
    try {
      // Use the config to get the bucket URL
      const baseUrl = getBaseApiUrl();
      const url = `${baseUrl}/bucket/${bucketName}`;
      console.log('Deleting bucket at:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Failed to delete bucket';
        throw new Error(errorMessage);
      }
      
      // Remove the bucket from the state
      setBuckets(prevBuckets => prevBuckets.filter(b => b !== bucketName));
      
      // If we're currently on the deleted bucket's page, redirect to home
      if (bucket === bucketName) {
        router.push('/');
      }
      
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error('Error deleting bucket:', error);
      alert('Failed to delete bucket: ' + error.message);
    } finally {
      setIsDeletingBucket(false);
      setBucketToDelete(null);
    }
  };

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Logo size="medium" />
        </div>
      </header>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Buckets</h2>
            <button 
              className={styles.createBucketButton} 
              onClick={() => setShowNewBucketModal(true)}
              title="Create new bucket"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.createBucketIcon}>
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          </div>
          {!router.isReady || loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading buckets...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
              </svg>
              <p className={styles.error}>{error}</p>
              <p className={styles.apiUrl}>
                Server API URL: {process.env.NEXT_PUBLIC_RUSTDOK_API_URL || 'Not defined'}
              </p>
              <p className={styles.apiUrl}>
                Using API proxy: {window.location.origin}/api/proxy
              </p>
            </div>
          ) : buckets.length === 0 ? (
            <div className={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.emptyIcon}>
                <path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.59 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.31 0 6 1.12 6 2.5S15.31 10 12 10 6 8.88 6 7.5 8.69 5 12 5zm6 11.5c0 1.38-2.69 2.5-6 2.5s-6-1.12-6-2.5V10.9c1.37.63 3.53 1.1 6 1.1s4.63-.47 6-1.1v5.6zm0-7.15c-.53.21-1.23.45-2 .62-1.5.33-3.05.53-4 .53s-2.5-.19-4-.53c-.77-.17-1.47-.41-2-.62V13c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V9.35z"/>
              </svg>
              <p>No buckets found</p>
              <button 
                className={styles.createBucketEmptyButton}
                onClick={() => setShowNewBucketModal(true)}
              >
                Create Bucket
              </button>
            </div>
          ) : (
            <ul className={styles.bucketList}>
              {buckets.map((bucketName) => (
                <li 
                  key={bucketName} 
                  className={`${styles.bucketItem} ${bucket === bucketName ? styles.active : ''}`}
                >
                  <Link href={`/bucket/${bucketName}`} className={styles.bucketLink}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.bucketIcon}>
                      <path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.59 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.31 0 6 1.12 6 2.5S15.31 10 12 10 6 8.88 6 7.5 8.69 5 12 5zm6 11.5c0 1.38-2.69 2.5-6 2.5s-6-1.12-6-2.5V10.9c1.37.63 3.53 1.1 6 1.1s4.63-.47 6-1.1v5.6zm0-7.15c-.53.21-1.23.45-2 .62-1.5.33-3.05.53-4 .53s-2.5-.19-4-.53c-.77-.17-1.47-.41-2-.62V13c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V9.35z"/>
                    </svg>
                    <span className={styles.bucketName}>{bucketName}</span>
                  </Link>
                  <button 
                    className={styles.deleteBucketButton}
                    onClick={(e) => confirmDeleteBucket(bucketName, e)}
                    title="Delete bucket"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.deleteBucketIcon}>
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <main className={styles.main}>
          {children}
        </main>
      </div>
      <footer className={styles.footer}>
        <p> {new Date().getFullYear()} Rustdok</p>
      </footer>

      {/* New Bucket Modal */}
      {showNewBucketModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewBucketModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.modalIcon}>
                  <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 10h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z" />
                </svg>
                Create New Bucket
              </h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowNewBucketModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.closeIcon}>
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="bucketName" className={styles.label}>Bucket Name</label>
                <input
                  id="bucketName"
                  type="text"
                  className={styles.input}
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="Enter bucket name"
                  autoFocus
                />
              </div>
              {bucketNameError && <p className={styles.error}>{bucketNameError}</p>}
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowNewBucketModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.createButton}
                onClick={handleCreateBucket}
                disabled={!newBucketName.trim() || isCreatingBucket}
              >
                {isCreatingBucket ? 'Creating...' : 'Create Bucket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Bucket Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirmation(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.modalIcon}>
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                Delete Bucket
              </h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowDeleteConfirmation(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.closeIcon}>
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.confirmationText}>
                Are you sure you want to delete the bucket <strong>{bucketToDelete}</strong>?
              </p>
              {!bucketIsEmpty ? (
                <p className={styles.warningText}>
                  <strong>Warning:</strong> This bucket is not empty. You must empty the bucket before it can be deleted.
                </p>
              ) : (
                <p className={styles.warningText}>
                  This action cannot be undone.
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirmation(false)}
              >
                {!bucketIsEmpty ? 'Close' : 'Cancel'}
              </button>
              {bucketIsEmpty && (
                <button 
                  className={styles.deleteButton}
                  onClick={() => handleDeleteBucket(bucketToDelete)}
                  disabled={isDeletingBucket}
                >
                  {isDeletingBucket ? 'Deleting...' : 'Delete Bucket'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 