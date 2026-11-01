import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/policies.css';

const sections = [
  {
    title: '1. Information we collect',
    paragraphs: [
      'When you register, we collect the information you provide, such as your name, email address, username, role selection, and password. Passwords are processed by the server and are not kept in your browser session.',
      'When you use Gameunity, we may store content and activity needed for the features you choose to use, such as community details, posts, messages, event registrations, uploaded files, reports, appeals, profile settings, and subscription or payment status.',
      'If you use Google sign-in, Google provides the profile information needed to authenticate you, such as your email address, name, profile identifier, and profile image where available.',
    ],
  },
  {
    title: '2. How we use information',
    paragraphs: [
      'We use information to create and authenticate accounts, provide communities and platform features, support events and communications, process requests, maintain account settings, respond to reports and appeals, and operate and improve Gameunity.',
      'We also use information to prevent abuse, enforce our terms, investigate security or moderation issues, and communicate with you about your account or activity.',
    ],
  },
  {
    title: '3. Account information',
    paragraphs: [
      'Your public profile and the content you choose to share may be visible to other users according to the platform’s profile, community, and content settings. Account credentials are used to sign you in and are not displayed to other users.',
      'The browser stores a limited session record so the application can recognize your signed-in account. This record includes account identifiers and display information, not your password or password hash.',
    ],
  },
  {
    title: '4. Data storage',
    paragraphs: [
      'Gameunity stores account and platform data in its application data store. The current application also uses browser local storage for the active session and selected client-side settings. Data is sent to the application server when a feature requires it.',
      'Do not submit information that you do not want stored or shared through the feature you are using. The platform may retain moderation and operational records as described below.',
    ],
  },
  {
    title: '5. Cookies and similar technologies',
    paragraphs: [
      'The current application does not require advertising cookies or analytics cookies. It uses browser local storage for session persistence and selected application preferences. Your browser may still apply its own standard storage and security behavior.',
    ],
  },
  {
    title: '6. Data sharing',
    paragraphs: [
      'We share information within Gameunity when necessary for the feature you use, such as showing content to community members, delivering messages, or allowing moderators and administrators to review reports and appeals.',
      'If you choose Google sign-in, authentication information is exchanged with Google as part of that sign-in flow. We do not claim that every external service is used unless the relevant feature is enabled. We may disclose information when required by law or needed to protect users, the platform, or others.',
    ],
  },
  {
    title: '7. Data security',
    paragraphs: [
      'We use application controls intended to limit access to account and platform data, including authentication, role-based access, and moderation controls. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
      'Keep your password private, use a unique password, and notify us if you suspect unauthorized access.',
    ],
  },
  {
    title: '8. Data retention',
    paragraphs: [
      'We retain account, content, and operational information for as long as needed to provide the service, meet legal or security requirements, resolve disputes, and enforce our terms. Retention can vary by the type of information and the feature involved.',
    ],
  },
  {
    title: '9. Your rights and choices',
    paragraphs: [
      'Depending on where you live, you may have rights to access, correct, delete, or receive a copy of personal information, or to object to or restrict certain processing. You can update available profile and privacy settings in the application and may ask us about other requests through the platform’s contact channel.',
      'We may need to verify a request and may retain information where required by law or necessary for security, moderation, or dispute resolution.',
    ],
  },
  {
    title: '10. Policy updates',
    paragraphs: [
      'We may update this Privacy Policy when the application, legal requirements, or our practices change. The updated version will be posted here with a new “Last updated” date. Continued use after an update means you acknowledge the revised policy.',
    ],
  },
  {
    title: '11. Contact information',
    paragraphs: [
      'For privacy questions or requests, contact the Gameunity team through the contact channel provided with your account or platform deployment. Include enough information for us to understand and verify your request.',
    ],
  },
];

export default function Privacy() {
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
          <h1>Privacy Policy</h1>
          <p>This policy describes the information Gameunity handles when you use the platform.</p>
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
