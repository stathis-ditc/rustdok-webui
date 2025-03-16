/**
 * API Diagnostics Endpoint
 * 
 * This endpoint provides diagnostic information about the WebUI's connectivity
 * to the RustDok server. It helps troubleshoot connection issues.
 */

import dns from 'dns';
import { promisify } from 'util';
import http from 'http';

// Promisify DNS lookup
const lookup = promisify(dns.lookup);

export default async function handler(req, res) {
  const apiUrl = process.env.NEXT_PUBLIC_RUSTDOK_API_URL;
  const apiVersion = process.env.NEXT_PUBLIC_RUSTDOK_API_VERSION || 'v1';
  
  const results = {
    environment: {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      apiUrl,
      apiVersion,
    },
    dns: {
      status: 'pending',
      details: null,
    },
    connection: {
      status: 'pending',
      details: null,
    },
    api: {
      status: 'pending',
      details: null,
    }
  };
  
  // Only proceed if we have an API URL
  if (!apiUrl) {
    results.dns.status = 'skipped';
    results.connection.status = 'skipped';
    results.api.status = 'skipped';
    results.error = 'API_URL is not defined in server environment';
    return res.status(500).json(results);
  }
  
  // Parse the URL to get hostname and port
  let hostname, port;
  try {
    const url = new URL(apiUrl);
    hostname = url.hostname;
    port = url.port || (url.protocol === 'https:' ? 443 : 80);
    
    results.environment.parsedUrl = {
      protocol: url.protocol,
      hostname,
      port,
      pathname: url.pathname,
    };
  } catch (error) {
    results.dns.status = 'error';
    results.dns.details = `Invalid URL: ${error.message}`;
    results.connection.status = 'skipped';
    results.api.status = 'skipped';
    return res.status(400).json(results);
  }
  
  // Check DNS resolution
  try {
    const dnsResult = await lookup(hostname);
    results.dns.status = 'success';
    results.dns.details = dnsResult;
  } catch (error) {
    results.dns.status = 'error';
    results.dns.details = `DNS lookup failed: ${error.message}`;
    results.connection.status = 'skipped';
    results.api.status = 'skipped';
    return res.status(502).json(results);
  }
  
  // Check TCP connection
  try {
    const connectionPromise = new Promise((resolve, reject) => {
      const socket = new http.Agent().createConnection({ 
        host: hostname, 
        port: port 
      }, () => {
        socket.end();
        resolve(true);
      });
      
      socket.on('error', (err) => {
        reject(err);
      });
      
      // Set a timeout
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('Connection timed out after 5 seconds'));
      });
    });
    
    await connectionPromise;
    results.connection.status = 'success';
    results.connection.details = `Successfully connected to ${hostname}:${port}`;
  } catch (error) {
    results.connection.status = 'error';
    results.connection.details = `Connection failed: ${error.message}`;
    results.api.status = 'skipped';
    return res.status(502).json(results);
  }
  
  // Check API endpoint
  try {
    const apiEndpoint = `${apiUrl}/api/${apiVersion}/buckets`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(apiEndpoint, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        results.api.status = 'success';
        results.api.details = `API responded with status ${response.status}`;
      } else {
        results.api.status = 'error';
        results.api.details = `API responded with error status ${response.status}: ${response.statusText}`;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    results.api.status = 'error';
    results.api.details = `API request failed: ${error.message}`;
  }
  
  // Return the results
  const statusCode = 
    results.api.status === 'success' ? 200 :
    results.connection.status === 'success' ? 207 :
    results.dns.status === 'success' ? 207 : 502;
  
  return res.status(statusCode).json(results);
} 