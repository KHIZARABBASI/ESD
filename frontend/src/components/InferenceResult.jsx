import React, { useEffect, useState, useMemo, useRef } from "react";

export default function InferenceResult({ data, currentPage, onPageChange }) {
  const BACKEND = "http://127.0.0.1:8000";
  const [imageUrl, setImageUrl] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const colorMap = {
    "Cove Light": "#F59E0B",
    "Door": "#10B981",
    "Downlight": "#2F80ED",
    "Emergency Light Fitting": "#EF4444",
    "Fluorescent Light": "#A78BFA",
    "Socket Outlet": "#F97316",
    "Exit Sign": "#059669",
    "Unknown": "#9CA3AF",
  };

  useEffect(() => {
    
     // If data removed / empty -> clear viewer and reset states
    const noData =
      !data ||
      (Array.isArray(data.pages) && data.pages.length === 0 && !data.preview);

    if (noData) {
      setImageUrl(null);
      setTotalPages(1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsFullscreen(false);
      return;
    }
    if (data?.pages?.length > 0) {
      setTotalPages(data.pages.length);
      const pageData = data.pages.find((p) => p.page === currentPage);
      if (pageData?.url) {
        const url = pageData.url.startsWith("/")
          ? `${BACKEND}${pageData.url}`
          : `${BACKEND}/${pageData.url}`;
        setImageUrl(url);
      }
    } else if (data?.preview) {
      const url = data.preview.startsWith("/")
        ? `${BACKEND}${data.preview}`
        : `${BACKEND}/${data.preview}`;
      setImageUrl(url);
      setTotalPages(1);
    }
  }, [data, currentPage]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        handleExitFullscreen();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullscreen]);

  // Get detections for current page only
  const currentPageDetections = useMemo(() => {
    if (!data?.page_detections) return [];
    return data.page_detections[currentPage] || [];
  }, [data, currentPage]);

  const detectedItems = useMemo(() => {
    if (!currentPageDetections || currentPageDetections.length === 0) return [];
    const map = new Map();
    currentPageDetections.forEach((d) => {
      const label = d.class_name || "Unknown";
      const conf = d.confidence || 0;
      if (!map.has(label)) map.set(label, { label, count: 0, confidences: [] });
      const entry = map.get(label);
      entry.count++;
      entry.confidences.push(conf);
    });
    return Array.from(map.values()).map((e) => ({
      label: e.label,
      count: e.count,
      avgConfidence: e.confidences.reduce((a, b) => a + b, 0) / e.confidences.length,
    }));
  }, [currentPageDetections]);

  const handleZoomIn = () => setScale((p) => Math.min(p + 0.25, 5));
  const handleZoomOut = () => setScale((p) => Math.max(p - 0.25, 0.5));
  const handleZoomReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setPosition({ x: 0, y: 0 });
      setScale(1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      setPosition({ x: 0, y: 0 });
      setScale(1);
    }
  };

  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
    setScale(2);
    setPosition({ x: 0, y: 0 });
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse drag handlers for panning with boundary constraints
  const handleMouseDown = (e) => {
    if (!isFullscreen || e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isFullscreen) return;
    
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const maxX = (containerRect.width * (scale - 1)) / 2;
    const maxY = (containerRect.height * (scale - 1)) / 2;

    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    // Constrain position to prevent image from going outside bounds
    if (scale > 1) {
      newX = Math.max(-maxX, Math.min(maxX, newX));
      newY = Math.max(-maxY, Math.min(maxY, newY));
    } else {
      newX = 0;
      newY = 0;
    }

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom in fullscreen
  const handleWheel = (e) => {
    if (!isFullscreen) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));
    
    // Reset position if zooming out to 1 or less
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
    
    setScale(newScale);
  };

  return (
    <div>
      {/* ====== Header ====== */}
      <div
        className="inference-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {detectedItems.length > 0 ? (
            detectedItems.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 8,
                    background: colorMap[item.label] || "#9CA3AF",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="small-muted">{item.label}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>
                    {item.count} • {(item.avgConfidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#666" }}>No detected items</div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            style={{ width: 64, padding: 6 }}
          />
          <span>of {totalPages}</span>
        </div>
      </div>

      {/* ====== Image Viewer ====== */}
      <div
        className="preview-area"
        style={{
          position: "relative",
          marginTop: 12,
          height: "500px",
          overflow: "hidden",
          border: "1px solid #ddd",
          borderRadius: 6,
          backgroundColor: "#f8f9fa",
          cursor: imageUrl ? "pointer" : "default",
        }}
      >
        {/* Previous Button */}
        {totalPages > 1 && currentPage > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevPage();
            }}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0, 0, 0, 0.5)",
              color: "white",
              border: "none",
              borderRadius: 4,
              padding: "12px 16px",
              fontSize: 24,
              cursor: "pointer",
              zIndex: 10,
              backdropFilter: "blur(10px)",
            }}
          >
            &lt;
          </button>
        )}

        {/* Image */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={imageUrl ? handleEnterFullscreen : undefined}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Page ${currentPage}`}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>No preview available</div>
          )}
        </div>

        {/* Next Button */}
        {totalPages > 1 && currentPage < totalPages && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextPage();
            }}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0, 0, 0, 0.5)",
              color: "white",
              border: "none",
              borderRadius: 4,
              padding: "12px 16px",
              fontSize: 24,
              cursor: "pointer",
              zIndex: 10,
              backdropFilter: "blur(10px)",
            }}
          >
            &gt;
          </button>
        )}
      </div>

      {/* ====== Fullscreen Lightbox ====== */}
      {isFullscreen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#000",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* Image Container - Full Screen Background */}
          <div
            ref={containerRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              overflow: "hidden",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <img
              src={imageUrl}
              alt={`Page ${currentPage}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.2s",
                userSelect: "none",
                pointerEvents: "none",
              }}
              draggable={false}
            />
          </div>

          {/* Close Button - Floating */}
          <button
            onClick={handleExitFullscreen}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: 6,
              padding: "10px 20px",
              fontSize: 16,
              cursor: "pointer",
              zIndex: 10002,
              backdropFilter: "blur(10px)",
            }}
          >
            Close (ESC)
          </button>

          {/* Previous Button - Floating on Image */}
          {totalPages > 1 && currentPage > 1 && (
            <button
              onClick={handlePrevPage}
              style={{
                position: "fixed",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: 6,
                padding: "16px 20px",
                fontSize: 32,
                cursor: "pointer",
                zIndex: 10002,
                backdropFilter: "blur(10px)",
              }}
            >
              &lt;
            </button>
          )}

          {/* Next Button - Floating on Image */}
          {totalPages > 1 && currentPage < totalPages && (
            <button
              onClick={handleNextPage}
              style={{
                position: "fixed",
                right: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: 6,
                padding: "16px 20px",
                fontSize: 32,
                cursor: "pointer",
                zIndex: 10002,
                backdropFilter: "blur(10px)",
              }}
            >
              &gt;
            </button>
          )}

          {/* Zoom Controls - Floating at Bottom */}
          <div
            style={{
              position: "fixed",
              bottom: 30,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 10,
              background: "rgba(0, 0, 0, 0.7)",
              padding: "12px 24px",
              borderRadius: 8,
              zIndex: 10002,
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <button
              onClick={handleZoomOut}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: 4,
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: "bold",
                minWidth: 40,
              }}
            >
              -
            </button>
            <button
              onClick={handleZoomReset}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: 4,
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 14,
                minWidth: 70,
              }}
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: 4,
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: "bold",
                minWidth: 40,
              }}
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}