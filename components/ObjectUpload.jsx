import { useState, useRef } from 'react';
import styles from '../styles/ObjectUpload.module.css';
import ObjectConflictModal from './ObjectConflictModal';

export default function ObjectUpload({ onUploadSuccess, uploadUrl }) {
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const [conflictObject, setConflictObject] = useState(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [currentUploadQueue, setCurrentUploadQueue] = useState([]);
  const objectInputRef = useRef(null);

  const handleObjectChange = (e) => {
    const objects = Array.from(e.target.files);
    setSelectedObjects(objects);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const objects = Array.from(e.dataTransfer.files);
    setSelectedObjects(objects);
    setError(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Check if object exists before uploading
  const checkObjectExists = async (object, prefix = '') => {
    try {
      const response = await fetch(`${uploadUrl.split('/upload')[0]}/api/${process.env.NEXT_PUBLIC_RUSTDOK_API_VERSION}/check-object-exists?objectname=${encodeURIComponent(prefix + object.name)}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to check if object exists: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.exists;
    } catch (err) {
      console.error('Error checking if object exists:', err);
      return false; 
    }
  };

  // Generate a new objectname with incremented number
  const generateNewObjectname = (objectname) => {
    const dotIndex = objectname.lastIndexOf('.');
    if (dotIndex === -1) {
      // No extension
      return `${objectname} (1)`;
    }
    
    const name = objectname.substring(0, dotIndex);
    const extension = objectname.substring(dotIndex);
    
    // Check if name already ends with a number in parentheses
    const match = name.match(/^(.*?)(?: \((\d+)\))?$/);
    if (match && match[2]) {
      // Increment the number
      const number = parseInt(match[2], 10) + 1;
      return `${match[1]} (${number})${extension}`;
    }
    
    return `${name} (1)${extension}`;
  };

  const uploadObject = async (object, options = {}) => {
    const { replace = false, newObjectname = null } = options;
    const formData = new FormData();
    
    if (newObjectname) {
      const renamedObject = new File([object], newObjectname, { type: object.type });
      formData.append('object', renamedObject);
    } else {
      formData.append('object', object);
    }
    
    // Build the URL with query parameters
    let url = uploadUrl;
    if (replace) {
      // Add replace parameter to URL
      url += (url.includes('?') ? '&' : '?') + 'replace=true';
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload ${object.name}: ${response.statusText}`);
      }
      
      setUploadProgress(prev => ({
        ...prev,
        [object.name]: 100
      }));
      
      return await response.json();
    } catch (err) {
      setUploadProgress(prev => ({
        ...prev,
        [object.name]: -1
      }));
      throw err;
    }
  };

  // Process the upload queue
  const processUploadQueue = async (objects) => {
    setUploading(true);
    setError(null);
    
    const initialProgress = {};
    objects.forEach(object => {
      initialProgress[object.name] = 0;
    });
    setUploadProgress(initialProgress);
    
    // Store the current queue for conflict resolution
    setCurrentUploadQueue(objects);

    for (const object of objects) {
      const exists = await checkObjectExists(object);
      
      if (exists) {
        // Show conflict modal and wait for user decision
        setConflictObject(object);
        setIsConflictModalOpen(true);
        
        // Wait for user decision
        const decision = await new Promise(resolve => {
          // Set up handlers for the modal actions
          window.resolveConflict = resolve;
        });
        
        // Handle based on user decision
        if (decision === 'skip') {
          setUploadProgress(prev => ({
            ...prev,
            [object.name]: 100
          }));
          continue;
        } else if (decision === 'rename') {
          // Upload with a new name
          const newObjectname = generateNewObjectname(object.name);
          await uploadObject(object, { newObjectname });
        } else if (decision === 'replace') {
          await uploadObject(object, { replace: true });
        }
      } else {
        await uploadObject(object);
      }
    }
    
    onUploadSuccess();
    setSelectedObjects([]);
    if (objectInputRef.current) {
      objectInputRef.current.value = '';
    }
    
    setUploading(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (selectedObjects.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    try {
      await processUploadQueue(selectedObjects);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedObjects([]);
    setError(null);
    if (objectInputRef.current) {
      objectInputRef.current.value = '';
    }
  };

  // Conflict resolution handlers
  const handleSkip = () => {
    window.resolveConflict('skip');
    setIsConflictModalOpen(false);
    setConflictObject(null);
  };

  const handleReplace = () => {
    window.resolveConflict('replace');
    setIsConflictModalOpen(false);
    setConflictObject(null);
  };

  const handleRename = () => {
    window.resolveConflict('rename');
    setIsConflictModalOpen(false);
    setConflictObject(null);
  };

  const handleCloseModal = () => {
    window.resolveConflict('skip'); // Default to skip if modal is closed
    setIsConflictModalOpen(false);
    setConflictObject(null);
  };

  return (
    <div className={styles.uploadContainer}>
      <form className={styles.uploadForm} onSubmit={handleUpload}>
        <div 
          className={styles.dropzone}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input 
            type="file" 
            onChange={handleObjectChange} 
            className={styles.objectInput}
            multiple
            ref={objectInputRef}
          />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.uploadIcon}>
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
          </svg>
          <p>Drag and drop files here, or click to select files</p>
          {selectedObjects.length > 0 && (
            <div className={styles.selectedObjects}>
              <p>{selectedObjects.length} file(s) selected</p>
              <ul className={styles.objectList}>
                {selectedObjects.map((object, index) => (
                  <li key={index} className={styles.objectItem}>
                    <span className={styles.objectName}>{object.name}</span>
                    <span className={styles.objectSize}>({(object.size / 1024).toFixed(2)} KB)</span>
                    {uploading && (
                      <div className={styles.progressBar}>
                        <div 
                          className={`${styles.progressFill} ${uploadProgress[object.name] === -1 ? styles.progressError : ''}`}
                          style={{ width: `${uploadProgress[object.name] > 0 ? uploadProgress[object.name] : 0}%` }}
                        ></div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {error && (
          <div className={styles.error}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </div>
        )}
        
        <div className={styles.buttonGroup}>
          <button 
            type="submit" 
            className={styles.uploadButton}
            disabled={uploading || selectedObjects.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
          {selectedObjects.length > 0 && !uploading && (
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <ObjectConflictModal
        isOpen={isConflictModalOpen}
        onClose={handleCloseModal}
        conflictObject={conflictObject}
        onSkip={handleSkip}
        onReplace={handleReplace}
        onRename={handleRename}
      />
    </div>
  );
} 