import { BadRequestException, Controller, Get, NotImplementedException, Param, Query } from '@nestjs/common';
import type { OpportunityList, OpportunityType, UpdateList } from '@applyfields/types';
import { sampleOpportunities, sampleUpdates } from './sample-data.js';

const TYPES: OpportunityType[] = ['govt_job', 'exam', 'scholarship', 'admission'];

@Controller()
export class OpportunitiesController {
  /** GET /api/v1/opportunities?type=govt_job&q=ssc — list + simple search (sample data for now) */
  @Get('opportunities')
  list(@Query('type') type?: string, @Query('q') q?: string): OpportunityList {
    if (type && !TYPES.includes(type as OpportunityType)) {
      throw new BadRequestException(`type must be one of: ${TYPES.join(', ')}`);
    }
    const words = (q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    const items = sampleOpportunities()
      .filter((o) => !type || o.type === type)
      .filter((o) => {
        const text = `${o.title} ${o.organization} ${o.location} ${o.tags.join(' ')}`.toLowerCase();
        return words.every((w) => text.includes(w));
      })
      .sort((a, b) => (a.days_left ?? 999) - (b.days_left ?? 999));

    return { type: (type as OpportunityType | undefined) ?? 'all', query: q ?? '', total: items.length, items, sample: true };
  }

  /** GET /api/v1/opportunities/:slug — the detail page arrives in Week 3 */
  @Get('opportunities/:slug')
  detail(@Param('slug') slug: string): never {
    throw new NotImplementedException(`Opportunity details for "${slug}" are being built (Week 3).`);
  }

  /** GET /api/v1/updates — admit cards, results, answer keys, date changes */
  @Get('updates')
  updates(): UpdateList {
    return { items: sampleUpdates(), sample: true };
  }
}
