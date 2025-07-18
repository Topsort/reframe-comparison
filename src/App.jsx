import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { fal } from '@fal-ai/client';

const presets = [
  { name: 'Square', width: 1024, height: 1024, aspectRatio: '1:1', imageSize: 'square_hd' },
  { name: 'Landscape 16:9', width: 1920, height: 1080, aspectRatio: '16:9', imageSize: 'landscape_16_9' },
  { name: 'Portrait 9:16', width: 1080, height: 1920, aspectRatio: '9:16', imageSize: 'portrait_9_16' },
  { name: 'Landscape 4:3', width: 1024, height: 768, aspectRatio: '4:3', imageSize: 'landscape_4_3' },
  { name: 'Portrait 3:4', width: 768, height: 1024, aspectRatio: '3:4', imageSize: 'portrait_3_4' },
  { name: 'Wide 21:9', width: 1920, height: 820, aspectRatio: '21:9', imageSize: 'landscape_16_9' },
];

// Helper function to find closest aspect ratio
function getClosestAspectRatio(width, height) {
  const ratio = width / height;
  const supportedRatios = [
    { ratio: 21/9, aspectRatio: '21:9' },
    { ratio: 16/9, aspectRatio: '16:9' },
    { ratio: 4/3, aspectRatio: '4:3' },
    { ratio: 3/2, aspectRatio: '3:2' },
    { ratio: 1/1, aspectRatio: '1:1' },
    { ratio: 2/3, aspectRatio: '2:3' },
    { ratio: 3/4, aspectRatio: '3:4' },
    { ratio: 9/16, aspectRatio: '9:16' },
    { ratio: 9/21, aspectRatio: '9:21' },
  ];
  
  let closest = supportedRatios[0];
  let minDiff = Math.abs(ratio - closest.ratio);
  
  for (const supported of supportedRatios) {
    const diff = Math.abs(ratio - supported.ratio);
    if (diff < minDiff) {
      minDiff = diff;
      closest = supported;
    }
  }
  
  return closest.aspectRatio;
}

// Helper function to find closest image size for Ideogram
function getClosestImageSize(width, height) {
  const ratio = width / height;
  
  if (ratio > 1.5) {
    return 'landscape_16_9';
  } else if (ratio > 1.1) {
    return 'landscape_4_3';
  } else if (ratio > 0.9) {
    return 'square_hd';
  } else if (ratio > 0.6) {
    return 'portrait_3_4';
  } else {
    return 'portrait_9_16';
  }
}

