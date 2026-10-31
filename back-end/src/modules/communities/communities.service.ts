import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommunityRecord, db, nextId, saveDb } from '../../common/utils/in-memory-db';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

// Doc §8/§20 — per-community channel cap by the OWNER's plan (matches the
// counts pricing.js actually advertises). null = unlimited.
const CHANNEL_LIMIT_BY_PLAN: Record<string, number | null> = {
  free: 4,
  plus: 20,
  ultra_pro: null,
};

@Injectable()
export class CommunitiesService {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  findAll(): CommunityRecord[] {
    return db.communities.map((c) => {
      const realMemberCount = db.memberships.filter((m) => m.communityId === c.id).length;
      const owner = db.users.find((u) => u.id === c.ownerId);
      const ownerName = owner
        ? ([owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.fullName || owner.name || owner.username || 'Community Owner')
        : 'Community Owner';
      return {
        ...c,
        ownerName,
        memberCount: realMemberCount,
        onlineCount: realMemberCount > 0 ? Math.max(1, Math.round(realMemberCount * 0.4)) : 0,
      };
    });
  }

  findOne(id: number): CommunityRecord {
    const community = db.communities.find((item) => item.id === id);
    if (!community) {
      throw new NotFoundException(`Community with id ${id} not found`);
    }
    const realMemberCount = db.memberships.filter((m) => m.communityId === community.id).length;
    const owner = db.users.find((u) => u.id === community.ownerId);
    const ownerName = owner
      ? ([owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.fullName || owner.name || owner.username || 'Community Owner')
      : 'Community Owner';
    return {
      ...community,
      ownerName,
      memberCount: realMemberCount,
      onlineCount: realMemberCount > 0 ? Math.max(1, Math.round(realMemberCount * 0.4)) : 0,
    };
  }

  create(payload: CreateCommunityDto): CommunityRecord {
    // Resolve ownerId — fall back to first user if not found so community is always created
    const resolvedOwnerId = payload.ownerId && db.users.find((u) => u.id === payload.ownerId)
      ? payload.ownerId
      : (db.users[0]?.id ?? 1);

    const created: CommunityRecord = {
      id: nextId('community'),
      ...payload,
      ownerId: resolvedOwnerId,
    };

    db.communities.push(created);

    // The creator becomes a member with role 'owner' immediately. Before,
    // this membership was only added by the start-up migration, so a new
    // community showed 0 members (and no owner) until the server restarted.
    // The migration skips it on restart because it already exists.
    db.memberships.push({
      id: nextId('membership'),
      userId: resolvedOwnerId,
      communityId: created.id,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    });

    saveDb();
    return created;
  }

  update(id: number, payload: UpdateCommunityDto): CommunityRecord {
    const rawCommunity = db.communities.find((item) => item.id === id);
    if (!rawCommunity) {
      throw new NotFoundException(`Community with id ${id} not found`);
    }

    if (payload.ownerId) {
      const owner = db.users.find((user) => user.id === payload.ownerId);
      if (!owner) {
        throw new BadRequestException('ownerId must reference an existing user');
      }
    }

    if (payload.channels) {
      const { plan } = this.subscriptionsService.status(rawCommunity.ownerId);
      const limit = CHANNEL_LIMIT_BY_PLAN[plan] ?? CHANNEL_LIMIT_BY_PLAN.free;
      if (limit !== null && payload.channels.length > limit) {
        throw new ForbiddenException(
          `${plan === 'free' ? 'Free' : 'Plus'} plan is limited to ${limit} channels per community — upgrade for more.`,
        );
      }
    }

    Object.assign(rawCommunity, payload);
    saveDb();
    return this.findOne(id);
  }

  remove(id: number): { message: string } {
    this.findOne(id);
    db.communities = db.communities.filter((item) => item.id !== id);
    db.memberships = db.memberships.filter((item) => item.communityId !== id);
    db.events = db.events.filter((item) => item.communityId !== id);
    db.posts = db.posts.filter((item) => item.communityId !== id);
    db.reports = db.reports.filter((item) => !(item.targetType === 'community' && item.targetId === id));
    saveDb();
    return { message: `Community ${id} deleted` };
  }
}
