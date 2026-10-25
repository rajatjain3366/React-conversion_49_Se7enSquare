import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, EventRecord, nextId, saveDb } from '../../common/utils/in-memory-db';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  findAll(status?: string, includeSuspended = false): EventRecord[] {
    const suspendedCommIds = new Set(
      db.communities.filter((c) => c.status === 'suspended').map((c) => c.id),
    );
    let list = db.events;
    if (!includeSuspended) {
      list = list.filter((item) => !suspendedCommIds.has(item.communityId));
    }
    if (status) {
      return list.filter((item) => item.status === status);
    }
    return list;
  }

  findOne(id: number): EventRecord {
    const event = db.events.find((item) => item.id === id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  create(payload: CreateEventDto): EventRecord {
    const community = db.communities.find((item) => item.id === payload.communityId);
    if (!community) {
      throw new BadRequestException('communityId must reference an existing community');
    }

    const status = payload.status || 'pending';
    if (status === 'approved') {
      this.assertNoEventClash(payload.communityId, payload.date, payload.time);
    }

    const created: EventRecord = {
      id: nextId('event'),
      ...payload,
      status,
    };

    db.events.push(created);
    saveDb();
    return created;
  }

  update(id: number, payload: UpdateEventDto): EventRecord {
    const event = this.findOne(id);

    if (payload.communityId) {
      const community = db.communities.find((item) => item.id === payload.communityId);
      if (!community) {
        throw new BadRequestException('communityId must reference an existing community');
      }
    }

    const nextCommunityId = payload.communityId || event.communityId;
    const nextDate = payload.date || event.date;
    const nextTime = payload.time ?? event.time;
    const nextStatus = payload.status || event.status;

    if (nextStatus === 'approved') {
      this.assertNoEventClash(nextCommunityId, nextDate, nextTime, id);
    }

    Object.assign(event, payload);
    saveDb();
    return event;
  }

  private assertNoEventClash(communityId: number, date: string, time?: string, ignoreId?: number): void {
    const clash = db.events.find((item) =>
      item.id !== ignoreId &&
      item.communityId === communityId &&
      item.status === 'approved' &&
      item.date === date &&
      (item.time || '') === (time || ''),
    );

    if (clash) {
      throw new BadRequestException('An approved event already exists for this community at the selected date and time');
    }
  }

  remove(id: number): { message: string } {
    this.findOne(id);
    db.events = db.events.filter((item) => item.id !== id);
    saveDb();
    return { message: `Event ${id} deleted` };
  }

  /**
   * Every registration for one event, joined with the registrant's platform
   * username plus the contact details they gave at registration time — powers
   * the organizer's "View Registrants" page (event-registrants.html).
   */
  getRegistrants(id: number) {
    const event = this.findOne(id);
    const registrations = db.eventRegistrations.filter((item) => item.eventId === id);

    const registrants = registrations.map((reg) => {
      const user = db.users.find((item) => item.id === reg.userId);
      return {
        registrationId: reg.id,
        userId: reg.userId,
        username: user?.username || `user#${reg.userId}`,
        fullName: reg.fullName || '',
        email: reg.contactEmail || user?.email || '',
        phone: reg.phone || '',
        inGameId: reg.inGameId || '',
        registeredAt: reg.registeredAt,
      };
    });

    return { eventId: event.id, eventTitle: event.title, registrants };
  }
}
