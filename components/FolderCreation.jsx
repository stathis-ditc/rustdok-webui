import { useState, useEffect } from 'react';
import styles from '../styles/FolderCreation.module.css';
import { getBaseApiUrl } from '../config';

export default function FolderCreation({ onFolderCreated, bucket, currentPrefix, files }) {
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Please enter a folder name');
      return;
    }
    
    // Combine current prefix with new folder name
    const fullFolderPath = currentPrefix 
      ? `${currentPrefix}${folderName}`
      : folderName;
    
    // Check if a folder with the same name already exists
    if (files && Array.isArray(files)) {
      const folderExists = files.some(file => {
        const result = file.name === fullFolderPath + '/';
        console.log(`Comparing: "${file.name}" with "${fullFolderPath}/" = ${result}`);
        return result;
      });

      if (folderExists) {
        setError(`A folder named "${folderName.trim()}" already exists`);
        return;
      }
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      console.log('Creating folder:', folderName);
      
      // Use the getBaseApiUrl function to get the correct API URL
      const baseUrl = getBaseApiUrl();
      const folderUrl = `${baseUrl}/bucket/${bucket}/folders`;
      
      console.log('Creating folder using URL:', folderUrl);
      
      const response = await fetch(folderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: fullFolderPath }),
      });
      
      if (!response.ok) {
        // Check if the error is a conflict (folder already exists)
        if (response.status === 409) {
          const errorData = await response.json();
          setError(`A folder named "${folderName.trim()}" already exists`);
          return;
        }
        throw new Error('Failed to create folder');
      }
      
      const data = await response.json();
      onFolderCreated();
      setFolderName('');
    } catch (err) {
      setError(`Error creating folder: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.folderCreationContainer}>
      <form onSubmit={handleSubmit} className={styles.folderForm}>
        <input
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Enter folder name"
          className={styles.folderInput}
          autoFocus
        />
        <div className={styles.formButtons}>
          <button
            type="submit"
            className={styles.createButton}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </form>
    </div>
  );
} 