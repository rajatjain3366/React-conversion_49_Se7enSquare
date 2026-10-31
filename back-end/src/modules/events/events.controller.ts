import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

// Only a community manager or admin may set an event's status to "approved".
// Everyone else (e.g. an organizer) creates/edits events that stay pending
// until a community manager approves them on the Event Approval page.
// `role` comes from the user record in the database (via the auth guard),
// not from the x-role header.
const APPROVER_ROLES: string[] = [AppRole.COMMUNITY_MANAGER, AppRole.ADMIN];

function assertCanSetStatus(role: string, status?: string) {
  if (status === 'approved' && !APPROVER_ROLES.includes(role)) {
    throw new ForbiddenException('Only a community manager or admin can approve events');
  }
}

@ApiTags('events')
@ApiHeader({
  name: 'x-role',
  required: true,
  description:
    'RBAC role header. Accepted values: admin | community_manager | organizer | moderator | user. ' +
    'GET / POST require any valid role. PATCH requires community_manager, organizer, or admin. DELETE requires admin.',
  schema: { type: 'string', enum: ['admin', 'community_manager', 'organizer', 'moderator', 'user'] },
})
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER, AppRole.OWNER)
  @ApiOperation({
    summary: 'List all events',
    description: 'Returns all events. Public clients should render only approved events.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter events by status',
    example: 'upcoming',
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
  })
  @ApiQuery({
    name: 'includeSuspended',
    required: false,
    description: 'Include events belonging to suspended communities',
    type: Boolean,
  })
  @ApiOkResponse({ type: EventDto, isArray: true, description: 'Array of event records' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  findAll(
    @Query('status') status?: string,
    @Query('includeSuspended') includeSuspended?: string,
  ) {
    return this.eventsService.findAll(status, includeSuspended === 'true');
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  @ApiOperation({
    summary: 'Get a single event by ID',
    description: 'Fetches one event by its numeric ID.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric event ID' })
  @ApiOkResponse({ type: EventDto, description: 'The matching event record' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/registrants')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.ORGANIZER)
  @ApiOperation({
    summary: 'List an event\'s registrants',
    description: 'Returns every registration for this event joined with the registrant\'s username and the contact details given at registration time. Requires community_manager, organizer, or admin.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric event ID' })
  @ApiOkResponse({ description: 'Event title plus an array of registrants' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  @ApiForbiddenResponse({ description: 'Only community_manager, organizer, or admin can view registrants' })
  getRegistrants(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getRegistrants(id);
  }

  @Post()
  // Only organizers and admins create events (was: also user, moderator, community_manager).
  @Roles(AppRole.ADMIN, AppRole.ORGANIZER)
  @ApiOperation({
    summary: 'Create an event',
    description: 'Creates an event request. Users submit pending events; Community Managers/Admins can publish approved events.',
  })
  @ApiBody({ type: CreateEventDto, description: 'Event creation payload' })
  @ApiCreatedResponse({ type: EventDto, description: 'The newly created event' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  create(@Body() payload: CreateEventDto, @CurrentUser('role') role: string) {
    assertCanSetStatus(role, payload.status);
    return this.eventsService.create(payload);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.ORGANIZER)
  @ApiOperation({
    summary: 'Update an event',
    description: 'Partially updates an event and supports approve/reject status changes. Requires community_manager, organizer, or admin.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric event ID to update' })
  @ApiBody({ type: UpdateEventDto, description: 'Fields to update (all optional)' })
  @ApiOkResponse({ type: EventDto, description: 'The updated event record' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  @ApiForbiddenResponse({ description: 'Only community_manager, organizer, or admin can update events' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateEventDto,
    @CurrentUser('role') role: string,
  ) {
    assertCanSetStatus(role, payload.status);
    return this.eventsService.update(id, payload);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({
    summary: 'Delete an event',
    description: 'Permanently deletes an event. Requires x-role: admin.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric event ID to delete' })
  @ApiOkResponse({ schema: { example: { message: 'Event 2 deleted' } }, description: 'Deletion confirmation' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  @ApiForbiddenResponse({ description: 'Only admin can delete events' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.remove(id);
  }
}
