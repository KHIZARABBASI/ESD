import React from 'react'

export default function SummaryPanel({ summary }) {
  // Use provided data or default values
  const {
    total_pages = 0,
    items_found = 0,
    total_detections = 0
  } = summary || {};

  return (
    <div className="summary-metrics">
      <div className="metric">
        <div className="small-muted">Total Pages</div>
        <div className="num">{total_pages}</div>
      </div>
      <div className="metric">
        <div className="small-muted">Items Found</div>
        <div className="num">{items_found}</div>
      </div>
      <div className="metric">
        <div className="small-muted">Total Detections</div>
        <div className="num">{total_detections}</div>
      </div>
    </div>
  )
}