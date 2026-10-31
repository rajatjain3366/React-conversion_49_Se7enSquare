import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import Button from '../Components/Button';
import Icon from '../Components/Icon';
import useLanding from '../Components/platform/hooks/useLanding';
import '../styles/landing.css';

/**
 * Landing Page Component
 * Converted from landing.html, preserving all sections, styling, animations, and interactive features.
 * Architecture: UI/presentation layer using useLanding() for state and interaction logic.
 */
export default function Landing() {
  const {
    stats,
    activeStep,
    setActiveStep,
    steps,
    joinedCommunities,
    toggleJoin,
    tiltStyle,
    handleMouseMove,
    handleMouseLeave,
  } = useLanding();

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, []);

  return (
    <div className="landing-page-container ui-v2">
      {/* Reusable Navbar */}
      <Navbar />

      {/* ═══════════════════════════════════════
         HERO SECTION
      ═══════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="hero-inner">
          {/* Left copy */}
          <div className="hero-l">
            <div className="hero-eyebrow">
              <div className="ey-dot"></div>
              Now in public beta{stats.users && stats.users !== '0' ? ` · ${stats.users} members` : ''}
            </div>

            <h1 className="hero-h1">
              <span className="line l1">
                <span>Where great</span>
              </span>
              <span className="line l2">
                <span>
                  <span className="grad-txt">communities</span>
                </span>
              </span>
              <span className="line l3">
                <span>come alive.</span>
              </span>
            </h1>

            <p className="hero-sub">
              Gameunity brings together developers, creators, and thinkers into living, breathing communities — with
              real-time chat, events, and tools built for serious collaboration.
            </p>

            <div className="hero-btns">
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button className="btn-hero">Start for free →</Button>
              </Link>
              <Link to="/discovery" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn-hero-secondary">Explore communities</button>
              </Link>
            </div>

            <div className="hero-stat-row">
              <div className="hstat">
                <div className="hstat-val" id="c-users">
                  {stats.users}
                </div>
                <div className="hstat-lbl">Members worldwide</div>
              </div>
              <div className="hstat">
                <div className="hstat-val" id="c-comms">
                  {stats.comms}
                </div>
                <div className="hstat-lbl">Active communities</div>
              </div>
              <div className="hstat">
                <div className="hstat-val" id="c-msgs">
                  {stats.msgs}
                </div>
                <div className="hstat-lbl">Messages per day</div>
              </div>
            </div>
          </div>

          {/* Right mockup with 3D tilt */}
          <div
            className="hero-r"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="float-badge fb1" style={{ color: 'var(--success)' }}>
              <span>✦</span> <span>+847 joined today</span>
            </div>
            <div className="float-badge fb2">
              🔴 <span>Dev Nexus is live</span>
            </div>
            <div className="float-badge fb3" style={{ color: 'var(--ac3)' }}>
              🏆 <span>Hackathon starting soon</span>
            </div>

            <div className="mockup-wrap">
              <div className="mockup" style={tiltStyle}>
                {/* Window chrome */}
                <div className="mk-bar">
                  <div className="mk-dot" style={{ background: '#F87171' }}></div>
                  <div className="mk-dot" style={{ background: '#F59E0B', marginLeft: '5px' }}></div>
                  <div className="mk-dot" style={{ background: '#34D399', marginLeft: '5px' }}></div>
                  <div className="mk-bar-title">Gameunity</div>
                </div>

                {/* App body */}
                <div className="mk-body">
                  {/* Mini sidebar */}
                  <div className="mk-sb">
                    <div className="mk-sb-logo">
                      <div className="mk-sb-hex"></div>
                      Gameunity
                    </div>
                    <div className="mk-ni on"><Icon name="home" size={13} /> Home</div>
                    <div className="mk-ni"><Icon name="compass" size={13} /> Discover</div>
                    <div className="mk-ni"><Icon name="calendar" size={13} /> Events</div>
                    <div className="mk-ni" style={{ marginTop: 'auto' }}>
                      <Icon name="settings" size={13} /> Settings
                    </div>
                  </div>

                  {/* Mini main area */}
                  <div className="mk-main">
                    <div className="mk-hdr"><Icon name="flame" size={13} /> Trending Communities</div>

                    <div className="mk-card">
                      <div className="mk-card-title">
                        Dev Nexus
                        <span
                          className="mk-badge"
                          style={{ background: 'rgba(91,110,245,0.15)', color: '#8B9CF8' }}
                        >
                          <Icon name="dot" size={8} /> Live
                        </span>
                      </div>
                      Realtime discussions on web dev and open source
                      <div className="mk-av-row">
                        <div className="mk-av" style={{ background: '#5B6EF5' }}>
                          A
                        </div>
                        <div className="mk-av" style={{ background: '#8B5CF6' }}>
                          K
                        </div>
                        <div className="mk-av" style={{ background: '#34D399' }}>
                          M
                        </div>
                        <div className="mk-av" style={{ background: '#F59E0B' }}>
                          J
                        </div>
                      </div>
                      <div className="mk-prog">
                        <div className="mk-prog-fill" style={{ width: '78%' }}></div>
                      </div>
                    </div>

                    <div className="mk-card">
                      <div className="mk-card-title">
                        Design Studio
                        <span
                          className="mk-badge"
                          style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}
                        >
                          Event
                        </span>
                      </div>
                      Weekly UI crits and design sprints
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
         LOGO MARQUEE
      ═══════════════════════════════════════ */}
      <div className="logos">
        <div className="logos-inner">
          <span className="logos-label">
            {stats.comms && stats.comms !== '0' ? `Connecting ${stats.comms} active communities` : 'Connecting gaming communities worldwide'}
          </span>
          <div className="logos-track-wrap">
            <div className="logos-track">
              <div className="logo-chip">Dev Nexus</div>
              <div className="logo-chip">Design Studio</div>
              <div className="logo-chip">Open Source Hub</div>
              <div className="logo-chip">Hackathon HQ</div>
              <div className="logo-chip">GameCraft Guild</div>
              <div className="logo-chip">NextGen Founders</div>
              <div className="logo-chip">AI Innovators</div>
              <div className="logo-chip">Dev Nexus</div>
              <div className="logo-chip">Design Studio</div>
              <div className="logo-chip">Open Source Hub</div>
              <div className="logo-chip">Hackathon HQ</div>
              <div className="logo-chip">GameCraft Guild</div>
              <div className="logo-chip">NextGen Founders</div>
              <div className="logo-chip">AI Innovators</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
         FEATURES SECTION
      ═══════════════════════════════════════ */}
      <section className="features" id="features">
        <div className="section-inner">
          <div className="reveal">
            <div className="section-eyebrow">Features</div>
            <h2 className="section-h2">
              Everything your
              <br />
              community needs.
            </h2>
            <p className="section-sub">
              Built by community builders, for community builders — every feature is designed to deepen connection and drive
              engagement.
            </p>
          </div>

          <div className="feat-grid reveal reveal-d1">
            {/* 1. Real-Time Channels */}
            <div className="feat-card">
              <div className="feat-ico-wrap">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="feat-title">Real-Time Channels</div>
              <div className="feat-desc">
                Instant messaging with threads, reactions, and robust attachment handling built natively.
              </div>
            </div>

            {/* 2. Events & Tournaments */}
            <div className="feat-card">
              <div className="feat-ico-wrap">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <rect x="8" y="14" width="3" height="3" rx="0.5" />
                  <rect x="13" y="14" width="3" height="3" rx="0.5" />
                </svg>
              </div>
              <div className="feat-title">Events &amp; Tournaments</div>
              <div className="feat-desc">
                Fully integrated calendar to schedule brackets, manage RSVPs and run game night seamlessly.
              </div>
            </div>

            {/* 3. Auto Moderation & AI */}
            <div className="feat-card">
              <div className="feat-ico-wrap">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="feat-title">Auto Moderation &amp; AI</div>
              <div className="feat-desc">
                System Bot detects toxicity in milliseconds. Review flags securely through the Mod Panel.
              </div>
            </div>

            {/* 4. Community Discovery */}
            <div className="feat-card">
              <div className="feat-ico-wrap">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </div>
              <div className="feat-title">Community Discovery</div>
              <div className="feat-desc">
                A marketplace interface to find your next squad, filterable by genre, rank, or health score.
              </div>
            </div>

            {/* 5. Analytics Dashboard */}
            <div className="feat-card">
              <div className="feat-ico-wrap">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="feat-title">Analytics Dashboard</div>
              <div className="feat-desc">
                Track retention, engagement rates, and report queues like a true enterprise product manager.
              </div>
            </div>

            {/* 6. Role Management */}
            <div className="feat-card">
              <div className="feat-ico-wrap">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="feat-title">Role Management</div>
              <div className="feat-desc">From Gamer to Admin, configure granular permissions with visual ease.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
         HOW IT WORKS
      ═══════════════════════════════════════ */}
      <section className="how" id="how">
        <div className="section-inner">
          <div className="reveal">
            <div className="section-eyebrow">How it works</div>
            <h2 className="section-h2">
              Up and running
              <br />
              in minutes.
            </h2>
          </div>

          <div className="how-grid">
            {/* Steps list */}
            <div className="steps reveal reveal-d1" id="steps">
              {steps.map((step, index) => (
                <div
                  key={step.num}
                  className={`step ${activeStep === index ? 'on' : ''}`}
                  onClick={() => setActiveStep(index)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="step-n">{step.num}</div>
                  <div className="step-body">
                    <div className="step-title">{step.title}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual / interactive card */}
            <div className="how-visual reveal reveal-d2">
              <div className="hw-card">
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  Discover Communities
                  <span style={{ fontSize: '11px', color: 'var(--t3)', fontFamily: "'DM Sans', sans-serif" }}>
                    {stats.comms && stats.comms !== '0' ? `${stats.comms} total` : 'Active'}
                  </span>
                </div>

                {/* Category chips */}
                <div style={{ display: 'flex', gap: '7px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 11px',
                      borderRadius: '12px',
                      background: 'rgba(91,110,245,0.12)',
                      border: '1px solid rgba(91,110,245,0.25)',
                      color: 'var(--ac3)',
                      cursor: 'pointer',
                    }}
                  >
                    Technology
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 11px',
                      borderRadius: '12px',
                      background: 'var(--bg2)',
                      border: '1px solid var(--bdr)',
                      color: 'var(--t3)',
                      cursor: 'pointer',
                    }}
                  >
                    Design
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 11px',
                      borderRadius: '12px',
                      background: 'var(--bg2)',
                      border: '1px solid var(--bdr)',
                      color: 'var(--t3)',
                      cursor: 'pointer',
                    }}
                  >
                    Gaming
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 11px',
                      borderRadius: '12px',
                      background: 'var(--bg2)',
                      border: '1px solid var(--bdr)',
                      color: 'var(--t3)',
                      cursor: 'pointer',
                    }}
                  >
                    Education
                  </span>
                </div>

                {/* Loading bar */}
                <div className="hw-bar">
                  <div className="hw-bar-fill"></div>
                </div>

                {/* Community list */}
                <div className="hw-comm-list">
                  <div className="hw-ci">
                    <div className="hw-ci-ico" style={{ background: 'rgba(91,110,245,0.12)' }}>
                      <Icon name="code" size={18} />
                    </div>
                    <div className="hw-ci-info">
                      <div className="hw-ci-name">Dev Nexus</div>
                      <div className="hw-ci-meta">12.4k members · Technology</div>
                    </div>
                    <button
                      className={`hw-ci-btn ${joinedCommunities.devNexus ? 'joined' : ''}`}
                      onClick={() => toggleJoin('devNexus')}
                    >
                      {joinedCommunities.devNexus ? <><Icon name="check" size={12} /> Joined</> : 'Join'}
                    </button>
                  </div>

                  <div className="hw-ci">
                    <div className="hw-ci-ico" style={{ background: 'rgba(139,92,246,0.12)' }}>
                      <Icon name="palette" size={18} />
                    </div>
                    <div className="hw-ci-info">
                      <div className="hw-ci-name">Design Studio</div>
                      <div className="hw-ci-meta">8.2k members · Design</div>
                    </div>
                    <button
                      className={`hw-ci-btn ${joinedCommunities.designStudio ? 'joined' : ''}`}
                      onClick={() => toggleJoin('designStudio')}
                    >
                      {joinedCommunities.designStudio ? <><Icon name="check" size={12} /> Joined</> : 'Join'}
                    </button>
                  </div>

                  <div className="hw-ci">
                    <div className="hw-ci-ico" style={{ background: 'rgba(52,211,153,0.1)' }}>
                      <Icon name="git-branch" size={18} />
                    </div>
                    <div className="hw-ci-info">
                      <div className="hw-ci-name">Open Source Hub</div>
                      <div className="hw-ci-meta">6.8k members · Technology</div>
                    </div>
                    <button
                      className={`hw-ci-btn ${joinedCommunities.openSourceHub ? 'joined' : ''}`}
                      onClick={() => toggleJoin('openSourceHub')}
                    >
                      {joinedCommunities.openSourceHub ? <><Icon name="check" size={12} /> Joined</> : 'Join'}
                    </button>
                  </div>

                  <div className="hw-ci">
                    <div className="hw-ci-ico" style={{ background: 'rgba(245,158,11,0.1)' }}>
                      <Icon name="trophy" size={18} />
                    </div>
                    <div className="hw-ci-info">
                      <div className="hw-ci-name">Hackathon HQ</div>
                      <div className="hw-ci-meta">5.1k members · Events</div>
                    </div>
                    <button
                      className={`hw-ci-btn ${joinedCommunities.hackathonHQ ? 'joined' : ''}`}
                      onClick={() => toggleJoin('hackathonHQ')}
                    >
                      {joinedCommunities.hackathonHQ ? <><Icon name="check" size={12} /> Joined</> : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
         TESTIMONIALS
      ═══════════════════════════════════════ */}
      <section className="testi" id="community">
        <div className="section-inner">
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 0 }}>
            <div className="section-eyebrow" style={{ textAlign: 'center' }}>
              Testimonials
            </div>
            <h2 className="section-h2" style={{ textAlign: 'center' }}>
              Loved by community
              <br />
              builders worldwide.
            </h2>
          </div>

          <div className="testi-grid">
            <div className="tcard reveal reveal-d1">
              <div className="tcard-stars" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={14} />)}</div>
              <div className="tcard-text">
                "Gameunity replaced four separate tools for us. The <em>real-time channels and events</em> work perfectly
                together — our community engagement went up 3×."
              </div>
              <div className="tcard-user">
                <div className="tc-av" style={{ background: 'rgba(91,110,245,0.2)', color: 'var(--ac3)' }}>
                  MK
                </div>
                <div>
                  <div className="tc-name">Maya Krishnan</div>
                  <div className="tc-role">Founder, DevCircle</div>
                </div>
              </div>
            </div>

            <div className="tcard reveal reveal-d2">
              <div className="tcard-stars" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={14} />)}</div>
              <div className="tcard-text">
                "The moderation tools are genuinely <em>the best I've used anywhere</em>. AutoMod catches 97% of issues
                before they escalate. Our mods can finally breathe."
              </div>
              <div className="tcard-user">
                <div className="tc-av" style={{ background: 'rgba(139,92,246,0.2)', color: 'var(--ac3)' }}>
                  JL
                </div>
                <div>
                  <div className="tc-name">James Liu</div>
                  <div className="tc-role">Community Lead, Scale AI</div>
                </div>
              </div>
            </div>

            <div className="tcard reveal reveal-d3">
              <div className="tcard-stars" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={14} />)}</div>
              <div className="tcard-text">
                "We ran our first hackathon on Gameunity with <em>400 participants</em> and zero issues. The event
                infrastructure is rock solid."
              </div>
              <div className="tcard-user">
                <div className="tc-av" style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--success)' }}>
                  SP
                </div>
                <div>
                  <div className="tc-name">Sofia Petrov</div>
                  <div className="tc-role">CTO, Buildspace</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
         CTA SECTION
      ═══════════════════════════════════════ */}
      <section className="cta-section">
        <div className="section-inner">
          <div className="cta-box reveal">
            <h2 className="cta-h2">
              Ready to build your
              <br />
              <span className="grad-txt">community?</span>
            </h2>
            <p className="cta-sub">Join 148,000+ members already on Gameunity. Free to start, no credit card required.</p>
            <div className="cta-btns">
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button className="btn-hero">Create your community →</Button>
              </Link>
              <Link to="/pricing" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn-hero-secondary">View pricing</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
}

