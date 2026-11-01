import { z } from 'zod';

export const chatbotQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  opportunity_slug: z.string().optional(),
  opportunity_id: z.string().uuid().optional(),
  page_type: z.enum(['apply', 'career', 'general']).optional(),
  qualification: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      }),
    )
    .optional(),
});

export type ChatbotQueryDto = z.infer<typeof chatbotQuerySchema>;

