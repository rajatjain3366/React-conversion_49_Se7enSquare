import { Injectable } from '@nestjs/common';
import { db } from '../../common/utils/in-memory-db';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class DashboardService {
  constructor(private readonly paymentsService: PaymentsService) {}

  getLandingStats() {
    const activeCommunities = db.communities.filter((community) => community.status !== 'suspended');

    return {
      totalUsers: db.users.filter((user) => user.status === 'active' || !user.status).length,
      totalCommunities: activeCommunities.length,
      totalMessages: db.messages.length,
    };
  }

  getStats() {
    const suspendedCommIds = new Set(
      db.communities.filter((c) => c.status === 'suspended').map((c) => c.id),
    );
    const activeCommunities = db.communities.filter((c) => c.status !== 'suspended');
    const activeEvents = db.events.filter((item) => !suspendedCommIds.has(item.communityId));
    const landingStats = this.getLandingStats();

    return {
      ...landingStats,
      allCommunitiesCount: db.communities.length,
      suspendedCommunitiesCount: db.communities.length - activeCommunities.length,
      totalEvents: activeEvents.length,
      allEventsCount: db.events.length,
      suspendedEventsCount: db.events.length - activeEvents.length,
      pendingReportsCount: db.reports.filter((report) => report.status === 'pending').length,
      pendingAppealsCount: db.appeals.filter((appeal) => appeal.status === 'pending').length,
      pendingEventsCount: activeEvents.filter((event) => event.status === 'pending').length,
      totalMemberships: db.memberships.length,
    };
  }

  /** Powers the read-only Owner "Revenue Overview" dashboard (doc §5/§19). */
  getRevenueStats() {
    const summary = this.paymentsService.summary();
    return {
      ...summary,
      premiumUsers: db.subscriptions.filter((sub) => sub.status === 'active' && sub.plan !== 'free').length,
      verifiedOrganisers: db.organisers.filter((org) => org.status === 'verified').length,
      pendingOrganiserApplications: db.organisers.filter((org) => org.status === 'pending').length,
      activeFeaturedEvents: db.featuredEvents.filter((item) => item.status === 'active' && new Date(item.endAt).getTime() > Date.now()).length,
    };
  }
}
