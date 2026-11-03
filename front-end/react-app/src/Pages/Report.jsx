import React from 'react';
import AppShell from '../Components/platform/layout/AppShell';
import useReportForm from '../Components/platform/hooks/useReportForm';
import ReportHeader from './Report/components/ReportHeader';
import ReportStepper from './Report/components/ReportStepper';
import TargetStep from './Report/components/TargetStep';
import ReasonStep from './Report/components/ReasonStep';
import ReviewStep from './Report/components/ReviewStep';
import SuccessStep from './Report/components/SuccessStep';
import '../styles/report.css';

/**
 * Report Page Component
 * Modular page handling content reporting flow through 4 panels:
 * 1. Select Target, 2. Select Reason, 3. Review & Submit, 4. Success.
 */
export default function Report() {
  const {
    currentUser,
    step,
    setStep,
    selectedReason,
    setSelectedReason,
    additionalContext,
    setAdditionalContext,
    confirmed,
    setConfirmed,
    submitted,
    refId,
    userSearch,
    selectedTarget,
    setSelectedTarget,
    searchResults,
    submitting,
    handleUserSearch,
    submitReport,
    resetForm,
    goStep,
  } = useReportForm();

  const userInitials = (currentUser.firstName?.slice(0, 2) || 'US').toUpperCase();

  return (
    <AppShell customHeader={<ReportHeader userInitials={userInitials} target={selectedTarget} />}>
      <div className="page-wrap">
        <div className="report-container">
          <ReportStepper step={step} submitted={submitted} />

          {step === 1 && (
            <TargetStep
              selectedTarget={selectedTarget}
              setSelectedTarget={setSelectedTarget}
              userSearch={userSearch}
              handleUserSearch={handleUserSearch}
              searchResults={searchResults}
              goStep={goStep}
            />
          )}

          {step === 2 && (
            <ReasonStep
              selectedReason={selectedReason}
              setSelectedReason={setSelectedReason}
              additionalContext={additionalContext}
              setAdditionalContext={setAdditionalContext}
              setStep={setStep}
              goStep={goStep}
            />
          )}

          {step === 3 && (
            <ReviewStep
              selectedTarget={selectedTarget}
              selectedReason={selectedReason}
              additionalContext={additionalContext}
              confirmed={confirmed}
              setConfirmed={setConfirmed}
              submitting={submitting}
              setStep={setStep}
              submitReport={submitReport}
            />
          )}

          {step === 4 && (
            <SuccessStep
              refId={refId}
              resetForm={resetForm}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
