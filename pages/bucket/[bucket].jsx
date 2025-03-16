import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ObjectList from '../../components/ObjectList';
import ObjectPreview from '../../components/ObjectPreview';
import { isFolder } from '../../utils/objectHelpers';
import styles from '../../styles/Home.module.css';
import { getBucketUrl, getObjectUrl, getDownloadUrl } from '../../config';

export default function BucketPage() {
  const router = useRouter();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewObject, setPreviewObject] = useState(null);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderCreation, setShowFolderCreation] = useState(false);

  // Wait for router to be ready before accessing bucket parameter
  const { bucket } = router.query;

  useEffect(() => {
    // Only run this effect when router is ready and bucket is available
    if (!router.isReady) return;
    if (!bucket) {
      console.log('No bucket parameter found in URL');
      return;
    }

    console.log('Bucket parameter:', bucket);
    
    // Get the prefix from the URL query if it exists
    if (router.isReady) {
      const { prefix } = router.query;
      console.log('Current prefix from URL:', prefix);
      setCurrentPrefix(prefix || '');
    }

    const fetchObjects = async () => {
      try {
        setLoading(true);
        
        // Use the prefix directly from the router.query to ensure we're using the latest value
        const currentPrefixValue = router.query.prefix || '';
        console.log('Fetching objects with prefix:', currentPrefixValue);
        console.log('Router query:', router.query);
        
        // Debug the objects before fetching
        console.log('Current objects state:', objects);
        
        const url = getBucketUrl(bucket, currentPrefixValue);
        console.log('Fetching objects from URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch objects from bucket ${bucket}: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} objects from server:`, data);
        
        // Set the objects state with the new data
        setObjects(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching objects:', err);
        setError(err.message);
        setObjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, [router.isReady, bucket, router.query.prefix]);

  const handleUploadSuccess = async () => {
    try {
      setLoading(true);
      
      // Use the prefix directly from the router.query to ensure we're using the latest value
      const currentPrefixValue = router.query.prefix || '';
      const url = getBucketUrl(bucket, currentPrefixValue);
      console.log('Refreshing objects from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to refresh objects: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} objects after refresh`);
      setObjects(data);
      setError(null);
    } catch (err) {
      console.error('Error refreshing objects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Expose the handleUploadSuccess function to the window object
  // so it can be called from the FileList component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.handleUploadSuccess = handleUploadSuccess;
    }
    
    return () => {
      // Clean up when component unmounts
      if (typeof window !== 'undefined') {
        delete window.handleUploadSuccess;
      }
    };
  }, [bucket, currentPrefix]);

  const handleDelete = async (obj) => {
    try {
    
      // Check if filename is a string or an object
      let objectToDelete = obj;
      
      // If it's an object with a name property, use that
      if (obj !== null && obj.name) {
        // Check if it's a folder
        if (isFolder(obj)) {
          // For folders, we might need to remove the trailing slash
          objectToDelete = obj.name;
        } else {
          objectToDelete = obj.name;
        }
      }
      
      const url = getObjectUrl(bucket, objectToDelete);
      console.log('Deleting object/folder with URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete ${objectToDelete}: ${response.status}`);
      }
      
      // Remove the deleted object from the state
      setObjects(prevObjects => {
        console.log('Filtering objects after deletion');
        return prevObjects.filter(object => {
          // If we're deleting a folder
          if (typeof obj === 'object' && isFolder(obj)) {
            return object.name !== obj.name;
          }
          // If objectToDelete is a string (object key)
          if (typeof objectToDelete === 'string') {
            return object.name !== objectToDelete;
          }
          // Fallback
          return true;
        });
      });
      
      console.log('Object/folder deleted successfully');
      
      // Refresh the list after deletion to ensure we have the latest data
      setTimeout(() => {
        handleUploadSuccess();
      }, 500);
      
      return true;
    } catch (err) {
      console.error('Error deleting object/folder:', err);
      setError('Failed to delete: ' + err.message);
      return false;
    }
  };

  const handlePreview = (objectname) => {
    setPreviewObject(objectname);
  };

  const closePreview = () => {
    setPreviewObject(null);
  };

  const handleFolderCreated = () => {
    // Refresh objects after folder creation
    setShowFolderCreation(false);
    handleUploadSuccess();
  };

  // Handle folder navigation
  const handleFolderClick = (folderPath) => {
    console.log('BucketPage: Navigating to folder:', folderPath);
    
    // Ensure the folder path ends with a slash
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    
    console.log('Normalized folder path:', normalizedPath);
    console.log('Current router path:', router.pathname);
    console.log('Current router query:', router.query);
    
    // Update the current prefix and navigate to the folder
    // In object storage, folders are just prefixes in the object key
    
    // Create a new query object with the updated prefix
    const newQuery = { ...router.query, prefix: normalizedPath };
    console.log('New router query:', newQuery);
    
    // Force a full page reload to ensure we get fresh data from the server
    router.push({
      pathname: router.pathname,
      query: newQuery
    }, undefined, { shallow: false }).then(() => {
      // After navigation, refresh the objects to ensure we have the latest data
      console.log('Navigation complete, refreshing objects');
      handleUploadSuccess();
    }).catch(err => {
      console.error('Error during navigation:', err);
    });
  };

  const getBreadcrumbs = () => {
    if (!currentPrefix) return [{ name: bucket, path: '' }];
    
    const parts = currentPrefix.split('/').filter(Boolean);
    let path = '';
    
    return [
      { name: bucket, path: '' },
      ...parts.map(part => {
        path += part + '/';
        return { name: part, path };
      })
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <Layout>
      <div className={`${styles.container} ${previewObject ? styles.withSidebar : ''}`}>
        <div className={styles.mainContent}>
          <div className={styles.pageHeader}>
            <div className={styles.breadcrumbs}>
              {getBreadcrumbs().map((crumb, index) => (
                <span key={index}>
                  {index > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                  <button 
                    className={styles.breadcrumbButton}
                    onClick={() => {
                      if (index === 0) {
                        // Root bucket - clear prefix
                        router.push({
                          pathname: router.pathname,
                          query: { bucket }
                        });
                      } else {
                        // Navigate to folder
                        router.push({
                          pathname: router.pathname,
                          query: { ...router.query, prefix: crumb.path }
                        });
                      }
                    }}
                  >
                    {index === 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.breadcrumbIcon}>
                        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                      </svg>
                    ) : null}
                    {crumb.name}
                  </button>
                </span>
              ))}
            </div>
            <h1 className={styles.pageTitle}>
              Files in {currentPrefix ? `${bucket}/${currentPrefix}` : bucket}
            </h1>
          </div>

          <div className={styles.actionBar}>
            <div className={styles.searchContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.searchIcon}>
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input type="text" placeholder="Search files..." className={styles.searchInput} />
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading files...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          ) : (
            <ObjectList 
              objects={objects} 
              onDelete={handleDelete} 
              downloadUrlPrefix={getObjectUrl(bucket, '')}
              bucket={bucket}
              onPreview={handlePreview}
              onFolderClick={handleFolderClick}
              folderCreationProps={{
                showFolderCreation,
                setShowFolderCreation,
                currentPrefix,
                onFolderCreated: handleFolderCreated
              }}
              uploadUrl={getBucketUrl(bucket, currentPrefix)}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </div>
        
        {previewObject && (
          <div className={styles.sidebar}>
            <ObjectPreview 
              objectname={previewObject} 
              downloadUrl={getDownloadUrl(bucket, previewObject)}
              onClose={closePreview}
            />
          </div>
        )}
      </div>
    </Layout>
  );
} 