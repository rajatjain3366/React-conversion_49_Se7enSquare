import React, { useState } from 'react';
import { PLANS } from '../../../Components/platform/data/pricingPlans';

function ApplicationStatus({ data, error, roleLabel }) {
  if (error) {
    return <p className="profile-error" role="alert" style={{ marginBottom: '12px' }}>{error}</p>;
  }
  if (!data) return null;

  const status = data.status || 'none';
  if (status === 'none') return null;

  const isPending = status === 'pending';
  const isApproved = status === 'verified' || status === 'certified';
  const isRejected = status === 'rejected';

  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: '10px',
        marginBottom: '16px',
        background: isApproved
          ? 'rgba(34, 197, 94, 0.1)'
          : isPending
          ? 'rgba(245, 158, 11, 0.1)'
          : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${
          isApproved
            ? 'rgba(34, 197, 94, 0.3)'
            : isPending
            ? 'rgba(245, 158, 11, 0.3)'
            : 'rgba(239, 68, 68, 0.3)'
        }`,
        color: isApproved ? '#4ade80' : isPending ? '#fbbf24' : '#f87171',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
        {isApproved && `✅ ${roleLabel}: Approved`}
        {isPending && `⏳ ${roleLabel}: Application Under Review`}
        {isRejected && `❌ ${roleLabel}: Application Not Approved`}
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--text-2, #ccc)' }}>
        {isPending && 'Your application has been received and is waiting for administrator approval.'}
        {isApproved && 'Your certification is active and privileges are unlocked.'}
        {isRejected && (data.rejectionReason || 'Application did not meet minimum criteria.')}
      </div>
      {data.quizScore !== undefined && (
        <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-3, #aaa)' }}>
          Quiz Score: <strong>{data.quizScore}%</strong> (Passing requirement: {data.passMark || 70}%)
        </div>
      )}
    </div>
  );
}

export default function MembershipTab({ p }) {
  const {
    user,
    organiser,
    moderator,
    applicationErrors,
    organiserForm,
    setOrganiserForm,
    statement,
    setStatement,
  } = p;

  const [showCustomOrganiser, setShowCustomOrganiser] = useState(false);

  const plan = PLANS.find((item) => item.id === p.plan?.plan);
  const canOrganise = user.role === 'user';
  const canModerate = ['user', 'organizer', 'community_manager'].includes(user.role);

  const organiserStatus = organiser?.status || 'none';
  const moderatorStatus = moderator?.status || 'none';

  return (
    <div className="view active">
      {/* 1. Subscription Plan (Hidden for Platform Owner) */}
      {user.role !== 'owner' && (
        <div className="settings-card" style={{ marginBottom: '24px' }}>
          <h2 className="card-title">Membership &amp; Subscription</h2>
          <p className="card-sub" style={{ fontSize: '13px', color: 'var(--text-3, #9ca3af)', marginBottom: '16px' }}>
            Your current platform tier and premium benefits.
          </p>

          {applicationErrors.plan && <p role="alert" className="profile-error">{applicationErrors.plan}</p>}

          <div
            style={{
              padding: '18px 20px',
              borderRadius: '12px',
              background: 'rgba(91, 110, 245, 0.08)',
              border: '1px solid rgba(91, 110, 245, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                {plan ? plan.name : 'Free Member Tier'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-3, #aaa)' }}>
                {plan ? plan.description : 'Standard access to join communities, chat channels, and public events.'}
              </div>
            </div>
            <button
              type="button"
              className="tb-btn save"
              onClick={() => p.navigate('/pricing')}
              style={{ padding: '8px 18px', flexShrink: 0 }}
            >
              💎 Upgrade Plan
            </button>
          </div>
        </div>
      )}

      {user.role === 'owner' && (
        <div className="settings-card" style={{ marginBottom: '24px' }}>
          <h2 className="card-title">Platform Owner Privilege</h2>
          <p style={{ color: 'var(--text-2, #ccc)', fontSize: '14px', lineHeight: 1.6 }}>
            You are logged in as the <strong>Platform Owner</strong>. You have full systemic authority, read-only analytical access to all revenue streams, and no personal subscription limitations.
          </p>
        </div>
      )}

      {/* 2. Become an Organizer (Direct Submit or Custom Form) */}
      {(canOrganise || user.role === 'organizer') && (
        <div className="settings-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              {canOrganise ? '🏆 Become a Verified Organizer' : '🏆 Verified Organizer Status'}
            </h2>
          </div>
          <p className="card-sub" style={{ fontSize: '13px', color: 'var(--text-3, #9ca3af)', marginBottom: '16px' }}>
            Verified organizers can create tournaments, manage registrations, run brackets, and publish prize pools.
          </p>

          <ApplicationStatus
            data={organiser}
            error={applicationErrors.organiser}
            roleLabel="Organizer Application"
          />

          {canOrganise && ['none', 'rejected'].includes(organiserStatus) && (
            <div>
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff', marginBottom: '6px' }}>
                  ⚡ Quick Direct Submit
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-3, #888)', marginBottom: '14px', lineHeight: 1.5 }}>
                  Apply with one click using your profile background. Pre-populates your esports organizer profile and queues it immediately for admin approval.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="tb-btn save"
                    onClick={() => p.directApplyOrganizer()}
                    disabled={p.applying}
                    style={{ padding: '9px 20px', fontWeight: 600 }}
                  >
                    {p.applying ? '⏳ Submitting…' : '⚡ Direct Submit Organizer Application'}
                  </button>
                  <button
                    type="button"
                    className="tb-btn"
                    onClick={() => setShowCustomOrganiser((prev) => !prev)}
                    style={{ padding: '9px 16px' }}
                  >
                    {showCustomOrganiser ? 'Hide Custom Fields' : '📝 Custom Application Details'}
                  </button>
                </div>
              </div>

              {showCustomOrganiser && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    p.applyOrganizer();
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <label className="field">
                    <span>Experience Summary (20–1000 characters)</span>
                    <textarea
                      rows="3"
                      placeholder="Describe your previous experience managing brackets, esports tournaments, or gaming groups..."
                      value={organiserForm.experienceNote}
                      onChange={(e) =>
                        setOrganiserForm((prev) => ({ ...prev, experienceNote: e.target.value }))
                      }
                      style={{ marginTop: '4px' }}
                    />
                  </label>

                  <div className="field-row">
                    <label className="field">
                      <span>Games You Run</span>
                      <input
                        placeholder="e.g. Valorant, Rocket League, CS:GO"
                        value={organiserForm.games}
                        onChange={(e) =>
                          setOrganiserForm((prev) => ({ ...prev, games: e.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Organisations Worked With</span>
                      <input
                        placeholder="e.g. College Esports Club, Independent"
                        value={organiserForm.organisations}
                        onChange={(e) =>
                          setOrganiserForm((prev) => ({ ...prev, organisations: e.target.value }))
                        }
                      />
                    </label>
                  </div>

                  <div className="field-row">
                    <label className="field">
                      <span>Expected Tournament Size</span>
                      <input
                        type="number"
                        min="2"
                        max="100000"
                        placeholder="64"
                        value={organiserForm.expectedTournamentSize}
                        onChange={(e) =>
                          setOrganiserForm((prev) => ({
                            ...prev,
                            expectedTournamentSize: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Past Event Links (one per line, optional)</span>
                      <input
                        placeholder="https://example.com/past-bracket"
                        value={organiserForm.pastEventLinks}
                        onChange={(e) =>
                          setOrganiserForm((prev) => ({
                            ...prev,
                            pastEventLinks: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={organiserForm.rulesAgreement}
                      onChange={(e) =>
                        setOrganiserForm((prev) => ({
                          ...prev,
                          rulesAgreement: e.target.checked,
                        }))
                      }
                    />
                    <span>I agree to publish tournament rules, enforce fair play, and follow platform moderation policies.</span>
                  </label>

                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="submit"
                      className="tb-btn save"
                      disabled={p.applying}
                      style={{ padding: '10px 24px' }}
                    >
                      {p.applying ? '⏳ Submitting…' : 'Submit Custom Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Become a Certified Moderator */}
      {(canModerate || user.role === 'moderator') && (
        <div className="settings-card">
          <h2 className="card-title">
            {canModerate ? '🛡️ Become a Certified Moderator' : '🛡️ Certified Moderator Status'}
          </h2>
          <p className="card-sub" style={{ fontSize: '13px', color: 'var(--text-3, #9ca3af)', marginBottom: '16px' }}>
            Certified moderators review community reports, enforce behavioral standards, and maintain platform integrity. Requires scoring ≥70% on the Moderation Ethics Quiz.
          </p>

          <ApplicationStatus
            data={moderator}
            error={applicationErrors.moderator}
            roleLabel="Moderator Certification"
          />

          {canModerate && ['none', 'rejected'].includes(moderatorStatus) && !p.quizOpen && (
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="tb-btn save"
                onClick={p.openQuiz}
                style={{ padding: '10px 22px', fontWeight: 600 }}
              >
                📝 Take Moderation Certification Quiz
              </button>
            </div>
          )}

          {p.quizOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                p.submitQuiz();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  background: 'rgba(91, 110, 245, 0.08)',
                  border: '1px solid rgba(91, 110, 245, 0.2)',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                  Candidate Statement
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label className="field">
                    <span>Why do you want to moderate? (20–1000 characters)</span>
                    <textarea
                      rows="3"
                      value={statement.why}
                      onChange={(e) => setStatement((prev) => ({ ...prev, why: e.target.value }))}
                      style={{ marginTop: '4px' }}
                    />
                  </label>
                  <div className="field-row">
                    <label className="field">
                      <span>Time Zone</span>
                      <input
                        value={statement.timeZone}
                        onChange={(e) => setStatement((prev) => ({ ...prev, timeZone: e.target.value }))}
                      />
                    </label>
                    <label className="field">
                      <span>Weekly Hours Available</span>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={statement.weeklyHours}
                        onChange={(e) =>
                          setStatement((prev) => ({ ...prev, weeklyHours: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                  Moderation Ethics Assessment ({p.questions.length} Questions)
                </h3>
                {p.questions.map((question, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px 18px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff', marginBottom: '12px' }}>
                      {i + 1}. {question.question}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {question.options.map((option, j) => {
                        const isSelected = p.quizAnswers[i] === j;
                        return (
                          <label
                            key={j}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: isSelected ? 'rgba(91, 110, 245, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${isSelected ? 'rgba(91, 110, 245, 0.45)' : 'rgba(255, 255, 255, 0.05)'}`,
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: isSelected ? '#fff' : 'var(--text-2, #ccc)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="radio"
                              name={`question-${i}`}
                              checked={isSelected}
                              onChange={() =>
                                p.setQuizAnswers((prev) => {
                                  const next = [...prev];
                                  next[i] = j;
                                  return next;
                                })
                              }
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="submit"
                  className="tb-btn save"
                  disabled={p.applying}
                  style={{ padding: '11px 26px', fontWeight: 700 }}
                >
                  {p.applying ? '⏳ Grading & Submitting…' : 'Submit Quiz & Application'}
                </button>
                <button
                  type="button"
                  className="tb-btn"
                  onClick={() => p.setQuizOpen(false)}
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
