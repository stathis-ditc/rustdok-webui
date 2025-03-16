import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import Logo from '../components/Logo';
import styles from '../styles/Home.module.css';
import { getBucketsUrl } from '../config';

export default function Home() {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        setLoading(true);
        
        // Get the buckets URL from the config
        const url = getBucketsUrl();
        console.log('Fetching buckets from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch buckets: ${response.status}`);
        }
        
        const data = await response.json();
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
  }, []);

  const handleCreateBucket = () => {
    // Implement bucket creation logic or navigation
    router.push('/create-bucket');
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.logoContainer}>
            <Logo size="large" />
          </div>
          <h1 className={styles.pageTitle}>Welcome to RustDok</h1>
          <p className={styles.pageDescription}>
            Manage your files with RustDok
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading buckets...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        ) : buckets.length === 0 ? (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.emptyIcon}>
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
            </svg>
            <h2 className={styles.emptyTitle}>No buckets found</h2>
            <p className={styles.emptyDescription}>Create your first bucket to start storing and organizing your files.</p>
            <button className={styles.actionButton} onClick={handleCreateBucket}>
              Create Bucket
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {buckets.map((bucketName) => (
              <Link href={`/bucket/${bucketName}`} key={bucketName} className={styles.card}>
                <div className={styles.cardIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.bucketIcon}>
                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                  </svg>
                </div>
                <h3 className={styles.cardTitle}>{bucketName}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 