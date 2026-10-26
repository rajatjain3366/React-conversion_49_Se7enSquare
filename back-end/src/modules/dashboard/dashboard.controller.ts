import { Controller, Get } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { DashboardStatsDto } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiHeader({
  name: 'x-role',
  required: true,
  description: 'Role for RBAC: admin | moderator | user',
})
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('landing-stats')
  @Public()
  @ApiOperation({ summary: 'Get public landing page stats' })
  @ApiOkResponse({
    schema: {
      example: { totalUsers: 7, totalCommunities: 3, totalMessages: 4 },
    },
  })
  getLandingStats() {
    return this.dashboardService.getLandingStats();
  }

  @Get('stats')
  @Roles(AppRole.ADMIN, AppRole.OWNER, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  @ApiOperation({ summary: 'Get dashboard stats' })
  @ApiOkResponse({ type: DashboardStatsDto })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('revenue')
  @Roles(AppRole.ADMIN, AppRole.OWNER)
  @ApiOperation({ summary: 'Get revenue overview', description: 'Owner/Admin only — total/monthly revenue, subscription/organiser/featured-event revenue, premium user counts.' })
  getRevenue() {
    return this.dashboardService.getRevenueStats();
  }
}
