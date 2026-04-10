// src/components/Footer.js
import React from "react";
import mitwpuLogo from "../assets/mitwpu-logo.png.png";

export default function Footer() {
  return (
    <footer className="footer-shell">
      <div className="footer-copy">
        <p className="footer-kicker">Capstone project</p>
        <h3>Department of Electrical and Electronics Engineering</h3>
        <p>MIT World Peace University, Pune</p>
      </div>

      <div className="footer-columns">
        <div className="footer-group">
          <h4>Project Guide</h4>
          <p>Dr. Sumita Motade</p>
        </div>

        <div className="footer-group">
          <h4>Team Members</h4>
          <ul>
            <li>Omkar Kolhe</li>
            <li>Vipin Jain</li>
            <li>Samyak Bakliwal</li>
          </ul>
        </div>
      </div>

      <div className="footer-brand">
        <img
          src={mitwpuLogo}
          alt="MIT-WPU Logo"
          className="mitwpu-logo"
          loading="lazy"
        />
        <p className="footer-brand-note">MIT-WPU</p>
      </div>
    </footer>
  );
}
