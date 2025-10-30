import React, { useState } from "react";
import App from "../App";

export default function LandingPage() {
  const [showMainApp, setShowMainApp] = useState(false);

  if (showMainApp) {
    return <App />;
  }

  return (
    <div className="landing-page">
      {/* Header */}
      <nav className="nav-header">
        <div className="nav-brand">
          <img src="src\img\dps_logo.png" alt="DPS Kuwait" className="logo" />
          <span><h5>Electric Symbols Detector</h5></span>
        </div>
        <button className="get-started-btn" onClick={() => setShowMainApp(true)}>
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <h1>
          Accelerate Your <span className="text-red">Engineering Workflow</span>
        </h1>
        <p className="hero-desc">
          Empowering DPS Kuwait with AI-driven electrical diagram analysis. Instantly detect and classify symbols to simplify design validation and reduce manual review time.
        </p>
        <button className="get-started-btn" onClick={() => setShowMainApp(true)}>
          Start Analysing
        </button>
      </div>

      {/* Features Grid */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon blue">
            {/* <i className="pi pi-file"></i> */}
            <img src="src\img\analysis.png" alt="DPS Kuwait" className="logo" />

          </div>
          <h3>Intelligent Symbol Detection</h3>
          <p>Empower your design team with AI-driven symbol recognition. Instantly detect and classify electrical symbols in complex drawings — faster, smarter, and more accurately than ever before.</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon green">
            {/* <i className="pi pi-users"></i> */}
          <img src="src\img\manage.png" alt="DPS Kuwait" className="logo" />

          </div>
          <h3>Seamless Drawing Management</h3>
          <p>Effortlessly upload, view, and organize your engineering drawings in one unified workspace. Track detections, review pages, and manage projects with complete clarity and control.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon purple">
            {/* <i className="pi pi-chart-bar"></i> */}
          <img src="src\img\insights.png" alt="DPS Kuwait" className="logo" />
          </div>
          <h3>Actionable Insights & Reports</h3>
          <p> Turn data into decisions with detailed analytics on detections, symbol distributions, and accuracy trends — helping DPS Kuwait optimize workflows and improve design quality.</p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2>Ready to Automate Your Drawing Reviews?</h2>
        <p> Join DPS Kuwait in revolutionizing the way electrical drawings are analyzed and reviewed with AI precision..</p>
        <button className="get-started-btn" onClick={() => setShowMainApp(true)}>
          Get Started Now
        </button>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <img src="src\img\dps_logo.png" alt="DPS Kuwait" className="footer-logo" />
          <span>DPS Kuwait</span>
        </div>
        <div className="footer-text">
          Digital Processing Systems Kuwait 
        </div>
      </footer>
    </div>
  );
}