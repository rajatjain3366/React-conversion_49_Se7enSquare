import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/policies.css';

const sections = [
  {
    title: '1. Acceptance of these terms',
    paragraphs: [
      'These Terms & Conditions govern your use of Gameunity, a community platform for discovering communities, communicating with other members, sharing posts, and participating in events. By creating an account or using the platform, you agree to these terms.',
      'If you do not agree with these terms, do not create an account or use Gameunity. We may update these terms from time to time; continued use after an update means that you accept the revised terms.',
    ],
  },
  {
    title: '2. User accounts',
    paragraphs: [
      'You must provide accurate information when registering, including your name, email address, username, and password. You are responsible for keeping your login details confidential and for activity performed through your account.',
      'An account is personal to you. Do not share access, impersonate another person, or create an account using information that does not belong to you. Contact us promptly if you believe your account has been accessed without permission.',
    ],
  },
  {
    title: '3. User responsibilities',
    paragraphs: [
      'Use Gameunity lawfully and respectfully. You are responsible for the content you submit, including community information, posts, messages, event details, reports, appeals, and uploaded files.',
      'Follow the rules of the communities and events you join, respect other members, and make sure you have the right to share anything you upload or publish.',
    ],
  },
  {
    title: '4. Prohibited activities',
    paragraphs: [
      'You may not use Gameunity to break the law, threaten or harass others, share malicious code, attempt unauthorized access, interfere with the platform, collect other users’ information without permission, or evade moderation or account restrictions.',
      'You may not use the platform for spam, fraud, impersonation, unlawful discrimination, or content that infringes another person’s rights. We may review reports and take action under these terms and applicable law.',
    ],
  },
  {
    title: '5. Content and intellectual property',
    paragraphs: [
      'You retain ownership of content you submit. By submitting content, you give Gameunity the permission needed to host, store, display, and distribute it within the platform so that its features work for you and other authorized users.',
      'Gameunity’s name, branding, software, interface, and original materials are owned by Gameunity or its licensors. You may not copy, modify, distribute, or reverse engineer those materials except where the law permits it.',
    ],
  },
  {
    title: '6. Account suspension or termination',
    paragraphs: [
      'We may restrict, suspend, or terminate an account when we reasonably believe that it violates these terms, harms other users, threatens platform safety, or is required by law. Moderation decisions may be reviewed through the available appeal process.',
      'You may stop using Gameunity at any time. Ending an account does not remove obligations or rights that arose before termination, and content may remain where it is necessary for moderation, legal, or operational reasons.',
    ],
  },
  {
    title: '7. Disclaimers',
    paragraphs: [
      'Gameunity is provided on an “as available” basis. We do not guarantee that the platform will always be uninterrupted, error-free, or that user-submitted content will be accurate, safe, or available.',
      'You are responsible for evaluating interactions, communities, events, and content on the platform. Gameunity does not endorse every statement or action of its users.',
    ],
  },
  {
    title: '8. Limitation of liability',
    paragraphs: [
      'To the extent permitted by law, Gameunity and its operators will not be liable for indirect, incidental, special, consequential, or punitive losses, or for loss of data, profits, or opportunities arising from your use of the platform or reliance on user content.',
      'Nothing in these terms limits liability that cannot legally be limited or excludes rights that cannot legally be excluded.',
    ],
  },
  {
    title: '9. Contact information',
    paragraphs: [
      'Questions about these Terms & Conditions or a moderation decision can be raised through the platform’s reports or appeals features. For other questions, contact the Gameunity team through the contact channel provided with your account or platform deployment.',
    ],
  },
];

export default function Terms() {
  return (
    <div className="policy-page">
      <header className="policy-header">
        <Link to="/landing" className="policy-brand" aria-label="Return to Gameunity home">
          <span className="policy-logo">G</span>
          <span>Gameunity</span>
        </Link>
        <Link to="/login" className="policy-back-link">Sign in</Link>
      </header>

      <main className="policy-main">
        <div className="policy-intro">
          <p className="policy-eyebrow">LEGAL</p>
          <h1>Terms &amp; Conditions</h1>
          <p>These terms explain the rules for using Gameunity and participating in its communities.</p>
          <p className="policy-updated">Last updated: November 1, 2026</p>
        </div>
        <article className="policy-card">
          {sections.map((section) => (
            <section className="policy-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
