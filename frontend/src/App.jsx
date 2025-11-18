import React, { useState, useEffect } from 'react';
import axios from 'axios';

import UploadSection from './components/UploadSection';
import ProcessPipeline from './components/ProcessPipeline';
import InferenceResult from './components/InferenceResult';
import SummaryPanel from './components/SummaryPanel';
import DetectionOverview from './components/DetectionOverview';

// 🧠 Backend URL
const BACKEND = "http://127.0.0.1:8000";

export default function App() {
  const [activeStep, setActiveStep] = useState(-1);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [detectionData, setDetectionData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 🔒 State to track if upload should be disabled
  const [isUploadDisabled, setIsUploadDisabled] = useState(false);
  

  // 🧹 Reset backend storage when app starts
  useEffect(() => {
    const resetServer = async () => {
      try {
        await axios.get(`${BACKEND}/reset`);
        console.log("🧹 Server storage reset");
      } catch (err) {
        console.warn("⚠️ Failed to reset server storage", err);
      }
    };
    resetServer();
  }, []);

  
  // 🔄 Refresh Handler
  const handleRefresh = async () => {
    try {
      setStatus("🔄 Refreshing...");
      await axios.get(`${BACKEND}/reset`);
      
      // Clear all state
      setActiveStep(-1); // Reset to -1 instead of 0
      setSummaryData(null);
      setSummaryMetrics(null);
      setDetectionData(null);
      setCurrentPage(1);
      setStatus("");
      
      // 🔓 Re-enable upload section
      setIsUploadDisabled(false);
      
      // 👇 Force re-render (remount) UploadSection
      setRefreshKey(prev => prev + 1);
      console.log("🔄 Application refreshed - Upload re-enabled");
    } catch (err) {
      console.error("⚠️ Refresh failed:", err);
      setStatus("❌ Refresh failed");
    }
  };

  const handleUploadComplete = async (fileInfo) => {
    try {
      if (fileInfo.status !== "Complete") {
        console.error("❌ Upload failed:", fileInfo.error);
        setStatus("❌ Upload failed");
        return;
      }

      console.log("✅ Step 1: Upload complete.");
      
      // 🔒 Disable upload section after successful upload
      setIsUploadDisabled(true);
      
      setActiveStep(0); // Start at step 0 (File Upload)
      setStatus("✅ File uploaded");

      // Step 2: Preprocessing
      setActiveStep(1);
      setStatus("🧠 Preprocessing...");
      await axios.get(`${BACKEND}/preprocess`);
      console.log("✅ Step 2: Preprocessing complete.");

      // Step 3: Load YOLO model
      setActiveStep(2);
      setStatus("📦 Loading model...");
      await axios.get(`${BACKEND}/load_model`);
      console.log("✅ Step 3: Model loaded.");

      // Step 4: Run inference
      setActiveStep(3);
      setStatus("🚀 Running inference...");
      await axios.get(`${BACKEND}/inference`);
      console.log("✅ Step 4: Inference complete.");

      // Step 5: Fetch results
      setActiveStep(4);
      setStatus("📊 Fetching results...");
      const resultsRes = await axios.get(`${BACKEND}/results`);
      const data = resultsRes.data;
      console.log("✅ Step 5: Results fetched.");

      // 🧩 Extract and store response data
      setSummaryData(data);
      setSummaryMetrics(data.summary || {});
      setDetectionData(data.detections || []);
      setCurrentPage(1);
      
      setActiveStep(5); // Move to completion (all steps done)
      setStatus("✅ Inference complete. Results ready.");

    } catch (error) {
      console.error("⚠️ Pipeline error:", error);
      setStatus("❌ Pipeline failed. Check backend logs.");
      // 🔓 Re-enable upload if pipeline fails
      setIsUploadDisabled(false);
    }
  };

  // Get current page detections
  const currentPageDetections = summaryData?.page_detections?.[currentPage] || [];

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="brand">
            <div className="logo">
              <img
                src="src/img/dps_logo.png"
                alt="DPS Kuwait"
                className="logo"
              />
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#666" }}>DPS</div>
              <div style={{ fontSize: 18 }}>Electrical Symbols Detector</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {status && (
        <div
          style={{
            textAlign: "center",
            color: status.startsWith("❌") ? "red" : "#2f80ed",
            fontWeight: 500,
            marginTop: 10,
          }}
        >
          {status}
        </div>
      )}

      {/* Top Grid */}
      <div className="main-grid" style={{ marginTop: 12}}>
        <div className="card">
          {/* Pass isDisabled prop to UploadSection */}
          <UploadSection
            key={refreshKey} 
            onUploadComplete={handleUploadComplete}
            isDisabled={isUploadDisabled}
          />

          
        <div style={{ marginTop: 12}}>
          <button
            onClick={handleRefresh}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#b6b4b4ff',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#333',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e8e8e8';
              e.target.style.borderColor = '#bbb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#b6b4b4ff';
              e.target.style.borderColor = '#ddd';
            }}
          >
            <span style={{ fontSize: '16px' }}>🔄</span>
            Refresh
          </button>
        </div>
        </div>
        <div className="card">
          <ProcessPipeline activeStep={activeStep} />
        </div>

      </div>

      {/* Bottom Grid */}
      <div className="bottom-grid">
        <div className="card">
          <InferenceResult 
            data={summaryData}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
        />
      </div>

      <div className="card right-col">
        <SummaryPanel summary={summaryMetrics} />

        {/* ✅ Add metaData prop from backend for current page */}
        <DetectionOverview 
          data={summaryData?.page_detections?.[currentPage] || []}
          metaData={summaryData?.meta_data?.[currentPage] || {}} 
        />
      </div>
    </div>

    <div className="footer-space" />
  </div>

  


  );
}