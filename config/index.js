/**
 * Application configuration
 * Centralizes access to environment variables and API URL construction
 */

// API configuration
// In the browser, we'll always use the proxy endpoint
const isBrowser = typeof window !== 'undefined';
// For server-side code, use the direct API URL from environment variables
// For client-side code, always use the current origin (proxy)
export const API_URL = isBrowser ? window.location.origin : process.env.NEXT_PUBLIC_RUSTDOK_API_URL;
export const API_VERSION = process.env.NEXT_PUBLIC_RUSTDOK_API_VERSION || 'v1';

/**
 * Validates that required environment variables are defined
 * @returns {boolean} True if all required variables are defined
 * @throws {Error} If any required variable is missing
 */
export const validateEnvVars = () => {
  // In the browser, we don't need to validate API_URL since we're using window.location.origin
  if (isBrowser) {
    if (!API_VERSION) {
      console.warn('API_VERSION is not defined. Using default: v1');
    }
    return true;
  }
  
  // On the server, we need to validate both API_URL and API_VERSION
  if (!API_URL) {
    throw new Error('API_URL is not defined. Check your environment variable NEXT_PUBLIC_RUSTDOK_API_URL.');
  }
  if (!API_VERSION) {
    throw new Error('API_VERSION is not defined. Check your environment variable NEXT_PUBLIC_RUSTDOK_API_VERSION.');
  }
  return true;
};

/**
 * Constructs the base API URL
 * @returns {string} The base API URL
 */
export const getBaseApiUrl = () => {
  // Always validate environment variables
  validateEnvVars();
  
  // In the browser, always use the proxy endpoint
  if (isBrowser) {
    return `/api/proxy`;
  }
  
  // On the server, use the direct API URL
  return `${API_URL}/api/${API_VERSION}`;
};

/**
 * Constructs a URL for bucket operations
 * @param {string} bucket - The bucket name
 * @param {string} [prefix] - Optional prefix for listing objects
 * @returns {string} The bucket API URL
 */
export const getBucketUrl = (bucket, prefix) => {
  const baseUrl = getBaseApiUrl();
  console.log('Building bucket URL with baseUrl:', baseUrl, 'bucket:', bucket, 'prefix:', prefix);
  
  // Debug the prefix value
  console.log('Prefix type:', typeof prefix, 'Prefix value:', prefix);
  
  // Ensure the prefix is properly encoded and handle undefined/null cases
  let encodedPrefix = '';
  if (prefix) {
    // Make sure the prefix ends with a slash for folder navigation
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    console.log('Normalized prefix:', normalizedPrefix);
    encodedPrefix = encodeURIComponent(normalizedPrefix);
  }
  
  const url = `${baseUrl}/bucket/${bucket}/objects${encodedPrefix ? `?prefix=${encodedPrefix}` : ''}`;
  
  console.log('Constructed bucket URL:', url);
  return url;
};

/**
 * Constructs a URL for object operations
 * @param {string} bucket - The bucket name
 * @param {string} objectKey - The object key/name
 * @returns {string} The object API URL
 */
export const getObjectUrl = (bucket, objectKey) => {
  const baseUrl = getBaseApiUrl();
  return `${baseUrl}/bucket/${bucket}/object/${encodeURIComponent(objectKey)}`;
};

/**
 * Constructs a URL for downloading objects
 * @param {string} bucket - The bucket name
 * @param {string} objectKey - The object key/name
 * @returns {string} The download URL
 */
export const getDownloadUrl = (bucket, objectKey) => {
  const baseUrl = getBaseApiUrl();
  return `${baseUrl}/bucket/${bucket}/download/${encodeURIComponent(objectKey)}`;
};

/**
 * Constructs a URL for viewing objects
 * @param {string} bucket - The bucket name
 * @param {string} objectKey - The object key/name
 * @returns {string} The view URL
 */
export const getViewUrl = (bucket, objectKey) => {
  const baseUrl = getBaseApiUrl();
  return `${baseUrl}/bucket/${bucket}/view/${encodeURIComponent(objectKey)}`;
};

/**
 * Constructs a URL for listing all buckets
 * @returns {string} The buckets API URL
 */
export const getBucketsUrl = () => {
  const baseUrl = getBaseApiUrl();
  return `${baseUrl}/buckets`;
};

export default {
  API_URL,
  API_VERSION,
  validateEnvVars,
  getBaseApiUrl,
  getBucketUrl,
  getObjectUrl,
  getDownloadUrl,
  getViewUrl,
  getBucketsUrl
}; 