function App() {
  const apiKey = '9e400b0d-c0fc-4ad4-b924-dfe670146a5e:97e79737b2d402c92f9e590fc9c28b95';
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 1024, height: 1024 });
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // Load history from file on component mount
  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Load from backend API
      const response = await fetch('http://localhost:3001/api/history');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setHistory(data);
          console.log(`Loaded ${data.length} items from backend`);
        } else {
          console.log('No history found, starting fresh');
        }
      }
    } catch (error) {
      console.log('Backend not available, starting fresh');
    }
  };

  const saveHistory = async (newHistory) => {
    try {
      // Save to backend API
      const response = await fetch('http://localhost:3001/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history: newHistory }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ History saved to file: ${result.message}`);
      } else {
        console.error('Failed to save history to backend');
      }
    } catch (error) {
      console.error('Backend not available, could not save history:', error);
    }
  };

  const loadHistoryFromFile = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setHistory(data);
        } catch (error) {
          setError('Invalid history file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  const handlePresetSelect = (preset) => {
    setDimensions({ width: preset.width, height: preset.height });
    setIsCustom(false);
  };

  const handleCustomToggle = () => {
    setIsCustom(!isCustom);
  };

  const handleReframe = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      fal.config({ credentials: apiKey });

      // Upload image
      console.log('Uploading file:', selectedFile);
      const uploadResult = await fal.storage.upload(selectedFile);
      console.log('Upload result:', uploadResult);
      
      // The upload result is the URL string directly, not an object with a url property
      const imageUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult.url;

      if (!imageUrl) {
        throw new Error('Failed to upload image - no URL returned');
      }

      // Get the appropriate API parameters
      const aspectRatio = getClosestAspectRatio(dimensions.width, dimensions.height);
      const imageSize = getClosestImageSize(dimensions.width, dimensions.height);

      console.log('Image URL:', imageUrl);
      console.log('Aspect Ratio:', aspectRatio);
      console.log('Image Size:', imageSize);

      // Log the actual API payloads
      const imageEditingPayload = {
        image_url: imageUrl,
        aspect_ratio: aspectRatio
      };
      const ideogramPayload = {
        image_url: imageUrl,
        image_size: imageSize
      };
      
      console.log('Image Editing payload:', imageEditingPayload);
      console.log('Ideogram payload:', ideogramPayload);

      // Run both models in parallel
      const [imageEditingResult, ideogramResult] = await Promise.allSettled([
        fal.subscribe('fal-ai/image-editing/reframe', {
          input: imageEditingPayload
        }),
        fal.subscribe('fal-ai/ideogram/v3/reframe', {
          input: ideogramPayload
        })
      ]);

      // Check for errors and log results
      if (imageEditingResult.status === 'rejected') {
        console.error('Image Editing API failed:', imageEditingResult.reason);
      } else {
        console.log('Image Editing API success:', imageEditingResult.value);
      }
      
      if (ideogramResult.status === 'rejected') {
        console.error('Ideogram API failed:', ideogramResult.reason);
      } else {
        console.log('Ideogram API success:', ideogramResult.value);
      }

      const newResult = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        original: preview,
        imageEditing: imageEditingResult.status === 'fulfilled' && imageEditingResult.value?.data?.images?.[0]?.url || null,
        ideogram: ideogramResult.status === 'fulfilled' && ideogramResult.value?.data?.images?.[0]?.url || null,
        dimensions,
        usedAspectRatio: aspectRatio,
        usedImageSize: imageSize,
        imageEditingError: imageEditingResult.status === 'rejected' ? imageEditingResult.reason?.message || 'Unknown error' : null,
        ideogramError: ideogramResult.status === 'rejected' ? ideogramResult.reason?.message || 'Unknown error' : null
      };

      setResults(newResult);

      // Add to history
      const newHistory = [newResult, ...history];
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>AI Reframe Comparison</h1>
        <p>Compare image reframing between FAL.AI's Image Editing and Ideogram V3 models</p>
      </div>

      <div className="main-card">
        <div className="grid">
          <div>
            <h3>Upload Image</h3>
            <div
              {...getRootProps()}
              className={`upload-area ${isDragActive ? 'active' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="upload-icon">📷</div>
              <p>{isDragActive ? 'Drop image here' : 'Drag & drop an image or click to select'}</p>
              <p style={{ fontSize: '14px', color: '#666' }}>Supports: JPEG, PNG, WebP</p>
            </div>
            {preview && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
              </div>
            )}
          </div>

          <div>
            <h3>Select Dimensions</h3>
            <div className="dimension-grid">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  className={`dimension-btn ${!isCustom && dimensions.width === preset.width && dimensions.height === preset.height ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <strong>{preset.name}</strong>
                  <span>{preset.width} × {preset.height}</span>
                  <small style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '4px' }}>
                    {preset.aspectRatio}
                  </small>
                </button>
              ))}
            </div>
            
            <button
              className={`dimension-btn ${isCustom ? 'active' : ''}`}
              onClick={handleCustomToggle}
              style={{ width: '100%' }}
            >
              <strong>Custom</strong>
              <span>Set your own dimensions</span>
            </button>

            {isCustom && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">Width</label>
                    <input
                      type="number"
                      className="form-input"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: parseInt(e.target.value) || 0 })}
                      placeholder="1024"
                    />
                  </div>
                  <div>
                    <label className="form-label">Height</label>
                    <input
                      type="number"
                      className="form-input"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: parseInt(e.target.value) || 0 })}
                      placeholder="1024"
                    />
                  </div>
                </div>
                {dimensions.width > 0 && dimensions.height > 0 && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '14px' }}>
                    <strong>API Mapping:</strong><br />
                    Image Editing: {getClosestAspectRatio(dimensions.width, dimensions.height)}<br />
                    Ideogram: {getClosestImageSize(dimensions.width, dimensions.height)}<br />
                    <small style={{ color: '#666' }}>
                      Custom dimensions will be mapped to the closest supported format
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedFile && (
          <div className="text-center mt-4">
            <button
              className="btn btn-block"
              onClick={handleReframe}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Compare Reframing'}
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="main-card">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Processing your image with both AI models...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {results && (
        <div className="main-card">
          <h2>Results</h2>
          <p>Target dimensions: {results.dimensions.width} × {results.dimensions.height}</p>
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '14px' }}>
            <strong>Used API Formats:</strong><br />
            Image Editing: {results.usedAspectRatio} aspect ratio<br />
            Ideogram: {results.usedImageSize} image size
          </div>
          <div className="result-grid">
            <div className="result-item">
              <img src={results.original} alt="Original" />
              <h3>Original</h3>
              <p>Your uploaded image</p>
            </div>
            <div className="result-item">
              {results.imageEditing ? (
                <img src={results.imageEditing} alt="Image Editing Result" />
              ) : (
                <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px' }}>
                  <p style={{ color: '#c33' }}>Failed to generate</p>
                  {results.imageEditingError && (
                    <small style={{ color: '#c33' }}>{results.imageEditingError}</small>
                  )}
                </div>
              )}
              <h3>Image Editing</h3>
              <p>Preserves subject position<br />
                <small style={{ color: '#666' }}>({results.usedAspectRatio})</small>
              </p>
            </div>
            <div className="result-item">
              {results.ideogram ? (
                <img src={results.ideogram} alt="Ideogram Result" />
              ) : (
                <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px' }}>
                  <p style={{ color: '#c33' }}>Failed to generate</p>
                  {results.ideogramError && (
                    <small style={{ color: '#c33' }}>{results.ideogramError}</small>
                  )}
                </div>
              )}
              <h3>Ideogram V3</h3>
              <p>Creative expansion<br />
                <small style={{ color: '#666' }}>({results.usedImageSize})</small>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="main-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Generation History ({history.length})</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label className="btn" style={{ backgroundColor: '#27ae60', fontSize: '14px', padding: '8px 16px', cursor: 'pointer' }}>
              Load Custom History
              <input
                type="file"
                accept=".json"
                onChange={loadHistoryFromFile}
                style={{ display: 'none' }}
              />
            </label>
            {history.length > 0 && (
              <button 
                onClick={() => {
                  setHistory([]);
                  saveHistory([]);
                }}
                className="btn"
                style={{ backgroundColor: '#e74c3c', fontSize: '14px', padding: '8px 16px' }}
              >
                Clear History
              </button>
            )}
          </div>
        </div>
        
        {history.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {history.map((item) => (
              <div key={item.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '16px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <small style={{ color: '#666' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </small>
                  <small style={{ color: '#666' }}>
                    {item.dimensions.width} × {item.dimensions.height}
                  </small>
                </div>
                
                <div className="result-grid">
                  <div className="result-item">
                    <img src={item.original} alt="Original" style={{ maxHeight: '150px' }} />
                    <h4>Original</h4>
                  </div>
                  <div className="result-item">
                    {item.imageEditing ? (
                      <img src={item.imageEditing} alt="Image Editing" style={{ maxHeight: '150px' }} />
                    ) : (
                      <div style={{ padding: '10px', backgroundColor: '#fee', borderRadius: '4px' }}>
                        <small style={{ color: '#c33' }}>Failed</small>
                      </div>
                    )}
                    <h4>Image Editing</h4>
                    <small>({item.usedAspectRatio})</small>
                  </div>
                  <div className="result-item">
                    {item.ideogram ? (
                      <img src={item.ideogram} alt="Ideogram" style={{ maxHeight: '150px' }} />
                    ) : (
                      <div style={{ padding: '10px', backgroundColor: '#fee', borderRadius: '4px' }}>
                        <small style={{ color: '#c33' }}>Failed</small>
                      </div>
                    )}
                    <h4>Ideogram V3</h4>
                    <small>({item.usedImageSize})</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px dashed #ddd'
          }}>
            <p style={{ marginBottom: '16px', fontSize: '16px' }}>No generation history yet</p>
            <p style={{ fontSize: '14px' }}>Generate some images or load a history file to see your past results</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
