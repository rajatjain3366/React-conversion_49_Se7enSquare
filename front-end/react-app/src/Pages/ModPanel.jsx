import React from 'react';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/mod-panel.css';
import useModPanel       from './ModPanel/hooks/useModPanel';
import ModHeader         from './ModPanel/components/ModHeader';
import ReportQueueList   from './ModPanel/components/ReportQueueList';
import ReportDetailView  from './ModPanel/components/ReportDetailView';
import ModActionPanel    from './ModPanel/components/ModActionPanel';

/**
 * ModPanel page - thin orchestrator.
 * All state, fetching, and action logic lives in useModPanel().
 */
export default function ModPanel() {
  const m = useModPanel();

  return (
    <div className="app-shell">
      <SideBar />
      <div className="mp-main">
        <ModHeader user={m.user} navigate={m.navigate} />

        <div className="mp-panel-layout">
          <ReportQueueList
            QUEUE_TABS={m.QUEUE_TABS}
            activeQTab={m.activeQTab}
            onTabChange={m.setActiveQTab}
            queueSearch={m.queueSearch}
            onQueueSearchChange={m.setQueueSearch}
            queueCounts={m.queueCounts}
            loading={m.loading}
            filteredReports={m.filteredReports}
            selectedReport={m.selectedReport}
            onSelectReport={m.setSelectedReport}
          />

          <ReportDetailView
            selectedReport={m.selectedReport}
            actionNote={m.actionNote}
            onActionNoteChange={m.setActionNote}
          />

          <ModActionPanel
            selectedReport={m.selectedReport}
            MOD_ACTIONS={m.MOD_ACTIONS}
            processing={m.processing}
            onTakeAction={m.takeAction}
            onMoveToReview={m.moveToReview}
            onEscalate={m.escalateReport}
            queueCounts={m.queueCounts}
            recentActions={m.recentActions}
          />
        </div>

        <div className={`mp-toast${m.toast.show ? ' show' : ''}`} id="toast">
          <span>{m.toast.msg}</span>
        </div>
      </div>
    </div>
  );
}
