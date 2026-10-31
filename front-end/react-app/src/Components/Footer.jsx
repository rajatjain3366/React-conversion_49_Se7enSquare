import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Footer Component
 * Upgraded with multi-column sitemap, status badge, brand info, and responsive layout.
 */
export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand info */}
          <div className="ft-brand">
            <div className="logo-name">
              <div className="nav-hex" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                G
              </div>
              Gameunity
            </div>
            <p>
              Where great communities come alive. Built for developers, creators, and thinkers who want to build something real together.
            </p>
            <div className="ft-status-pill">
              <span style={{ fontSize: '8px' }}>●</span> All systems operational
            </div>
          </div>

          {/* Product links */}
          <div className="ft-col">
            <h4>Product</h4>
            <div className="ft-links">
              <a href="#features" className="ft-link">Features</a>
              <a href="#how" className="ft-link">How It Works</a>
              <Link to="/discovery" className="ft-link">Discover</Link>
              <Link to="/pricing" className="ft-link">Pricing</Link>
              <Link to="/events" className="ft-link">Events</Link>
            </div>
          </div>

          {/* Communities */}
          <div className="ft-col">
            <h4>Communities</h4>
            <div className="ft-links">
              <Link to="/community/1" className="ft-link">Dev Nexus</Link>
              <Link to="/community/2" className="ft-link">Design Studio</Link>
              <Link to="/create-community" className="ft-link">Start a Community</Link>
              {/* Chat needs a community (?community=id), so send users to
                  Discover to pick one. A bare /chat shows an empty chat. */}
              <Link to="/discovery" className="ft-link">Real-time Chat</Link>
            </div>
          </div>

          {/* Platform & Trust */}
          <div className="ft-col">
            <h4>Platform</h4>
            <div className="ft-links">
              <Link to="/mod-panel" className="ft-link">AutoMod Shield</Link>
              <Link to="/report" className="ft-link">Safety & Reports</Link>
              <Link to="/appeal" className="ft-link">Appeals Portal</Link>
              <Link to="/login" className="ft-link">Sign In</Link>
            </div>
          </div>
        </div>

        <div className="footer-bot">
          <div className="footer-copy">© 2026 Gameunity, Inc. All rights reserved. Built for serious collaboration.</div>
          <div className="footer-socials">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="soc"
              aria-label="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.88 10.9c.58.1.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.2.7-3.87-1.53-3.87-1.53-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.74 1.27 3.4.97.11-.75.41-1.27.75-1.56-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.77.12 3.06.74.81 1.18 1.84 1.18 3.1 0 4.45-2.69 5.43-5.25 5.71.42.36.8 1.09.8 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.67.8.55A11.5 11.5 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="soc"
              aria-label="YouTube"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a2.998 2.998 0 0 0-2.112-2.122C19.457 3.5 12 3.5 12 3.5s-7.457 0-9.386.563A2.998 2.998 0 0 0 .502 6.186 31.03 31.03 0 0 0 0 12a31.03 31.03 0 0 0 .502 5.814 2.998 2.998 0 0 0 2.112 2.122C4.543 20.5 12 20.5 12 20.5s7.457 0 9.386-.564a2.998 2.998 0 0 0 2.112-2.122A31.03 31.03 0 0 0 24 12a31.03 31.03 0 0 0-.502-5.814z" />
                <path d="M9.75 15.02V8.98l6.5 3.02-6.5 3.02z" fill="#fff" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="soc"
              aria-label="LinkedIn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.452 20.452h-3.556v-5.569c0-1.328-.025-3.039-1.853-3.039-1.855 0-2.14 1.45-2.14 2.947v5.661H8.842V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.369-1.852 3.602 0 4.266 2.371 4.266 5.456v6.287zM5.337 7.433a2.064 2.064 0 1 1 0-4.128 2.064 2.064 0 0 1 0 4.128zM6.776 20.452H3.9V9h2.876v11.452zM22.225 0H1.771C.792 0 0 .77 0 1.722v20.555C0 23.23.792 24 1.771 24h20.451C23.2 24 24 23.23 24 22.278V1.722C24 .77 23.2 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
