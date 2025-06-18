// components/FileUploadModal.js
import React, { useState } from 'react';

const FileUploadModal = ({ 
  isOpen, 
  onClose, 
  onFileUpload, 
  load, 
  acceptedTypes = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg,.jpeg',
    'image/png': '.png',
    'image/gif': '.gif',
    'text/plain': '.txt'
  },
  acceptedTypesLabel = 'PDF, Images (JPG, PNG, GIF), and Text files',
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [query, setQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      setSelectedFile(file);
    } else if (file) {
      alert(`File type not supported. Please select: ${acceptedTypesLabel}`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) {
      setSelectedFile(file);
    } else if (file) {
      alert(`File type not supported. Please select: ${acceptedTypesLabel}`);
    }
  };

  const isValidFile = (file) => {
    const isValidType = Object.keys(acceptedTypes).includes(file.type);
    const isValidSize = file.size <= maxFileSize;
    
    if (!isValidSize) {
      alert(`File too large. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(0)}MB`);
      return false;
    }
    
    return isValidType;
  };

  // Generate accept string for input
  const acceptString = Object.values(acceptedTypes).join(',');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFile) {
      await onFileUpload(selectedFile, query);
      setSelectedFile(null);
      setQuery('');
      onClose();
    }
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setQuery('');
    setDragOver(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload File</h2>
          <button className="close-btn" onClick={resetAndClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div
            className={`file-drop-zone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'file-selected' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="file-info">
                <div className="file-name">File selected: {selectedFile.name}</div>
                <div className="file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <div className="drop-text">
                <div>Drag and drop a file here, or click to select</div>
                <div className="supported-formats">
                  Supports {acceptedTypesLabel}
                </div>
              </div>
            )}
            
            <input
              type="file"
              onChange={handleFileSelect}
              accept={acceptString}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-input-label">
              Choose File
            </label>
          </div>

          <div className="query-section">
            <label htmlFor="query">Question or Instructions (optional)</label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to know about this file?"
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={resetAndClose} className="cancel-btn">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || load}
              className={`upload-btn ${!selectedFile || load ? 'disabled' : ''}`}
            >
              {load ? 'Processing...' : 'Upload and Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUploadModal;