import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Put, Req, UseGuards } from '@nestjs/common';
import type { SavedItem, SavedItemType, SavedList, SaveResult } from '@applyfields/types';
import { z } from 'zod';
import { ZodPipe } from '../../common/zod.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { OpportunitiesService } from '../opportunities/opportunities.service.js';

const ITEM_TYPES: SavedItemType[] = ['opportunity', 'service', 'institution'];
const saveSchema = z.object({ reminder_enabled: z.boolean().optional() }).default({});

/** Saved jobs, exams, scholarships, admissions, colleges and government services. */
@Controller('saved')
@UseGuards(AuthGuard)
export class SavedController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opportunities: OpportunitiesService,
  ) {}

  /** GET /saved — newest first; the web page filters by type */
  @Get()
  async list(@Req() req: AuthenticatedRequest): Promise<SavedList> {
    const rows = await this.prisma.saved_items.findMany({
      where: { user_id: req.user.userId, item_type: { in: ITEM_TYPES } },
      orderBy: { created_at: 'desc' },
      take: 500,
    });
    const ids = (t: SavedItemType) => rows.filter((r) => r.item_type === t).map((r) => r.item_id);
    const instIds = ids('institution');

    const [cards, services, institutions] = await Promise.all([
      this.opportunities.cardMap(ids('opportunity')),
      this.prisma.gov_services.findMany({
        where: { id: { in: ids('service') }, status: { in: ['published', 'closed'] } },
        select: { id: true, slug: true, name: true },
      }),
      instIds.length > 0
        ? this.prisma.$queryRaw<Array<{ id: string; slug: string; name: string; short_name: string | null; type: string; city: string | null; state_code: string | null; ranking_text: string | null }>>`
            select id::text, slug, name, short_name, type::text as type, city, state_code, ranking_text
            from institutions
            where id in (${Prisma.join(instIds.map((i) => Prisma.sql`${i}::uuid`))})
          `
        : Promise.resolve([]),
    ]);
    const serviceBy = new Map(services.map((s) => [s.id, s]));
    const instBy = new Map((institutions || []).map((i) => [i.id, i]));

    const items = rows.flatMap((r): SavedItem[] => {
      const card = r.item_type === 'opportunity' ? cards.get(r.item_id) : undefined;
      const service = r.item_type === 'service' ? serviceBy.get(r.item_id) : undefined;
      const inst = r.item_type === 'institution' ? instBy.get(r.item_id) : undefined;
      if (!card && !service && !inst) return [];
      return [
        {
          item_type: r.item_type as SavedItemType,
          slug: card?.slug ?? service?.slug ?? inst!.slug,
          saved_at: r.created_at.toISOString(),
          reminder_enabled: r.reminder_enabled,
          card: card ? { ...card, saved: true } : null,
          service: service ? { slug: service.slug, name: service.name } : null,
          institution: inst ? (inst as any) : null,
        },
      ];
    });
    return { total: items.length, items };
  }

  /** PUT /saved/:item_type/:slug — save (or change the reminder switch). Saving twice is fine. */
  @Put(':itemType/:slug')
  async save(
    @Req() req: AuthenticatedRequest,
    @Param('itemType') itemType: string,
    @Param('slug') slug: string,
    @Body(new ZodPipe(saveSchema)) body: z.infer<typeof saveSchema>,
  ): Promise<SaveResult> {
    const key = { user_id: req.user.userId, ...(await this.resolve(itemType, slug)) };
    const row = await this.prisma.saved_items.upsert({
      where: { user_id_item_type_item_id: key },
      create: { ...key, reminder_enabled: body.reminder_enabled ?? true },
      update: body.reminder_enabled === undefined ? {} : { reminder_enabled: body.reminder_enabled },
      select: { reminder_enabled: true },
    });
    return { saved: true, reminder_enabled: row.reminder_enabled };
  }

  @Delete(':itemType/:slug')
  async unsave(
    @Req() req: AuthenticatedRequest,
    @Param('itemType') itemType: string,
    @Param('slug') slug: string,
  ): Promise<SaveResult> {
    const item = await this.resolve(itemType, slug);
    await this.prisma.saved_items.deleteMany({ where: { user_id: req.user.userId, ...item } });
    return { saved: false, reminder_enabled: false };
  }

  private async resolve(itemType: string, slug: string): Promise<{ item_type: SavedItemType; item_id: string }> {
    if (!ITEM_TYPES.includes(itemType as SavedItemType)) {
      throw new BadRequestException(`item_type must be one of: ${ITEM_TYPES.join(', ')}`);
    }
    const where = { slug, status: { in: ['published' as const, 'closed' as const] } };
    let row: { id: string } | null = null;
    if (itemType === 'opportunity') {
      row = await this.prisma.opportunities.findFirst({ where, select: { id: true } });
    } else if (itemType === 'service') {
      row = await this.prisma.gov_services.findFirst({ where, select: { id: true } });
    } else if (itemType === 'institution') {
      const instRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
        select id::text as id from institutions where slug = ${slug} and status in ('published', 'closed') limit 1
      `;
      row = instRows && instRows.length > 0 ? instRows[0] : null;
    }
    if (!row) throw new NotFoundException(`Nothing to save at ${itemType}/${slug}`);
    return { item_type: itemType as SavedItemType, item_id: row.id };
  }
}
