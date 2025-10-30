
// src/components/UploadSection.jsx
import React, { useRef, useState } from "react";
import axios from "axios";

export default function UploadSection({ onUploadComplete }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    // upload to backend
    console.log("⬆️ Uploading file:", file.name);
    const fd = new FormData();
    console.log("fd:", fd);
    fd.append("file", file);
    console.log("fd after append:", fd);

    try {
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
  console.log("BASE URL:", BASE);

  const uploadUrl = BASE
    ? `${BASE.replace(/\/$/, '')}/upload`
    : `/api/upload`;

  const res = await axios.post(uploadUrl, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (ev) => {
      if (ev.total) setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
    },
  });

  onUploadComplete(res.data);
} catch (err) {
  console.error("Upload failed", err);
  onUploadComplete({ error: true, message: "Upload failed" });
}

  };

  return (
    <div>
      <div className="upload-title">Upload Files:</div>
      <div className="upload-drop" onClick={handleClick} style={{ cursor: "pointer" }}>
        <div className="big-icon"><i className="pi pi-cloud-upload"></i></div>
        <div style={{ fontWeight: 600 }}>Upload Files</div>
        <div className="small-muted">.jpg, .jpeg, .png, .pdf, .dwf, .dwfx, .dwg, .dxf • Click to upload</div>
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.dwf,.dwfx,.dwg,.dxf" style={{ display: "none" }} onChange={handleFileChange} />
      </div>

      {selectedFile && <div style={{ marginTop: 10 }}>{selectedFile.name}</div>}
      {uploadProgress > 0 && <div style={{ marginTop: 8 }}><div style={{ fontSize: 13 }}>{uploadProgress}%</div></div>}
    </div>
  );
}
