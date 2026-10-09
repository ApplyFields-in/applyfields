import { Injectable } from '@nestjs/common';
import type {
  AskGuidanceDto,
  AskGuidanceResponse,
  GuidanceConversation,
  GuidanceMessage,
  GuidanceSource,
} from '@applyfields/types';
import { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export const askGuidanceDtoSchema = z.object({
  question: z.string().trim().min(2),
  conversation_id: z.string().uuid().optional(),
  student_stage: z.string().trim().optional(),
});

@Injectable()
export class GuidanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search for grounded ApplyFields context based on user query
   */
  async retrieveContext(question: string): Promise<GuidanceSource[]> {
    const words = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (words.length === 0) {
      return [];
    }

    // Search search_index for top matching published resources
    const matches = await this.prisma.$queryRaw<
      Array<{
        title: string;
        url_path: string;
        item_type: string;
      }>
    >`
      select title, url_path, item_type::text
      from search_index
      where ${Prisma.join(
        words.map((w) => Prisma.sql`search_vector @@ plainto_tsquery('english', ${w})`),
        ' or ',
      )}
      limit 6
    `;

    return matches.map((m) => ({
      title: m.title,
      url: m.url_path,
      type: m.item_type,
    }));
  }

  /**
   * Answer a student's career question grounded in ApplyFields data
   */
  async askGuidance(
    dto: AskGuidanceDto,
    userId?: string,
  ): Promise<AskGuidanceResponse> {
    const question = dto.question.trim();
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    // 1. Retrieve grounded internal ApplyFields sources
    const sources = await this.retrieveContext(question);

    let conversationId = dto.conversation_id;

    // Create conversation if user is logged in and conversation_id not provided
    if (userId && !conversationId) {
      const convRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
        insert into guidance_conversations (user_id, title)
        values (${userId}::uuid, ${question.slice(0, 60)})
        returning id::text
      `;
      conversationId = convRows[0]?.id;
    }

    let answer: string;
    let isFallback = false;

    // 2. Call Anthropic Claude API if API key is present
    if (apiKey) {
      try {
        const systemPrompt = `You are the ApplyFields AI Career Guide, an empathetic, highly knowledgeable educational advisor for students in India.
CRITICAL RULES:
1. Base all guidance strictly on real, factual educational trajectories and official eligibility criteria in India. Never invent admission deadlines, examination dates, or fees.
2. Ground your advice in the following ApplyFields resources matching the student's inquiry:
${JSON.stringify(sources, null, 2)}
3. Where relevant, naturally reference and hyperlink ApplyFields pages using markdown: [Page Title](url).
4. Provide structured, reassuring, step-by-step guidance formatted with bold headings and bullet points.`;

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: question }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          answer = data.content?.[0]?.text || '';
        } else {
          console.warn('[GuidanceService] Anthropic API returned status:', res.status);
          answer = this.generateGroundedResponse(question, sources);
          isFallback = true;
        }
      } catch (err: any) {
        console.warn('[GuidanceService] Anthropic API call failed, using grounded fallback:', err.message);
        answer = this.generateGroundedResponse(question, sources);
        isFallback = true;
      }
    } else {
      // API Key not set: use intelligent grounded rule-based guidance engine
      answer = this.generateGroundedResponse(question, sources);
      isFallback = true;
    }

    // 3. Save messages if conversation exists
    if (conversationId) {
      try {
        await this.prisma.$executeRaw`
          insert into guidance_messages (conversation_id, role, content, sources)
          values
            (${conversationId}::uuid, 'user'::message_role, ${question}, '[]'::jsonb),
            (${conversationId}::uuid, 'assistant'::message_role, ${answer}, ${JSON.stringify(sources)}::jsonb)
        `;
      } catch (err) {
        console.error('[GuidanceService] Error saving guidance messages:', err);
      }
    }

    return {
      conversation_id: conversationId || 'guest-session',
      answer,
      sources,
      is_fallback: isFallback,
    };
  }

  /**
   * High-quality grounded fallback synthesizer when ANTHROPIC_API_KEY is not configured
   */
  private generateGroundedResponse(
    question: string,
    sources: GuidanceSource[],
  ): string {
    const q = question.toLowerCase();

    let text = `### Personalized Career Guidance\n\n`;

    if (q.includes('pcb') || q.includes('neet') || q.includes('biology')) {
      text += `If you completed **12th PCB** and prefer pathways outside or alongside MBBS/NEET, you have several high-potential career tracks in healthcare, life sciences, and regulatory biotechnology:\n\n`;
      text += `1. **Biotechnology & Bioinformatics**: Pursue degrees like [B.Tech / B.Sc Biotechnology](/career/courses/btech-cse) focusing on genetic research, pharmaceuticals, and diagnostics.\n`;
      text += `2. **Allied Healthcare & Medicine**: Specialisations in Clinical Diagnostics, Radiology, or Hospital Administration.\n`;
      text += `3. **Pharmacy & Drug Formulation**: B.Pharm degrees leading to clinical research associate roles in top pharma companies.\n\n`;
    } else if (q.includes('software') || q.includes('coding') || q.includes('tech') || q.includes('developer')) {
      text += `To build a high-velocity career as a **Software Development Engineer**, follow this milestone trajectory:\n\n`;
      text += `1. **Academic Foundation**: Complete [B.Tech in Computer Science & Engineering](/career/courses/btech-cse) or BCA, focusing on Data Structures, Algorithms, and DBMS.\n`;
      text += `2. **Hands-on Roadmaps**: Follow the step-by-step milestones in the [Software Engineer Milestone Roadmap](/career/roadmaps/software-engineer-roadmap).\n`;
      text += `3. **Practical Projects**: Ship fullstack applications, contribute to open-source, and solve standard DSA problems.\n\n`;
    } else if (q.includes('ias') || q.includes('upsc') || q.includes('civil')) {
      text += `For **UPSC Civil Services (IAS/IPS)**:\n\n`;
      text += `1. **Eligibility**: Graduation in any discipline from a recognised university.\n`;
      text += `2. **Roadmap**: Start with NCERT foundations and follow the [UPSC Civil Services (IAS) Roadmap](/career/roadmaps/ias-civil-services-roadmap).\n`;
      text += `3. **Next Steps**: Focus on general studies, daily current affairs, and answer writing.\n\n`;
    } else {
      text += `Based on your query, here is how you can evaluate your career direction:\n\n`;
      text += `1. **Clarify Eligibility**: Check the required qualifying subjects and entrance exams for your target discipline.\n`;
      text += `2. **Compare Options**: Review verified curriculum and fee structures across accredited institutions.\n`;
      text += `3. **Step-by-Step Milestones**: Save the relevant career roadmap to track your progress.\n\n`;
    }

    if (sources.length > 0) {
      text += `#### Verified ApplyFields Resources:\n`;
      for (const s of sources) {
        text += `- **[${s.title}](${s.url})** (${s.type})\n`;
      }
    } else {
      text += `Explore our full directory of [Careers](/career), [Roadmaps](/career/roadmaps), [Courses](/career/courses), and [Colleges](/career/colleges).\n`;
    }

    return text;
  }

  /**
   * Get user guidance history
   */
  async getHistory(userId: string): Promise<GuidanceConversation[]> {
    const convs = await this.prisma.$queryRaw<
      Array<{ id: string; title: string | null; updated_at: string }>
    >`
      select id::text, title, updated_at::text
      from guidance_conversations
      where user_id = ${userId}::uuid
      order by updated_at desc
      limit 10
    `;

    const result: GuidanceConversation[] = [];

    for (const c of convs) {
      const msgs = await this.prisma.$queryRaw<
        Array<{
          id: string;
          role: string;
          content: string;
          sources: any;
          created_at: string;
        }>
      >`
        select id::text, role::text, content, sources, created_at::text
        from guidance_messages
        where conversation_id = ${c.id}::uuid
        order by created_at asc
      `;

      result.push({
        id: c.id,
        title: c.title,
        updated_at: c.updated_at,
        messages: msgs.map((m) => ({
          id: m.id,
          role: m.role as any,
          content: m.content,
          sources: Array.isArray(m.sources) ? m.sources : [],
          created_at: m.created_at,
        })),
      });
    }

    return result;
  }
}
