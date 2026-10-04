import { Controller, Get } from '@nestjs/common';
import type { ApiHealth, HomeSummary } from '@applyfields/types';
import { sampleOpportunities, sampleUpdates } from '../opportunities/sample-data.js';

@Controller()
export class HomeController {
  /** GET /api/v1/health — used by the web footer to show "API connected" */
  @Get('health')
  health(): ApiHealth {
    return { status: 'ok', service: 'applyfields-api', time: new Date().toISOString() };
  }

  /** GET /api/v1/home — everything the home dashboard needs in one call (sample data for now) */
  @Get('home')
  summary(): HomeSummary {
    const open = sampleOpportunities()
      .filter((o) => o.days_left === null || o.days_left >= 0)
      .sort((a, b) => (a.days_left ?? 999) - (b.days_left ?? 999));
    const closingThisWeek = open.filter((o) => o.days_left !== null && o.days_left <= 7);

    return {
      generated_at: new Date().toISOString(),
      stats: [
        { key: 'open_jobs', label: 'Open government jobs', value: 1240, hint: '+38 this week' },
        { key: 'exams_this_month', label: 'Exams this month', value: 18, hint: '6 admit cards out' },
        { key: 'scholarships_open', label: 'Scholarships open', value: 64, hint: 'Central + state' },
        { key: 'closing_this_week', label: 'Closing this week', value: closingThisWeek.length, hint: 'Don’t miss them' },
      ],
      closing_soon: open.filter((o) => o.days_left !== null && o.days_left <= 12).slice(0, 5),
      popular: [open[2], open[4], open[7], open[9]].filter(Boolean),
      updates: sampleUpdates(),
      popular_searches: ['SSC CGL', 'APPSC Group 2', 'NEET UG', 'Police jobs Telangana', 'PAN card', 'NSP scholarship'],
      sample: true,
    };
  }
}
