import React, { useMemo } from 'react';

export default function DetectionOverview({ data = [], metaData = {} }) {
  const detectionSummary = useMemo(() => {
    const summary = {};
    if (!data) return [];

    data.forEach((detection) => {
      const className = detection.class_name;
      if (!summary[className]) {
        summary[className] = { cls: className, count: 0, confidence: [] };
      }
      summary[className].count++;
      summary[className].confidence.push(detection.confidence);
    });

    return Object.values(summary).sort((a, b) => b.count - a.count);
  }, [data]);

  const handleExportCSV = () => {
    if (detectionSummary.length === 0) return alert('No data to export.');
    const header = ['Class', 'Count', 'Avg Confidence'];
    const rows = detectionSummary.map((row) => [
      row.cls,
      row.count,
      ((row.confidence.reduce((a, b) => a + b, 0) / row.confidence.length) * 100).toFixed(1) + '%',
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'detection_summary.csv';
    link.click();
  };

  return (
    <div className="detection-overview-container">
      {/* ---------------- DETECTION OVERVIEW ---------------- */}
      <div className="detection-title-row">
        <div className="section-title">Detection Overview</div>
        <button className="btn-small export-btn" onClick={handleExportCSV}>
          <i className="pi pi-download" style={{ marginRight: 0 }}></i>
          Export CSV
        </button>
      </div>

      <div className="scrollable-table">
        <div className="detection-table">
          <div className="detection-row header">
            <div>Class</div>
            <div>Count</div>
            <div>Avg Confidence</div>
          </div>

          {detectionSummary.length > 0 ? (
            detectionSummary.map((row, idx) => (
              <div className="detection-row" key={idx}>
                <div>{row.cls}</div>
                <div>{row.count}</div>
                <div>
                  {(
                    (row.confidence.reduce((a, b) => a + b, 0) / row.confidence.length) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            ))
          ) : (
            <div className="detection-row empty" style={{ textAlign: 'center' }}>
              No detections available
            </div>
          )}
        </div>
      </div>

      {/* ---------------- META DATA ---------------- */}
      <div className="detection-title-row" style={{ marginTop: 1 }}>
        <div className="section-title">Meta Data</div>
      </div>

      <div className="scrollable-table">
        <div className="detection-table">
          <div className="detection-row header">
            <div>Title</div>
            <div>Value</div>
          </div>

          {metaData && Object.keys(metaData).length > 0 ? (
            Object.entries(metaData).map(([key, value], idx) => (
              <div className="detection-row" key={idx}>
                <div style={{ textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div>{value || '—'}</div>
              </div>
            ))
          ) : (
            <div className="detection-row empty" style={{ textAlign: 'center' }}>
              No metadata available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
