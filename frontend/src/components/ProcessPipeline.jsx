

// src/components/ProcessPipeline.jsx
import React from "react";
import { Tag } from "primereact/tag";
import { ProgressBar } from "primereact/progressbar";

export default function ProcessPipeline({ activeStep = -1 }) {
  const steps = [
    { label: "File Upload & Validation" },
    { label: "File Processings" },
    { label: "YOLO Model Loading" },
    { label: "Object Detection Inference" },
    { label: "Results Processing" },
  ];

  const getStatus = (index) => {
    if (index < activeStep) return "Complete";
    if (index === activeStep) return "In Progress";
    return "Pending";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Complete":
        return "success";
      case "In Progress":
        return "info";
      default:
        return "secondary";
    }
  };

  return (
    <div className="process-pipeline">
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Process Pipeline</div>

      {steps.map((step, idx) => {
        const status = getStatus(idx);
        const isActive = status === "In Progress";
        const isDone = status === "Complete";

        return (
          <div
            key={idx}
            className="pipeline-step"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
              backgroundColor: isDone
                ? "#eaffea"
                : isActive
                ? "#e7f5ff"
                : "#fff",
              border: "1px solid #ddd",
              padding: "10px 12px",
              borderRadius: 10,
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isDone ? (
                <i
                  className="pi pi-check-circle"
                  style={{ color: "#22c55e", fontSize: 18 }}
                />
              ) : isActive ? (
                <i
                  className="pi pi-spinner pi-spin"
                  style={{ color: "#3b82f6", fontSize: 18 }}
                />
              ) : (
                <i
                  className="pi pi-circle"
                  style={{ color: "#ccc", fontSize: 16 }}
                />
              )}
              <span style={{ fontWeight: 500 }}>{step.label}</span>
            </div>

            <Tag
              value={status}
              severity={getStatusColor(status)}
              style={{ textTransform: "capitalize" }}
            />
          </div>
        );
      })}

      {/* Optional Progress Bar */}
      <div style={{ marginTop: 15 }}>
        <ProgressBar
          value={(activeStep / steps.length) * 100}
          showValue={false}
          style={{ height: "6px" }}
        />
      </div>
    </div>
  );
}
