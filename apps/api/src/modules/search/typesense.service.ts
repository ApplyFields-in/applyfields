import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { SearchResult } from '@applyfields/types';
import Typesense from 'typesense';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { locationLabel, todayIst } from '../opportunities/opportunities.service.js';
import type { SearchQuery } from './search.service.js';

export const TYPESENSE_COLLECTION = 'applyfields_search';

export interface TypesenseDocument {
  id: string;
  item_type: string;
  item_id: string;
  title: string;
  subtitle: string;
  keywords: string;
  state_codes: string[];
  url_path: string;
  deadline?: string;
  deadline_epoch?: number;
}

@Injectable()
export class TypesenseService implements OnModuleInit {
  private readonly logger = new Logger(TypesenseService.name);
  private client: Typesense.Client | null = null;
  private isConnected = false;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.TYPESENSE_API_KEY;
    const host = process.env.TYPESENSE_HOST || 'localhost';
    const port = Number(process.env.TYPESENSE_PORT || '8108');
    const protocol = (process.env.TYPESENSE_PROTOCOL || 'http') as 'http' | 'https';

    if (apiKey) {
      try {
        this.client = new Typesense.Client({
          nodes: [{ host, port, protocol }],
          apiKey,
          connectionTimeoutSeconds: 2,
        });
      } catch (err) {
        this.logger.warn(`Failed to instantiate Typesense client: ${(err as Error).message}`);
      }
    }
  }

  async onModuleInit() {
    if (!this.client) return;
    try {
      const health = await this.client.health.retrieve();
      this.isConnected = health.ok;
      if (this.isConnected) {
        this.logger.log('Typesense connected successfully.');
        await this.ensureCollection();
      }
    } catch {
      this.isConnected = false;
      this.logger.debug('Typesense server not reachable. Using PostgreSQL search engine.');
    }
  }

  get available(): boolean {
    return Boolean(this.client && this.isConnected);
  }

  async ensureCollection(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.collections(TYPESENSE_COLLECTION).retrieve();
      return true;
    } catch {
      // Collection does not exist, create it
      try {
        await this.client.collections().create({
          name: TYPESENSE_COLLECTION,
          fields: [
            { name: 'id', type: 'string' },
            { name: 'item_type', type: 'string', facet: true },
            { name: 'item_id', type: 'string' },
            { name: 'title', type: 'string' },
            { name: 'subtitle', type: 'string', optional: true },
            { name: 'keywords', type: 'string', optional: true },
            { name: 'state_codes', type: 'string[]', facet: true },
            { name: 'url_path', type: 'string' },
            { name: 'deadline', type: 'string', optional: true },
            { name: 'deadline_epoch', type: 'int64', optional: true },
          ],
        });
        this.logger.log(`Created Typesense collection "${TYPESENSE_COLLECTION}".`);
        return true;
      } catch (createErr) {
        this.logger.warn(`Failed to create Typesense collection: ${(createErr as Error).message}`);
        return false;
      }
    }
  }

  /**
   * Syncs published records from PostgreSQL search_index into Typesense.
   */
  async syncFromPostgres(): Promise<{ synced: number; error?: string }> {
    if (!this.client || !this.isConnected) {
      return { synced: 0, error: 'Typesense is not connected' };
    }

    try {
      await this.ensureCollection();

      const rows = await this.prisma.$queryRaw<
        Array<{
          id: string;
          item_type: string;
          item_id: string;
          title: string;
          subtitle: string | null;
          keywords: string | null;
          state_codes: string[];
          url_path: string;
          deadline: string | null;
        }>
      >`
        select s.id::text, coalesce(o.type::text, s.item_type::text) as item_type,
               s.item_id::text, s.title, s.subtitle, s.keywords, s.state_codes,
               s.url_path, s.deadline::text as deadline
        from search_index s
        left join opportunities o on s.item_type = 'opportunity' and o.id = s.item_id
      `;

      if (rows.length === 0) return { synced: 0 };

      const documents: TypesenseDocument[] = rows.map((r) => {
        const epoch = r.deadline ? Math.floor(new Date(r.deadline).getTime() / 1000) : undefined;
        return {
          id: r.id,
          item_type: r.item_type,
          item_id: r.item_id,
          title: r.title,
          subtitle: r.subtitle || '',
          keywords: r.keywords || '',
          state_codes: r.state_codes || ['ALL'],
          url_path: r.url_path,
          deadline: r.deadline || undefined,
          deadline_epoch: epoch,
        };
      });

      await this.client.collections(TYPESENSE_COLLECTION).documents().import(documents, { action: 'upsert' });
      return { synced: documents.length };
    } catch (err) {
      this.logger.error(`Error syncing to Typesense: ${(err as Error).message}`);
      return { synced: 0, error: (err as Error).message };
    }
  }

  /**
   * Performs sub-10ms typo-tolerant search using Typesense.
   */
  async search(f: SearchQuery): Promise<SearchResult[] | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const today = todayIst().toISOString().slice(0, 10);
      const todayEpoch = Math.floor(new Date(today).getTime() / 1000);

      const filterParts: string[] = [];

      // Filter out past deadlines
      filterParts.push(`deadline_epoch:>=${todayEpoch} || deadline_epoch:0`);

      if (f.type) {
        filterParts.push(`item_type:=${f.type}`);
      }

      if (f.state) {
        filterParts.push(`state_codes:[${f.state}, ALL]`);
      }

      const searchParameters: any = {
        q: f.q || '*',
        query_by: 'title,subtitle,keywords',
        query_by_weights: '3,2,1',
        num_typos: 2,
        prefix: true,
        per_page: f.limit || 20,
      };

      if (filterParts.length > 0) {
        searchParameters.filter_by = filterParts.join(' && ');
      }

      if (f.sort === 'deadline') {
        searchParameters.sort_by = 'deadline_epoch:asc';
      }

      const res = await this.client.collections(TYPESENSE_COLLECTION).documents().search(searchParameters);

      const hits = (res.hits || []) as Array<{ document: TypesenseDocument }>;
      const todayDate = new Date(today);

      return hits.map((hit) => {
        const doc = hit.document;
        let daysLeft: number | null = null;
        if (doc.deadline) {
          const deadlineDate = new Date(doc.deadline);
          daysLeft = Math.round((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          type: doc.item_type as any,
          title: doc.title,
          subtitle: doc.subtitle || null,
          url: doc.url_path,
          location: locationLabel(doc.state_codes || ['ALL']),
          last_date: doc.deadline || null,
          days_left: daysLeft,
        };
      });
    } catch (err) {
      this.logger.warn(`Typesense search error, falling back to Postgres: ${(err as Error).message}`);
      return null;
    }
  }
}
