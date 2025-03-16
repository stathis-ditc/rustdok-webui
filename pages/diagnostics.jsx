import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Diagnostics.module.css';

export default function Diagnostics() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/diagnostics');
        const data = await response.json();
        setResults(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching diagnostics:', err);
        setError('Failed to load diagnostics: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostics();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'skipped': return 'gray';
      default: return 'blue';
    }
  };

  return (
    <div className={styles.container || 'container'}>
      <Head>
        <title>RustDok - Diagnostics</title>
        <meta name="description" content="RustDok Diagnostics" />
      </Head>

      <main className={styles.main || 'main'}>
        <h1 className={styles.title || 'title'}>RustDok Diagnostics</h1>

        {loading ? (
          <div className={styles.loading || 'loading'}>
            <p>Loading diagnostics...</p>
          </div>
        ) : error ? (
          <div className={styles.error || 'error'}>
            <p>{error}</p>
          </div>
        ) : results ? (
          <div className={styles.results || 'results'}>
            <h2>Environment</h2>
            <div className={styles.section || 'section'}>
              <p><strong>Node Version:</strong> {results.environment.nodeVersion}</p>
              <p><strong>Environment:</strong> {results.environment.environment}</p>
              <p><strong>API URL:</strong> {results.environment.apiUrl || 'Not defined'}</p>
              <p><strong>API Version:</strong> {results.environment.apiVersion}</p>
              {results.environment.parsedUrl && (
                <div>
                  <p><strong>Parsed URL:</strong></p>
                  <ul>
                    <li>Protocol: {results.environment.parsedUrl.protocol}</li>
                    <li>Hostname: {results.environment.parsedUrl.hostname}</li>
                    <li>Port: {results.environment.parsedUrl.port}</li>
                    <li>Path: {results.environment.parsedUrl.pathname}</li>
                  </ul>
                </div>
              )}
            </div>

            <h2>DNS Resolution</h2>
            <div className={styles.section || 'section'}>
              <p>
                <strong>Status:</strong> 
                <span style={{ color: getStatusColor(results.dns.status) }}>
                  {results.dns.status}
                </span>
              </p>
              {results.dns.details && (
                <p><strong>Details:</strong> {
                  typeof results.dns.details === 'object' 
                    ? JSON.stringify(results.dns.details) 
                    : results.dns.details
                }</p>
              )}
            </div>

            <h2>TCP Connection</h2>
            <div className={styles.section || 'section'}>
              <p>
                <strong>Status:</strong> 
                <span style={{ color: getStatusColor(results.connection.status) }}>
                  {results.connection.status}
                </span>
              </p>
              {results.connection.details && (
                <p><strong>Details:</strong> {results.connection.details}</p>
              )}
            </div>

            <h2>API Endpoint</h2>
            <div className={styles.section || 'section'}>
              <p>
                <strong>Status:</strong> 
                <span style={{ color: getStatusColor(results.api.status) }}>
                  {results.api.status}
                </span>
              </p>
              {results.api.details && (
                <p><strong>Details:</strong> {results.api.details}</p>
              )}
            </div>

            <h2>Troubleshooting</h2>
            <div className={styles.section || 'section'}>
              {results.dns.status === 'error' && (
                <div className={styles.troubleshooting || 'troubleshooting'}>
                  <h3>DNS Resolution Failed</h3>
                  <p>The WebUI server cannot resolve the hostname of the RustDok server.</p>
                  <ul>
                    <li>Check if the hostname in NEXT_PUBLIC_RUSTDOK_API_URL is correct</li>
                    <li>Verify that the Kubernetes DNS service is working properly</li>
                    <li>Ensure the RustDok server service is deployed and running</li>
                    <li>Check if the service name and namespace are correct</li>
                  </ul>
                </div>
              )}

              {results.connection.status === 'error' && (
                <div className={styles.troubleshooting || 'troubleshooting'}>
                  <h3>TCP Connection Failed</h3>
                  <p>The WebUI server cannot establish a TCP connection to the RustDok server.</p>
                  <ul>
                    <li>Check if the RustDok server is running</li>
                    <li>Verify that the port in NEXT_PUBLIC_RUSTDOK_API_URL is correct</li>
                    <li>Ensure there are no network policies blocking the connection</li>
                    <li>Check if the RustDok server is listening on the specified port</li>
                  </ul>
                </div>
              )}

              {results.api.status === 'error' && (
                <div className={styles.troubleshooting || 'troubleshooting'}>
                  <h3>API Request Failed</h3>
                  <p>The WebUI server can connect to the RustDok server, but the API request failed.</p>
                  <ul>
                    <li>Check if the RustDok server API is working properly</li>
                    <li>Verify that the API version in NEXT_PUBLIC_RUSTDOK_API_VERSION is correct</li>
                    <li>Ensure the RustDok server is configured correctly</li>
                    <li>Check the RustDok server logs for errors</li>
                  </ul>
                </div>
              )}

              {results.api.status === 'success' && (
                <div className={styles.success || 'success'}>
                  <h3>All Checks Passed</h3>
                  <p>The WebUI server can successfully communicate with the RustDok server.</p>
                  <p>If you're still experiencing issues, check the browser console for errors.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
} 