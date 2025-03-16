/**
 * Object and folder utility functions
 */

/**
 * Determines if an object is a folder
 * @param {Object|string} obj - The object/folder object or filename
 * @returns {boolean} - True if the object is a folder
 */
export const isFolder = (obj) => {
  console.log('Checking if object is a folder:', obj);
  
  if (typeof obj === 'string') {
    const result = obj.endsWith('/');
    console.log(`String object "${obj}" is folder: ${result}`);
    return result;
  }

  if (!obj) {
    console.log('Object is null or undefined, not a folder');
    return false;
  }
  
  const result = obj.name && (obj.name.endsWith('/') || (obj.size === 0 && !obj.last_modified));
  console.log(`Object with name "${obj.name}" is folder: ${result}`);
  return result;
};

/**
 * Gets the display name of a file or folder
 * @param {Object} obj - The object/folder object
 * @returns {string} - The display name
 */
export const getDisplayName = (obj) => {
  if (isFolder(obj)) {
    // For folders, remove the trailing slash and get the last part of the path
    const name = obj.name.endsWith('/') ? obj.name.slice(0, -1) : obj.name;
    const parts = name.split('/');
    return parts[parts.length - 1] || name;
  } else {
    // For fil§es, just get the last part of the path
    const parts = obj.name.split('/');
    return parts[parts.length - 1] || obj.name;
  }
};

/**
 * Formats an object size in bytes to a human-readable string
 * @param {number} bytes - The object size in bytes
 * @returns {string} - The formatted object size
 */
export const formatObjectSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (bytes === undefined || bytes === null) return '-';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 