import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import FilePreview from '../../../../components/ObjectPreview';
import styles from '../../../../styles/Home.module.css';
import { getDownloadUrl } from '../../../../config';

export default function FileDetailPage() {
  const router = useRouter();
  const { bucket, objectname } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [objectData, setObjectData] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const fetchObjectData = async () => {
      try {
        setLoading(true);
        
        // Use the getDownloadUrl function to get the correct URL
        const downloadUrl = getDownloadUrl(bucket, objectname);
        
        console.log('Fetching object data from:', downloadUrl);
        
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch object: ${response.status}`);
        }
        
        // Determine content type
        const contentType = response.headers.get('content-type');
        console.log('Content type:', contentType);
        
        if (contentType.startsWith('image/')) {
          setPreviewType('image');
          const blob = await response.blob();
          setObjectData(URL.createObjectURL(blob));
        } else if (contentType === 'application/pdf') {
          setPreviewType('pdf');
          const blob = await response.blob();
          setObjectData(URL.createObjectURL(blob));
        } else if (contentType.startsWith('text/')) {
          setPreviewType('text');
          const text = await response.text();
          setObjectData(text);
        } else if (contentType.includes('json')) {
          setPreviewType('json');
          const json = await response.json();
          setObjectData(JSON.stringify(json, null, 2));
        } else {
          setPreviewType('binary');
          setObjectData(downloadUrl);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching object:', err);
        setError('Failed to load object: ' + err.message);
        setObjectData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchObjectData();
  }, [router.isReady, bucket, objectname]);

  // Show loading state while router is initializing
  if (!router.isReady || loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <p>Loading object information...</p>
        </div>
      </Layout>
    );
  }

  // Show error if parameters are missing
  if (!bucket || !objectname) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.title}>Error</h1>
          <p className={styles.error}>Missing bucket or objectname parameter</p>
        </div>
      </Layout>
    );
  }

  const downloadUrl = getDownloadUrl(bucket, objectname);

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>File Preview</h1>
        <p className={styles.description}>
          Viewing file from bucket: <strong>{bucket}</strong>
        </p>
        
        <FilePreview 
          filename={objectname} 
          downloadUrl={downloadUrl} 
        />
        
        <div className={styles.backLink}>
          <button 
            onClick={() => router.back()} 
            className={styles.backButton}
          >
            ← Back to bucket
          </button>
        </div>
      </div>
    </Layout>
  );
} 