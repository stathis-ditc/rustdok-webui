import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/ObjectList.module.css';
import FolderCreation from './FolderCreation';
import { isFolder, getDisplayName, formatObjectSize } from '../utils/objectHelpers';
import { getBaseApiUrl } from '../config';

export default function ObjectList({ objects, onDelete, downloadUrlPrefix, bucket, onPreview, folderCreationProps, uploadUrl, onUploadSuccess, onFolderClick }) {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [objectToDelete, setObjectToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedObject, setDraggedObject] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const objectInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const { showFolderCreation, setShowFolderCreation } = folderCreationProps || {};
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [isDraggingOverPopup, setIsDraggingOverPopup] = useState(false);
  const [isDraggingOverList, setIsDraggingOverList] = useState(false);
  const [activeUploads, setActiveUploads] = useState([]);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [conflictObjects, setConflictObjects] = useState([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [conflictResolutions, setConflictResolutions] = useState({});
  const [uploadingObjects, setUploadingObjects] = useState([]);


  const handleDownload = (objectname) => {
    const downloadUrl = `${downloadUrlPrefix.replace('/object', '/download')}${encodeURIComponent(objectname)}`;
    window.open(downloadUrl, '_blank');
  };

  const handlePreview = (objectname) => {
    if (onPreview) {
      onPreview(objectname);
    }
  };

  // Handle folder click to navigate into the folder
  const handleFolderClick = (folderName) => {
    console.log('ObjectList: Folder clicked:', folderName);
    
    if (typeof onFolderClick === 'function') {
      // Make sure we're passing the folder name correctly
      // In object storage, folders are represented by keys ending with '/'
      // Ensure the folder name ends with a slash
      const folderPath = folderName.endsWith('/') ? folderName : `${folderName}/`;
      console.log('Navigating to folder path:', folderPath);
      onFolderClick(folderPath);
    } else {
      console.warn('No onFolderClick handler provided');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSortChange = (e) => {
    setSortField(e.target.value);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleDeleteClick = (obj) => {
    if (typeof obj === 'string') {
      const fileObj = objects.find(object => object.name === obj);
      setObjectToDelete(fileObj ? fileObj.name : obj);
    } else {
      setObjectToDelete(obj.name);
    }
    setShowDeleteConfirm(true);
  };

  // Add a function to handle bulk delete
  const handleBulkDelete = () => {
    if (selectedObjects.length > 0) {
      setObjectToDelete(null);
      setShowDeleteConfirm(true);
    }
  };

  // Update the confirmDelete function to handle bulk delete
  const confirmDelete = async () => {
    try {
      if (selectedObjects.length > 0) {
        // Bulk delete
        const deletePromises = selectedObjects.map(async (objectname) => {
          const fileObj = objects.find(object => object.name === objectname);
          const success = await onDelete(fileObj || objectname, bucket);
          return { objectname, success };
        });
        
        // Wait for all delete operations to complete
        const results = await Promise.all(deletePromises);
        
        // Log results for debugging
        console.log('Bulk delete results:', results);
        
        // Clear selection regardless of success/failure
        setSelectedObjects([]);
      } else if (objectToDelete) {
        const fileObj = objects.find(object => object.name === objectToDelete);
        // Pass the file object if found,  pass the filename
        await onDelete(fileObj || objectToDelete, bucket);
      }
      setShowDeleteConfirm(false);
      setObjectToDelete(null);
    } catch (error) {
      console.error('Error deleting object:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setObjectToDelete(null);
  };

  const sortedObjects = Array.isArray(objects) ? [...objects].sort((a, b) => {
    // Handle folders first if sorting by name
    if (sortField === 'name') {
      const aIsFolder = isFolder(a);
      const bIsFolder = isFolder(b);
      
      if (aIsFolder && !bIsFolder) return sortDirection === 'asc' ? -1 : 1;
      if (!aIsFolder && bIsFolder) return sortDirection === 'asc' ? 1 : -1;
    }
    
    // Handle undefined or null values
    if (a[sortField] === undefined && b[sortField] === undefined) return 0;
    if (a[sortField] === undefined) return sortDirection === 'asc' ? 1 : -1;
    if (b[sortField] === undefined) return sortDirection === 'asc' ? -1 : 1;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  const getObjectIcon = (objectname) => {
    // Check if objectname is undefined or null
    if (!objectname) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
        </svg>
      );
    }
    
    const extension = objectname.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v1.25c0 .41-.34.75-.75.75s-.75-.34-.75-.75V8c0-.55.45-1 1-1H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2c-.28 0-.5-.22-.5-.5v-5c0-.28.22-.5.5-.5h2c.83 0 1.5.67 1.5 1.5v3zm4-3.75c0 .41-.34.75-.75.75H19v1h.75c.41 0 .75.34.75.75s-.34.75-.75.75H19v1.25c0 .41-.34.75-.75.75s-.75-.34-.75-.75V8c0-.55.45-1 1-1h1.25c.41 0 .75.34.75.75.75zM9 9.5h1v-1H9v1zM3 6c-.55 0-1 .45-1 1v13c0 1.1.9 2 2 2h13c.55 0 1-.45 1-1s-.45-1-1-1H5c-.55 0-1-.45-1-1V7c0-.55-.45-1-1-1zm11 5.5h1v-3h-1v3z"/>
        </svg>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      );
    } else if (['doc', 'docx', 'txt', 'rtf', 'md', 'html'].includes(extension)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
      );
    } else if (objectname.endsWith('/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
        </svg>
      );
    }
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown';
      
      // Format the date in a user-friendly way
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const getObjectName = (object) => {
    if (typeof object === 'string') {
      const cleanPath = object.replace(/^\/+|\/+$/g, '');
      if (!cleanPath) return "Unnamed object";
      const parts = cleanPath.split('/');
      return parts[parts.length - 1] || "Unnamed object";
    }
    
    if (object && typeof object === 'object') {
      if (object.name) {
        const cleanPath = object.name.replace(/^\/+|\/+$/g, '');
        if (!cleanPath) return "Unnamed object";
        const parts = cleanPath.split('/');
        return parts[parts.length - 1] || "Unnamed object";
      }
      
      // Fallbacks for other possible structures
      if (object.key) {
        const cleanPath = object.key.replace(/^\/+|\/+$/g, '');
        if (!cleanPath) return "Unnamed object";
        const parts = cleanPath.split('/');
        return parts[parts.length - 1] || "Unnamed object";
      }
      
      if (object.path) {
        const cleanPath = object.path.replace(/^\/+|\/+$/g, '');
        if (!cleanPath) return "Unnamed object";
        const parts = cleanPath.split('/');
        return parts[parts.length - 1] || "Unnamed object";
      }
    }
    
    return "Unnamed object";
  };

  const openUploadPopup = () => {
    setShowUploadPopup(true);
  };

  const closeUploadPopup = () => {
    setShowUploadPopup(false);
    setIsDraggingOverPopup(false);
  };

  const handleObjectInputChange = (e) => {
    
    if (e.target.files && e.target.files.length > 0) {
      handleObjectUpload(e.target.files);
    } else {
      console.log('No files selected');
    }
  };

  const checkObjectConflicts = (objectsToCheck) => {
    const existingObjectNames = objects.map(object => object.name);
    const conflicts = [];
    
    Array.from(objectsToCheck).forEach(object => {
      let objectName = object.name;
      
      // If we're in a folder, we need to check with the prefix
      if (uploadUrl && uploadUrl.includes('prefix=')) {
        try {
          const urlObj = new URL(uploadUrl, window.location.origin);
          const prefix = urlObj.searchParams.get('prefix') || '';
          objectName = `${prefix}${object.name}`;
        } catch (error) {
          console.error('Error parsing URL:', error);
        }
      }
      
      if (existingObjectNames.includes(objectName)) {
        conflicts.push({
          object,
          originalName: object.name,
          fullPath: objectName
        });
      }
    });
    
    return conflicts;
  };
  
  // Handle conflict resolution
  const handleConflictResolution = (resolution) => {
    const currentConflict = conflictObjects[currentConflictIndex];
    
    // Store the resolution for this object
    setConflictResolutions(prev => ({
      ...prev,
      [currentConflict.fullPath]: resolution
    }));
    
    // Move to the next conflict or proceed with upload if all conflicts are resolved
    if (currentConflictIndex < conflictObjects.length - 1) {
      setCurrentConflictIndex(currentConflictIndex + 1);
    } else {
      setShowConflictDialog(false);
      
      const objectsToUpload = Array.from(conflictObjects).filter(conflict => {
        const resolution = conflictResolutions[conflict.fullPath] || 'cancel';
        return resolution !== 'cancel';
      });
      
      const nonConflictingObjects = uploadingObjects.filter(object => {
        // Check if this object is in the conflicts list
        return !conflictObjects.some(conflict => conflict.object === object);
      });
      
      // Combine non-conflicting files with resolved conflict files
      const finalObjectsToUpload = [...nonConflictingObjects, ...objectsToUpload.map(conflict => conflict.object)];
      
      // Proceed with upload if there are files to upload
      if (finalObjectsToUpload.length > 0) {
        processObjectUpload(finalObjectsToUpload);
      }
    }
  };
  
  const generateUniqueObjectname = (originalName) => {
    const existingObjectNames = objects.map(object => object.name);

    const lastDotIndex = originalName.lastIndexOf('.');
    const hasExtension = lastDotIndex !== -1;
    
    const baseName = hasExtension ? originalName.substring(0, lastDotIndex) : originalName;
    const extension = hasExtension ? originalName.substring(lastDotIndex) : '';
    
    // Try adding numbers until we find a unique name
    let counter = 1;
    let newName = `${baseName} (${counter})${extension}`;
    
    while (existingObjectNames.includes(newName)) {
      counter++;
      newName = `${baseName} (${counter})${extension}`;
    }
    
    return newName;
  };

  const handleObjectUpload = async (objects) => {
    if (!objects || objects.length === 0) return;
    
    // Check if uploadUrl is provided
    if (!uploadUrl) {
      console.error('Upload URL is not provided');
      alert('Upload URL is not configured. Please contact the administrator.');
      return;
    }
    
    // Store files temporarily - ensure it's an array
    setUploadingObjects(Array.from(objects));
    
    // Check for file conflicts
    const conflicts = checkObjectConflicts(objects);
    
    if (conflicts.length > 0) {
      // Set up conflict resolution
      setConflictObjects(conflicts);
      setCurrentConflictIndex(0);
      setConflictResolutions({});
      setShowConflictDialog(true);
    } else {
      // No conflicts, proceed with upload
      processObjectUpload(objects);
    }
  };
  
  // Process the actual file upload after conflict resolution
  const processObjectUpload = async (objects) => {
    // Initialize upload progress tracking
    const objectsToUpload = Array.from(objects).map(object => {
      // Check if this object has a rename resolution
      let objectName = object.name;
      let objectToUpload = object;
      
      // If we're in a folder, we need to include the prefix for the full path
      let prefix = '';
      if (uploadUrl && uploadUrl.includes('prefix=')) {
        try {
          const urlObj = new URL(uploadUrl, window.location.origin);
          prefix = urlObj.searchParams.get('prefix') || '';
        } catch (error) {
          console.error('Error parsing URL:', error);
        }
      }
      
      const fullPath = `${prefix}${object.name}`;
      
      // Check if this object has a rename resolution
      if (conflictResolutions[fullPath] === 'rename') {
        const newName = generateUniqueObjectname(object.name);
        
        const renamedObject = new File([object], newName, { type: object.type });
        objectToUpload = renamedObject;
        objectName = newName;
      }
      
      return {
        id: Math.random().toString(36).substring(2, 15),
        name: objectName,
        size: objectToUpload.size,
        object: objectToUpload,
        progress: 0,
        status: 'pending' // pending, uploading, completed, error
      };
    });
    
    setActiveUploads(objectsToUpload);
    setShowProgressPanel(true);
    
    // If we're in a folder, we need to include the prefix
    let prefix = '';
    if (uploadUrl.includes('prefix=')) {
      try {
        const urlObj = new URL(uploadUrl, window.location.origin);
        prefix = urlObj.searchParams.get('prefix') || '';
        console.log('Current prefix from URL:', prefix);
      } catch (error) {
        console.error('Error parsing URL:', error);
      }
    }
    
    try {
      // Upload each file individually to track progress
      const uploadPromises = objectsToUpload.map(async (objectInfo, index) => {
        const formData = new FormData();
        
        // Don't prepend the prefix to the file name, just append the file with its original name
        // The prefix will be handled server-side via the URL parameter
        formData.append('objects', objectInfo.object);
        
        // Update object status to uploading
        setActiveUploads(current => 
          current.map((item, i) => 
            i === index ? { ...item, status: 'uploading' } : item
          )
        );
        
        try {
          const xhr = new XMLHttpRequest();
          
          // Create a promise that resolves when the upload is complete
          const uploadPromise = new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                
                // Update progress for this specific file
                setActiveUploads(current => 
                  current.map((item, i) => 
                    i === index ? { ...item, progress: percentComplete } : item
                  )
                );
              }
            });
            
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // Update file status to completed
                setActiveUploads(current => 
                  current.map((item, i) => 
                    i === index ? { ...item, status: 'completed', progress: 100 } : item
                  )
                );
                resolve();
              } else {
                // Update file status to error
                setActiveUploads(current => 
                  current.map((item, i) => 
                    i === index ? { ...item, status: 'error' } : item
                  )
                );
                reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
              }
            });
            
            xhr.addEventListener('error', () => {
              // Update file status to error
              setActiveUploads(current => 
                current.map((item, i) => 
                  i === index ? { ...item, status: 'error' } : item
              ));
              reject(new Error('Network error occurred during upload'));
            });
            
            xhr.addEventListener('abort', () => {
              // Update file status to error
              setActiveUploads(current => 
                current.map((item, i) => 
                  i === index ? { ...item, status: 'error' } : item
              ));
              reject(new Error('Upload was aborted'));
            });
          });
          
          xhr.open('POST', uploadUrl);
          xhr.send(formData);
          
          return uploadPromise;
        } catch (error) {
          console.error(`Error uploading object ${objectInfo.name}:`, error);
          
          // Update file status to error
          setActiveUploads(current => 
            current.map((item, i) => 
              i === index ? { ...item, status: 'error' } : item
          ));
          
          throw error;
        }
      });
      
      // Wait for all uploads to complete
      await Promise.allSettled(uploadPromises);
      
      console.log('All uploads completed');
      closeUploadPopup();
      
      // Show a success message
      const successMessage = document.createElement('div');
      successMessage.className = styles.uploadSuccessMessage;
      successMessage.textContent = 'Objects uploaded successfully!';
      document.body.appendChild(successMessage);
      
      // Remove the success message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
      
      // Hide the progress panel after 2 seconds
      setTimeout(() => {
        setShowProgressPanel(false);
        setActiveUploads([]);
      }, 2000);
      
      // Use the onUploadSuccess prop if provided
      if (typeof onUploadSuccess === 'function') {
        onUploadSuccess();
      } else if (typeof window.handleUploadSuccess === 'function') {
        // Fall back to window.handleUploadSuccess for backward compatibility
        window.handleUploadSuccess();
      } else {
        // Fall back to page reload if callbacks not available
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(`Error uploading files: ${error.message}`);
      
      // Don't hide the progress panel on error, so the user can see which files failed
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    
    // Check if this is an internal drag operation
    const isInternalDrag = e.dataTransfer.types.includes('application/rustdok-internal');
    
    // Only show the upload overlay for external drags
    if (!isInternalDrag && !draggedObject) {
      setIsDraggingOverPopup(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOverPopup(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOverPopup(false);
    
    console.log('Files dropped on file list');
    
    // Check if this is an internal drag operation
    const isInternalDrag = e.dataTransfer.types.includes('application/rustdok-internal');
    
    if (!isInternalDrag && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log('Number of dropped files:', e.dataTransfer.files.length);
      handleObjectUpload(e.dataTransfer.files);
    } else {
      console.log('Internal drag or no files found in drop event');
    }
  };

  // Add a function to handle checkbox selection
  const handleCheckboxChange = (object, isChecked) => {
    if (isChecked) {
      setSelectedObjects([...selectedObjects, object.name]);
    } else {
      setSelectedObjects(selectedObjects.filter(name => name !== object.name));
    }
  };

  // Add a function to handle "select all" checkbox
  const handleSelectAllChange = (isChecked) => {
    if (isChecked) {
      const allObjectNames = sortedObjects.map(object => object.name);
      setSelectedObjects(allObjectNames);
    } else {
      setSelectedObjects([]);
    }
  };

  // Add functions for new folder creation
  const openNewFolderPopup = () => {
    setShowNewFolderPopup(true);
    setNewFolderName('');
  };

  const closeNewFolderPopup = () => {
    setShowNewFolderPopup(false);
    setNewFolderName('');
  };

  const handleNewFolderNameChange = (e) => {
    setNewFolderName(e.target.value);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    // Validate folder name (allow letters, numbers, spaces, underscores, and hyphens)
    const folderNameRegex = /^[a-zA-Z0-9_\- ]+$/;
    if (!folderNameRegex.test(newFolderName.trim())) {
      alert('Folder name can only contain letters, numbers, spaces, underscores, and hyphens');
      return;
    }

    // Create the folder path with trailing slash to represent a prefix
    // In object storage, folders are just prefixes ending with a delimiter (usually '/')
    let folderPath = newFolderName.trim();

    // If we're in a subfolder (prefix exists in the URL), prepend it to the folder path
    const prefix = new URLSearchParams(window.location.search).get('prefix') || '';
    if (prefix) {
      folderPath = prefix + folderPath;
    }

    console.log('Creating folder/prefix:', folderPath);

    // Check if a folder with the same name already exists
    const folderExists = sortedObjects.some(object => {
      const result = object.name === folderPath + '/';
      console.log(`Comparing: "${object.name}" with "${folderPath}/" = ${result}`);
      return result;
    });

    if (folderExists) {
      alert(`A folder named "${newFolderName.trim()}" already exists`);
      return;
    }

    try {
      // Use the dedicated folder creation API endpoint
      const baseUrl = getBaseApiUrl();
      const apiUrl = `${baseUrl}/bucket/${bucket}/folders`;

      console.log('Creating folder using API endpoint:', apiUrl);
      console.log('Folder name:', folderPath);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: folderPath }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create folder/prefix:', errorText);
        alert(`Failed to create folder: ${response.status} ${response.statusText}\n${errorText}`);
        return;
      }

      console.log('Folder/prefix created successfully');
      closeNewFolderPopup();
      // Refresh the page to show the new folder
      window.location.reload();
    } catch (error) {
      console.error('Error creating folder/prefix:', error);
      alert(`Error creating folder: ${error.message}`);
    }
  };

  // Handle file drag start
  const handleDragStart = (e, file) => {
    // Set the dragged object
    setDraggedObject(file);
    
    // Set data for the drag operation
    e.dataTransfer.setData('text/plain', file.name);
    
    // Set a custom data attribute to identify internal drag operations
    e.dataTransfer.setData('application/rustdok-internal', 'true');
    
    // Set the drag effect
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a custom class to the drag image
    if (e.target.classList) {
      e.target.classList.add(styles.dragging);
    }
    
    console.log('Drag started with object:', file.name);
  };

  // Handle drag over a folder
  const handleFolderDragOver = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow if we're dragging a file (not a folder) over a folder
    if (draggedObject && !isFolder(draggedObject) && isFolder(folder)) {
      // Set the drop effect to 'move'
      e.dataTransfer.dropEffect = 'move';
      
      // Highlight the folder
      setDragOverFolder(folder.name);
    }
  };

  // Handle drag leave from a folder
  const handleFolderDragLeave = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove the highlight
    if (dragOverFolder === folder.name) {
      setDragOverFolder(null);
    }
  };

  // Handle drop on a folder
  const handleFolderDrop = async (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear the highlight
    setDragOverFolder(null);
    
    // Check if we have a dragged file and it's being dropped on a folder
    if (draggedObject && !isFolder(draggedObject) && isFolder(folder)) {
      console.log(`Moving object ${draggedObject.name} to folder ${folder.name}`);
      
      try {
        // Get the source and destination paths
        const sourceObject = draggedObject.name;
        
        // Get the folder path (remove trailing slash if present)
        const folderPath = folder.name.endsWith('/') ? folder.name : `${folder.name}/`;
        
        // Get just the objectname without the path
        const objectname = sourceObject.split('/').pop();
        
        // Create the destination path
        const destinationFile = `${folderPath}${objectname}`;
        
        console.log(`Moving from ${sourceObject} to ${destinationFile}`);
        
        // Call the API to move the object
        const response = await fetch(`/api/move?bucket=${bucket}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceKey: sourceObject,
            destinationKey: destinationFile,
          }),
        });
        
        if (response.ok) {
          console.log('Object moved successfully');
          // Refresh the object list
          window.location.reload();
        } else {
          const errorText = await response.text();
          console.error('Failed to move object:', errorText);
          alert(`Failed to move object: ${response.status} ${response.statusText}\n${errorText}`);
        }
      } catch (error) {
        console.error('Error moving object:', error);
        alert(`Error moving object: ${error.message}`);
      }
      
      // Clear the dragged object
      setDraggedObject(null);
    }
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    // Remove the dragging class
    if (e.target.classList) {
      e.target.classList.remove(styles.dragging);
    }
    
    // Clear the dragged object and drag over folder
    setDraggedObject(null);
    setDragOverFolder(null);
  };

  return (
    <div 
      className={`${styles.fileListContainer} ${isDraggingOverList ? styles.dragging : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        
        // Check if this is an internal drag operation
        const isInternalDrag = e.dataTransfer.types.includes('application/rustdok-internal');
        
        // Only show the upload overlay for external drags (not for internal file moves)
        if (!isInternalDrag && !draggedObject) {
          setIsDraggingOverList(true);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        // Only set to false if we're leaving the container (not entering a child)
        if (e.currentTarget.contains(e.relatedTarget)) {
          return;
        }
        setIsDraggingOverList(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOverList(false);
        
        console.log('Files dropped on file list');
        
        // Check if this is an internal drag operation
        const isInternalDrag = e.dataTransfer.types.includes('application/rustdok-internal');
        
        if (!isInternalDrag && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          console.log('Number of dropped files:', e.dataTransfer.files.length);
          handleObjectUpload(e.dataTransfer.files);
        } else {
          console.log('Internal drag or no files found in drop event');
        }
      }}
    >
      {isDraggingOverList && !draggedObject && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropMessage}>
            <svg className={styles.dropIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>Drop files here to upload</p>
          </div>
        </div>
      )}
      
      <div className={styles.fileListControls}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <svg className={styles.viewIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <svg className={styles.viewIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
        </div>
        
        <div className={styles.rightControls}>
          {selectedObjects.length > 0 && (
            <button
              className={styles.bulkDeleteButton}
              onClick={handleBulkDelete}
              title="Delete Selected"
            >
              <svg className={styles.bulkDeleteIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete Selected ({selectedObjects.length})
            </button>
          )}
          
          <button
            className={styles.uploadButton}
            onClick={openUploadPopup}
            title="Upload Objects"
          >
            <svg className={styles.uploadIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload
          </button>
          
          <button
            className={styles.uploadButton}
            onClick={() => folderCreationProps?.setShowFolderCreation(true)}
            title="New Folder"
          >
            <svg className={styles.uploadIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
            New Folder
          </button>
        </div>
      </div>

      {/* File list content */}
      {viewMode === 'list' && (
        <table className={styles.fileList}>
          <thead className={styles.fileListHeader}>
            <tr>
              <th className={styles.fileListHeaderItem} style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAllChange(e.target.checked)}
                  checked={selectedObjects.length > 0 && selectedObjects.length === sortedObjects.length}
                  className={styles.checkbox}
                />
              </th>
              <th className={styles.fileListHeaderItem} onClick={() => handleSort('name')}>
                Name
                {sortField === 'name' && (
                  <span className={styles.sortIndicator}>
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th className={styles.fileListHeaderItem} onClick={() => handleSort('size')}>
                Size
                {sortField === 'size' && (
                  <span className={styles.sortIndicator}>
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th className={styles.fileListHeaderItem} onClick={() => handleSort('last_modified')}>
                Last Modified
                {sortField === 'last_modified' && (
                  <span className={styles.sortIndicator}>
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th className={styles.fileListHeaderItem}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedObjects.map((object, index) => (
              <tr 
                key={object.name} 
                className={`${styles.fileListRow} ${selectedObjects.includes(object.name) ? styles.selected : ''} ${isFolder(object) ? styles.folder : ''} ${dragOverFolder === object.name ? styles.dragOver : ''}`}
                draggable={!isFolder(object)}
                onDragStart={(e) => !isFolder(object) && handleDragStart(e, object)}
                onDragOver={(e) => isFolder(object) && handleFolderDragOver(e, object)}
                onDragLeave={(e) => isFolder(object) && handleFolderDragLeave(e, object)}
                onDrop={(e) => isFolder(object) && handleFolderDrop(e, object)}
                onDragEnd={handleDragEnd}
              >
                <td onClick={(e) => {
                  // Stop propagation to prevent double toggling when clicking directly on checkbox
                  e.stopPropagation();
                  handleCheckboxChange(object, !selectedObjects.includes(object.name));
                }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxChange(object, e.target.checked);
                    }}
                    checked={selectedObjects.includes(object.name)}
                    className={styles.checkbox}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td>
                  <div 
                    className={styles.fileListName} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFolder(object)) {
                        handleFolderClick(object.name);
                      } else {
                        handlePreview(object.name);
                      }
                    }}
                  >
                    {getObjectIcon(object.name)}
                    {getObjectName(object)}
                  </div>
                </td>
                <td className={styles.fileListSize}>{formatObjectSize(object.size)}</td>
                <td className={styles.fileListSize}>{formatDate(object.last_modified)}</td>
                <td>
                  <div className={styles.fileListActions}>

                    <button
                      className={`${styles.actionButton} ${styles.download}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(object.name);
                      }}
                      title="Download"
                    >
                      <svg className={styles.actionIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.delete}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(object.name);
                      }}
                      title="Delete"
                    >
                      <svg className={styles.actionIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewMode === 'grid' && (
        <div className={styles.fileGrid}>
          {sortedObjects.map((object, index) => (
            <div 
              key={object.name} 
              className={`${styles.fileCard} ${selectedObjects.includes(object.name) ? styles.selected : ''} ${isFolder(object) ? styles.folder : ''} ${dragOverFolder === object.name ? styles.dragOver : ''}`}
              draggable={!isFolder(object)}
              onDragStart={(e) => !isFolder(object) && handleDragStart(e, object)}
              onDragOver={(e) => isFolder(object) && handleFolderDragOver(e, object)}
              onDragLeave={(e) => isFolder(object) && handleFolderDragLeave(e, object)}
              onDrop={(e) => isFolder(object) && handleFolderDrop(e, object)}
              onDragEnd={handleDragEnd}
              onClick={(e) => {
                // Don't toggle selection if clicking on action buttons or checkbox
                if (!e.target.closest(`.${styles.fileActions}`) && 
                    !e.target.closest(`.${styles.checkbox}`)) {
                  // If it's a folder, navigate into it
                  if (isFolder(object)) {
                    handleFolderClick(object.name);
                  } else {
                    // If it's a file, show preview
                    handlePreview(object.name);
                  }
                }
              }}
            >
              <div className={styles.fileCardCheckbox}>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCheckboxChange(object, e.target.checked);
                  }}
                  checked={selectedObjects.includes(object.name)}
                  className={styles.checkbox}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div 
                className={styles.fileIconContainer} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFolder(object)) {
                    handleFolderClick(object.name);
                  } else {
                    handlePreview(object.name);
                  }
                }}
              >
                {getObjectIcon(object.name)}
              </div>
              <div className={styles.fileInfo}>
                <h3 
                  className={styles.fileName} 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isFolder(object)) {
                      handleFolderClick(object.name);
                    } else {
                      handlePreview(object.name);
                    }
                  }}
                >
                  {getObjectName(object)}
                </h3>
                <p className={styles.fileSize}>{formatObjectSize(object.size)}</p>
                <p className={styles.fileDate}>{formatDate(object.last_modified)}</p>
              </div>
              <div className={styles.fileActions}>
                <button
                  className={`${styles.actionButton} ${styles.preview}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isFolder(object)) {
                      handleFolderClick(object.name);
                    } else {
                      handlePreview(object.name);
                    }
                  }}
                  title="Preview"
                >
                  <svg className={styles.actionIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button
                  className={`${styles.actionButton} ${styles.download}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(object.name);
                  }}
                  title="Download"
                >
                  <svg className={styles.actionIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <button
                  className={`${styles.actionButton} ${styles.delete}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(object.name);
                  }}
                  title="Delete"
                >
                  <svg className={styles.actionIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(!objects || !Array.isArray(objects) || objects.length === 0) && (
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <h3>No files in this bucket</h3>
          <p>Upload files to get started</p>
          <button className={styles.uploadButton} onClick={openUploadPopup}>
            <svg className={styles.uploadIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload Files
          </button>
        </div>
      )}

      {/* Upload Progress Panel */}
      {showProgressPanel && (
        <div className={styles.uploadProgressPanel}>
          <div className={styles.uploadProgressHeader}>
            <h4>Uploading Files</h4>
            <button 
              className={styles.closeProgressButton}
              onClick={() => setShowProgressPanel(false)}
            >
              <svg className={styles.closeIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className={styles.uploadProgressList}>
            {activeUploads.map((object, index) => (
              <div key={object.id} className={styles.uploadProgressItem}>
                <div className={styles.uploadProgressInfo}>
                  <div className={styles.uploadFileName}>
                    {object.name}
                  </div>
                  <div className={styles.uploadFileSize}>
                    {formatObjectSize(object.size)}
                  </div>
                </div>
                <div className={styles.uploadProgressBarContainer}>
                  <div 
                    className={`${styles.uploadProgressBar} ${object.status === 'error' ? styles.uploadProgressError : ''}`}
                    style={{ width: `${object.progress}%` }}
                  ></div>
                </div>
                <div className={styles.uploadProgressStatus}>
                  {object.status === 'pending' && 'Pending...'}
                  {object.status === 'uploading' && `${object.progress}%`}
                  {object.status === 'completed' && (
                    <svg className={styles.uploadCompleteIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  {object.status === 'error' && (
                    <svg className={styles.uploadErrorIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showConflictDialog && conflictObjects.length > 0 && (
        <div className={styles.conflictOverlay}>
          <div className={styles.conflictDialog}>
            <div className={styles.conflictHeader}>
              <h3>File Already Exists</h3>
              <button 
                className={styles.closeConflictButton}
                onClick={() => {
                  setShowConflictDialog(false);
                  // Cancel all remaining conflicts
                  const updatedResolutions = { ...conflictResolutions };
                  conflictObjects.forEach((conflict, index) => {
                    if (index >= currentConflictIndex) {
                      updatedResolutions[conflict.fullPath] = 'cancel';
                    }
                  });
                  setConflictResolutions(updatedResolutions);
                  
                  // Process files with resolved conflicts
                  const objectsToUpload = Array.from(conflictObjects).filter((conflict, index) => {
                    const resolution = index < currentConflictIndex ? 
                      conflictResolutions[conflict.fullPath] : 'cancel';
                    return resolution !== 'cancel';
                  });
                  
                  // Add non-conflicting files
                  const nonConflictingObjects = uploadingObjects.filter(object => {
                    return !conflictObjects.some(conflict => conflict.object === object);
                  });
                  
                  // Combine and upload if there are files to upload
                  const finalObjectsToUpload = [...nonConflictingObjects, ...objectsToUpload.map(conflict => conflict.object)];
                  if (finalObjectsToUpload.length > 0) {
                    processObjectUpload(finalObjectsToUpload);
                  }
                }}
              >
                <svg className={styles.closeIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className={styles.conflictContent}>
              <div className={styles.conflictFileInfo}>
                <svg className={styles.conflictWarningIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <p>
                  <strong>{conflictObjects[currentConflictIndex]?.originalName}</strong> already exists in this location.
                </p>
              </div>
              <p className={styles.conflictMessage}>
                What would you like to do?
              </p>
            </div>
            
            <div className={styles.conflictActions}>
              <button 
                className={styles.conflictButton}
                onClick={() => handleConflictResolution('cancel')}
              >
                Skip
              </button>
              <button 
                className={styles.conflictButton}
                onClick={() => handleConflictResolution('rename')}
              >
                Upload as Copy
              </button>
              <button 
                className={styles.conflictButton}
                onClick={() => handleConflictResolution('overwrite')}
              >
                Replace
              </button>
            </div>
            
            <div className={styles.conflictProgress}>
              <span>File {currentConflictIndex + 1} of {conflictObjects.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Popup */}
      {showUploadPopup && !draggedObject && (
        <div 
          className={styles.uploadPopupOverlay}
          onClick={(e) => {
            // Close the popup if the overlay (background) is clicked
            if (e.target === e.currentTarget) {
              closeUploadPopup();
            }
          }}
        >
          <div 
            className={`${styles.uploadPopup} ${isDraggingOverPopup ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <button className={styles.closePopupButton} onClick={closeUploadPopup}>
              <svg className={styles.closeIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className={styles.uploadPopupContent}>
              <svg className={styles.uploadIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              
              <h3>Upload Files to {bucket}</h3>
              
              <p className={styles.uploadPopupText}>
                Drag and drop files here or click the button below to select files
              </p>
              
              <input
                type="file"
                ref={objectInputRef}
                onChange={handleObjectInputChange}
                multiple
                style={{ display: 'none' }}
              />
              
              <button 
                className={styles.selectFilesButton}
                onClick={() => objectInputRef.current.click()}
              >
                Select Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div 
          className={styles.deleteConfirmOverlay}
          onClick={(e) => {
            // Close the dialog if the overlay (background) is clicked
            if (e.target === e.currentTarget) {
              cancelDelete();
            }
          }}
        >
          <div className={styles.deleteConfirmDialog}>
            <div className={styles.deleteConfirmHeader}>
              <h3 className={styles.deleteConfirmTitle}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.deleteConfirmIcon}>
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                {selectedObjects.length > 0 ? 'Delete Selected Files' : 'Delete File'}
              </h3>
              <button 
                className={styles.closeButton}
                onClick={cancelDelete}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.closeIcon}>
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41z" />
                </svg>
              </button>
            </div>
            <div className={styles.deleteConfirmBody}>
              <p className={styles.confirmationText}>
                {selectedObjects.length > 0 ? (
                  <>Are you sure you want to delete <strong>{selectedObjects.length}</strong> selected files?</>
                ) : (
                  <>Are you sure you want to delete <strong>{objectToDelete}</strong>?</>
                )}
              </p>
              <p className={styles.warningText}>
                This action cannot be undone.
              </p>
            </div>
            <div className={styles.deleteConfirmFooter}>
              <button className={styles.cancelButton} onClick={cancelDelete}>
                Cancel
              </button>
              <button className={styles.deleteButton} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render the FolderCreation component if showFolderCreation is true */}
      {folderCreationProps?.showFolderCreation && (
        <div 
          className={styles.uploadPopupOverlay}
          onClick={(e) => {
            // Close the popup if the overlay (background) is clicked
            if (e.target === e.currentTarget) {
              folderCreationProps?.setShowFolderCreation(false);
            }
          }}
        >
          <div className={styles.uploadPopup}>
            <button className={styles.closePopupButton} onClick={() => folderCreationProps?.setShowFolderCreation(false)}>
              <svg className={styles.closeIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className={styles.uploadPopupContent}>

              
              <h3>Create New Folder in {bucket}</h3>
              
              <FolderCreation 
                bucket={bucket} 
                currentPrefix={folderCreationProps?.currentPrefix || ''} 
                onFolderCreated={folderCreationProps?.onFolderCreated}
                objects={sortedObjects}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}