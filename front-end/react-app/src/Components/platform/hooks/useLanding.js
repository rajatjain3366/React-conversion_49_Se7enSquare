import { useState, useEffect } from 'react';
import { dashboardService } from '../../../services/dashboardService';

export const HOW_IT_WORKS_STEPS = [
  {
    num: '01',
    title: 'Create your community',
    desc: 'Choose a name, set your focus, and configure roles and channels in under 2 minutes. No technical setup required.',
  },
  {
    num: '02',
    title: 'Invite your people',
    desc: 'Share a link, embed a widget, or sync with your existing audience. Members join with one click.',
  },
  {
    num: '03',
    title: 'Host your first event',
    desc: 'Schedule an AMA, a code sprint, or a workshop. Gameunity handles RSVPs, reminders, and the live experience.',
  },
  {
    num: '04',
    title: 'Grow with analytics',
    desc: 'Track engagement, retention, and member growth. Use smart suggestions to keep momentum going.',
  },
];

/**
 * Custom hook managing animations, stats counters, 3D tilt, and interactions for the Landing page.
 */
export default function useLanding() {
  // ── 1. Statistics State from Backend ──
  const [stats, setStats] = useState({
    users: '0',
    comms: '0',
    msgs: '0',
  });

  useEffect(() => {
    dashboardService
      .getLandingStats()
      .then((data) => {
        if (data) {
          const u = data.totalUsers ?? 0;
          const c = data.totalCommunities ?? 0;
          const m = data.totalMessages ?? 0;
          setStats({
            users: u >= 1000 ? `${(u / 1000).toFixed(1)}K+` : String(u),
            comms: c >= 1000 ? `${(c / 1000).toFixed(1)}K+` : String(c),
            msgs: m >= 1000 ? `${(m / 1000).toFixed(1)}K+` : String(m),
          });
        }
      })
      .catch((error) => {
        console.error('Failed to load landing page stats:', error);
      });
  }, []);

  // ── 2. How It Works Step Switching & Auto-Cycling ──
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % HOW_IT_WORKS_STEPS.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // ── 3. Interactive Joined States for Mockup Communities ──
  const [joinedCommunities, setJoinedCommunities] = useState({
    devNexus: true,
    designStudio: false,
    openSourceHub: false,
    hackathonHQ: false,
  });

  const toggleJoin = (key) => {
    setJoinedCommunities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ── 4. 3D Tilt Effect on Hero Mockup ──
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'rotateY(-6deg) rotateX(3deg)',
  });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltStyle({
      transform: `rotateY(${x * 14}deg) rotateX(${-y * 8}deg)`,
      transition: 'transform 0.1s ease-out',
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'rotateY(-6deg) rotateX(3deg)',
      transition: 'transform 0.4s ease-out',
    });
  };

  // ── 5. Scroll Reveal Effect with IntersectionObserver ──
  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => revealObserver.observe(el));

    return () => {
      revealElements.forEach((el) => revealObserver.unobserve(el));
    };
  }, []);

  return {
    stats,
    activeStep,
    setActiveStep,
    steps: HOW_IT_WORKS_STEPS,
    joinedCommunities,
    toggleJoin,
    tiltStyle,
    handleMouseMove,
    handleMouseLeave,
  };
}
