import React from 'react';
import '../styles/global.css';
import '../styles/appeal.css';
import useAppeal from '../Components/platform/hooks/useAppeal';
import {
  AppealHeader,
  ActionDetailsCard,
  AppealForm,
  AppealSidebar,
  AppealSuccess,
} from './Appeal/components/AppealComponents';

/**
 * Appeal page — thin orchestrator.
 * All state, validation, and submission logic lives in useAppeal().
 */
export default function Appeal() {
  const a = useAppeal();

  if (a.submitted) {
    return (
      <AppealSuccess
        refId={a.refId}
        navigate={a.navigate}
        onReset={a.resetForm}
      />
    );
  }

  return (
    <div className="main">
      <AppealHeader navigate={a.navigate} />

      <div className="page-wrap">
        <div className="appeal-layout">
          <div id="formWrap">
            <div className="page-title-row">
              <div className="page-icon">⚖️</div>
              <div>
                <div className="page-title">Submit an Appeal</div>
                <div className="page-sub">Contest a moderation action taken against your account</div>
              </div>
            </div>

            <ActionDetailsCard action={a.action} user={a.user} />

            <AppealForm
              APPEAL_TYPES={a.APPEAL_TYPES}
              appealType={a.appealType}
              onAppealTypeChange={a.setAppealType}
              statement={a.statement}
              onStatementChange={a.setStatement}
              commitment={a.commitment}
              onCommitmentChange={a.setCommitment}
              errors={a.errors}
              submitting={a.submitting}
              onSubmit={a.handleSubmit}
              onCancel={() => a.navigate(-1)}
            />
          </div>

          <AppealSidebar myAppeals={a.myAppeals} />
        </div>
      </div>
    </div>
  );
}
