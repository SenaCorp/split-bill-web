import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, X, RefreshCw } from 'lucide-react';

export default function ImageUploader({ onImageUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    try {
      const constraints = {
        video: {
          facingMode: facingMode
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera Error:', err);
      setCameraError('Could not access camera. Please ensure you are on HTTPS or localhost and have granted permission.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const switchCamera = () => {
    setFacingMode((prev) => prev === 'environment' ? 'user' : 'environment');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    }
  }, [facingMode]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg');
      onImageUpload(imageData);
      stopCamera();
    }
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFile(event.dataTransfer.files[0]);
    }
  };

  const handleChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      handleFile(event.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setFileError(null);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        onImageUpload(reader.result);
      };
    } else {
      setFileError('Please upload an image file.');
    }
  };

  return (
    <section className="flow-card">
      {isCameraOpen && (
        <div className="camera-overlay">
          <button onClick={stopCamera} className="camera-icon-button camera-close" aria-label="Close camera">
            <X size={24} />
          </button>

          {cameraError ? (
            <div className="camera-error">
              <p>{cameraError}</p>
              <button onClick={stopCamera} className="btn-submit">Close</button>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />

              <div className="camera-controls">
                <button onClick={switchCamera} className="camera-icon-button" aria-label="Switch camera">
                  <RefreshCw size={24} />
                </button>

                <button onClick={capturePhoto} className="camera-shutter" aria-label="Capture photo" />
                <span className="camera-spacer" aria-hidden="true" />
              </div>
            </>
          )}
          <canvas ref={canvasRef} hidden />
        </div>
      )}

      <div className="section-label-bar">Official upload</div>

      <div
        className={`upload-plate ${dragActive ? 'is-dragging' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="input-file-upload"
          className="visually-hidden"
          onChange={handleChange}
          accept="image/*"
        />
        <label htmlFor="input-file-upload" className="upload-label">
          <span className="upload-icon">
            <Upload size={40} />
          </span>
          <span>
            <strong>Upload receipt</strong>
            <small>Drag and drop an image, or click to browse.</small>
          </span>
        </label>
      </div>

      <div className="dotted-divider"><span>or</span></div>

      {fileError && <div className="inline-error upload-error">{fileError}</div>}

      <button className="btn-secondary-wide" onClick={startCamera}>
        <Camera size={20} />
        Open camera
      </button>
    </section>
  );
}
