import { Injectable, Logger } from '@nestjs/common';

export interface TranslatableOpportunity {
  title: string;
  summary?: string | null;
  fee_text?: string | null;
  benefits_text?: string | null;
  selection_process?: string[];
}

export interface OpportunityTranslationItem {
  title?: string;
  summary?: string;
  fee_text?: string;
  benefits_text?: string;
  selection_process?: string[];
}

export interface OpportunityTranslations {
  te?: OpportunityTranslationItem;
  hi?: OpportunityTranslationItem;
}

@Injectable()
export class AiTranslationService {
  private readonly logger = new Logger(AiTranslationService.name);

  /**
   * Main entrypoint: Translates an opportunity into Telugu and Hindi.
   * Tries Gemini -> Claude -> OpenAI -> Free Neural Engine (100% Free) -> Fallback Indian Gov Lexicon.
   */
  async translateOpportunity(
    item: TranslatableOpportunity,
  ): Promise<OpportunityTranslations> {
    if (!item.title && !item.summary) {
      return {};
    }

    try {
      // 1. Check for Gemini API key
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        const res = await this.translateWithGemini(item, geminiKey);
        if (res) return res;
      }

      // 2. Check for Anthropic API key
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey) {
        const res = await this.translateWithAnthropic(item, anthropicKey);
        if (res) return res;
      }

      // 3. Check for OpenAI API key
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const res = await this.translateWithOpenAI(item, openaiKey);
        if (res) return res;
      }

      // 4. Free Neural Translation Engine (100% Free, zero config, no API key required)
      const freeRes = await this.translateWithFreeEngine(item);
      if (freeRes) return freeRes;
    } catch (err) {
      this.logger.warn(`AI API translation failed, using domain lexicon fallback: ${err}`);
    }

    // 5. Fallback to specialized Indian Gov Recruitment & Education Lexicon Translator
    return this.translateWithDomainLexicon(item);
  }

  /**
   * 100% Free Neural Translation Engine (MyMemory)
   * No API key, no account, zero cost.
   */
  async translateWithFreeEngine(
    item: TranslatableOpportunity,
  ): Promise<OpportunityTranslations | null> {
    try {
      const [titleTe, titleHi, summaryTe, summaryHi] = await Promise.all([
        item.title ? this.fetchFreeTranslation(item.title, 'te') : Promise.resolve(undefined),
        item.title ? this.fetchFreeTranslation(item.title, 'hi') : Promise.resolve(undefined),
        item.summary ? this.fetchFreeTranslation(item.summary, 'te') : Promise.resolve(undefined),
        item.summary ? this.fetchFreeTranslation(item.summary, 'hi') : Promise.resolve(undefined),
      ]);

      const [feeTe, feeHi, benTe, benHi] = await Promise.all([
        item.fee_text ? this.fetchFreeTranslation(item.fee_text, 'te') : Promise.resolve(undefined),
        item.fee_text ? this.fetchFreeTranslation(item.fee_text, 'hi') : Promise.resolve(undefined),
        item.benefits_text ? this.fetchFreeTranslation(item.benefits_text, 'te') : Promise.resolve(undefined),
        item.benefits_text ? this.fetchFreeTranslation(item.benefits_text, 'hi') : Promise.resolve(undefined),
      ]);

      const stepsTe = item.selection_process
        ? await Promise.all(item.selection_process.map((s) => this.fetchFreeTranslation(s, 'te')))
        : undefined;
      const stepsHi = item.selection_process
        ? await Promise.all(item.selection_process.map((s) => this.fetchFreeTranslation(s, 'hi')))
        : undefined;

      return {
        te: {
          title: titleTe || this.translateString(item.title, 'te'),
          summary: summaryTe || (item.summary ? this.translateString(item.summary, 'te') : undefined),
          fee_text: feeTe || (item.fee_text ? this.translateString(item.fee_text, 'te') : undefined),
          benefits_text: benTe || (item.benefits_text ? this.translateString(item.benefits_text, 'te') : undefined),
          selection_process: stepsTe,
        },
        hi: {
          title: titleHi || this.translateString(item.title, 'hi'),
          summary: summaryHi || (item.summary ? this.translateString(item.summary, 'hi') : undefined),
          fee_text: feeHi || (item.fee_text ? this.translateString(item.fee_text, 'hi') : undefined),
          benefits_text: benHi || (item.benefits_text ? this.translateString(item.benefits_text, 'hi') : undefined),
          selection_process: stepsHi,
        },
      };
    } catch (err) {
      this.logger.warn(`Free neural translation failed: ${err}`);
      return null;
    }
  }

  /**
   * Helper to fetch translation from the free translation endpoint
   */
  private async fetchFreeTranslation(
    text: string,
    targetLang: 'te' | 'hi',
  ): Promise<string> {
    if (!text || text.trim().length === 0) return text;

    try {
      if (text.length > 400) {
        const sentences = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
        const translatedParts = await Promise.all(
          sentences.map((s) => this.fetchSingleFreeChunk(s.trim(), targetLang)),
        );
        return translatedParts.filter(Boolean).join(' ');
      }
      return await this.fetchSingleFreeChunk(text, targetLang);
    } catch {
      return this.translateString(text, targetLang);
    }
  }

  private async fetchSingleFreeChunk(
    chunk: string,
    targetLang: 'te' | 'hi',
  ): Promise<string> {
    if (!chunk || chunk.trim().length === 0) return chunk;

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      chunk,
    )}&langpair=en|${targetLang}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return this.translateString(chunk, targetLang);
    }

    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (
      translated &&
      typeof translated === 'string' &&
      !translated.startsWith('MYMEMORY WARNING')
    ) {
      return translated;
    }
    return this.translateString(chunk, targetLang);
  }

  /**
   * Google Gemini Translation (Gemini 1.5/2.0 Flash)
   */
  private async translateWithGemini(
    item: TranslatableOpportunity,
    apiKey: string,
  ): Promise<OpportunityTranslations | null> {
    const prompt = `You are an expert Indian government notifications and higher education translator.
Translate the following opportunity content accurately into Telugu (te) and Hindi (hi).
Preserve standard acronyms (like SSC, UPSC, CGL, IIT, NEET, GATE) alongside their translations.

Input:
${JSON.stringify(item, null, 2)}

Return ONLY valid JSON matching this exact structure:
{
  "te": {
    "title": "translated title in Telugu",
    "summary": "translated summary in Telugu",
    "fee_text": "translated fee text in Telugu (or null if not provided)",
    "benefits_text": "translated benefits in Telugu (or null)",
    "selection_process": ["step 1 in Telugu", "step 2 in Telugu"]
  },
  "hi": {
    "title": "translated title in Hindi",
    "summary": "translated summary in Hindi",
    "fee_text": "translated fee text in Hindi (or null if not provided)",
    "benefits_text": "translated benefits in Hindi (or null)",
    "selection_process": ["step 1 in Hindi", "step 2 in Hindi"]
  }
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      this.logger.warn(`Gemini returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return JSON.parse(text) as OpportunityTranslations;
    }
    return null;
  }

  /**
   * Anthropic Claude Translation
   */
  private async translateWithAnthropic(
    item: TranslatableOpportunity,
    apiKey: string,
  ): Promise<OpportunityTranslations | null> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        system:
          'You are an Indian government recruitment and education translation expert. Return valid JSON only with keys "te" and "hi".',
        messages: [
          {
            role: 'user',
            content: `Translate to Telugu (te) and Hindi (hi): ${JSON.stringify(item)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.content?.[0]?.text;
    if (content) {
      const cleaned = content.replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(cleaned) as OpportunityTranslations;
    }
    return null;
  }

  /**
   * OpenAI GPT-4o-mini Translation
   */
  private async translateWithOpenAI(
    item: TranslatableOpportunity,
    apiKey: string,
  ): Promise<OpportunityTranslations | null> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an Indian government and education translation expert. Translate into Telugu (te) and Hindi (hi). Output JSON format with te and hi objects.',
          },
          {
            role: 'user',
            content: JSON.stringify(item),
          },
        ],
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as OpportunityTranslations;
    }
    return null;
  }

  /**
   * Domain Lexicon & Rule Fallback
   * Translates official terms, posts, selection steps, and summaries into natural Telugu and Hindi.
   */
  translateWithDomainLexicon(
    item: TranslatableOpportunity,
  ): OpportunityTranslations {
    return {
      te: {
        title: this.translateString(item.title, 'te'),
        summary: item.summary ? this.translateString(item.summary, 'te') : undefined,
        fee_text: item.fee_text ? this.translateString(item.fee_text, 'te') : undefined,
        benefits_text: item.benefits_text ? this.translateString(item.benefits_text, 'te') : undefined,
        selection_process: item.selection_process?.map((s) => this.translateString(s, 'te')),
      },
      hi: {
        title: this.translateString(item.title, 'hi'),
        summary: item.summary ? this.translateString(item.summary, 'hi') : undefined,
        fee_text: item.fee_text ? this.translateString(item.fee_text, 'hi') : undefined,
        benefits_text: item.benefits_text ? this.translateString(item.benefits_text, 'hi') : undefined,
        selection_process: item.selection_process?.map((s) => this.translateString(s, 'hi')),
      },
    };
  }

  private translateString(str: string, lang: 'te' | 'hi'): string {
    if (!str) return str;
    let result = str;

    const DICTIONARY: Record<string, { te: string; hi: string }> = {
      // Organizations & Commissions
      'Staff Selection Commission': { te: 'స్టాఫ్ సెలక్షన్ కమిషన్ (SSC)', hi: 'कर्मचारी चयन आयोग (SSC)' },
      'Union Public Service Commission': { te: 'యూనియన్ పబ్లిక్ సర్వీస్ కమిషన్ (UPSC)', hi: 'संघ लोक सेवा आयोग (UPSC)' },
      'Railway Recruitment Board': { te: 'రైల్వే రిక్రూట్‌మెంట్ బోర్డు (RRB)', hi: 'रेलवे भर्ती बोर्ड (RRB)' },
      'Institute of Banking Personnel Selection': { te: 'ఇన్‌స్టిట్యూట్ ఆఫ్ బ్యాంకింగ్ పర్సనల్ సెలక్షన్ (IBPS)', hi: 'बैंकिंग कार्मिक चयन संस्थान (IBPS)' },
      'State Bank of India': { te: 'స్టేట్ బ్యాంక్ ఆఫ్ ఇండియా (SBI)', hi: 'भारतीय स्टेट बैंक (SBI)' },
      'Reserve Bank of India': { te: 'రిజర్వ్ బ్యాంక్ ఆఫ్ ఇండియా (RBI)', hi: 'भारतीय रिज़र्व बैंक (RBI)' },
      'Life Insurance Corporation': { te: 'లైఫ్ ఇన్సూరెన్స్ కార్పొరేషన్ (LIC)', hi: 'भारतीय जीवन बीमा निगम (LIC)' },
      'National Testing Agency': { te: 'నేషనల్ టెస్టింగ్ ఏజెన్సీ (NTA)', hi: 'राष्ट्रीय परीक्षा एजेंसी (NTA)' },

      // Exams & Schemes
      'Combined Graduate Level Examination': { te: 'కంబైన్డ్ గ్రాడ్యుయేట్ లెవల్ పరీక్ష (CGL)', hi: 'संयुक्त स्नातक स्तर परीक्षा (CGL)' },
      'Combined Graduate Level': { te: 'కంబైన్డ్ గ్రాడ్యుయేట్ లెవల్ (CGL)', hi: 'संयुक्त स्नातक स्तर (CGL)' },
      'Combined Higher Secondary Level': { te: 'కంబైన్డ్ హయ్యర్ సెకండరీ లెవల్ (CHSL)', hi: 'संयुक्त उच्चतर माध्यमिक स्तर (CHSL)' },
      'Civil Services Examination': { te: 'సివిల్ సర్వీసెస్ పరీక్ష (CSE)', hi: 'सिविल सेवा परीक्षा (CSE)' },
      'National Eligibility cum Entrance Test': { te: 'నీట్ ప్రవేశ పరీక్ష (NEET)', hi: 'नीट प्रवेश परीक्षा (NEET)' },
      'Common University Entrance Test': { te: 'సీయూఈటీ ప్రవేశ పరీక్ష (CUET)', hi: 'कॉमन यूनिवर्सिटी एंट्रेंस टेस्ट (CUET)' },
      'Multi Tasking Staff': { te: 'మల్టీ టాస్కింగ్ స్టాఫ్ (MTS)', hi: 'मल्टी टास्किंग स्टाफ (MTS)' },

      // Posts & Roles
      'Assistant Section Officer': { te: 'అసిస్టెంట్ సెక్షన్ ఆఫీసర్', hi: 'सहायक अनुभाग अधिकारी' },
      'Sub Inspector': { te: 'సబ్-ఇన్‌స్పెక్టర్', hi: 'उप-निरीक्षक' },
      'Sub-Inspector': { te: 'సబ్-ఇన్‌స్పెక్టర్', hi: 'उप-निरीक्षक' },
      'Inspector of Income Tax': { te: 'ఇన్‌కమ్ టాక్స్ ఇన్‌స్పెక్టర్', hi: 'आयकर निरीक्षक' },
      'Tax Assistant': { te: 'టాక్స్ అసిస్టెంట్', hi: 'कर सहायक' },
      'Probationary Officer': { te: 'ప్రొబేషనరీ ఆఫీసర్ (PO)', hi: 'परिवीक्षाधीन अधिकारी (PO)' },
      'Constable': { te: 'కానిస్టేబుల్', hi: 'कांस्टेबल' },
      'Head Constable': { te: 'హెడ్ కానిస్టేబుల్', hi: 'हेड कांस्टेबल' },
      'Junior Engineer': { te: 'జూనియర్ ఇంజనీర్ (JE)', hi: 'कनिष्ठ अभियंता (JE)' },

      // Keywords & Selection Process
      'Recruitment': { te: 'నియామకం', hi: 'भर्ती' },
      'Examination': { te: 'పరీక్ష', hi: 'परीक्षा' },
      'Notification': { te: 'నోటిఫికేషన్', hi: 'अधिसूचना' },
      'vacancies': { te: 'ఖాళీలు', hi: 'रिक्तियां' },
      'Vacancies': { te: 'ఖాళీలు', hi: 'रिक्तियां' },
      'Tier-I (Computer Based Examination)': { te: 'టైర్-1 (కంప్యూటర్ ఆధారిత పరీక్ష)', hi: 'टियर-1 (कंप्यूटर आधारित परीक्षा)' },
      'Tier-II (Computer Based Examination)': { te: 'టైర్-2 (కంప్యూటర్ ఆధారిత పరీక్ష)', hi: 'टियर-2 (कंप्यूटर आधारित परीक्षा)' },
      'Computer Based Examination': { te: 'కంప్యూటర్ ఆధారిత పరీక్ష', hi: 'कंप्यूटर आधारित परीक्षा' },
      'Written Examination': { te: 'రాత పరీక్ష', hi: 'लिखित परीक्षा' },
      'Physical Standard Test': { te: 'శారీరక ప్రమాణాల పరీక్ష (PST)', hi: 'शारीरिक मानक परीक्षण (PST)' },
      'Physical Efficiency Test': { te: 'శారీరక సామర్థ్య పరీక్ష (PET)', hi: 'शारीरिक दक्षता परीक्षण (PET)' },
      'Document Verification': { te: 'పత్రాల ధృవీకరణ', hi: 'दस्तावेज़ सत्यापन' },
      'Medical Examination': { te: 'వైద్య పరీక్ష', hi: 'चिकित्सा परीक्षण' },
      'Interview': { te: 'ఇంటర్వ్యూ', hi: 'साक्षात्कार' },
      'Skill Test / Typing Test': { te: 'స్కిల్ టెస్ట్ / టైపింగ్ పరీక్ష', hi: 'कौशल परीक्षा / टाइपिंग टेस्ट' },
      'Age limit': { te: 'వయోపరిమితి', hi: 'आयु सीमा' },
      'Application fee': { te: 'దరఖాస్తు రుసుము', hi: 'आवेदन शुल्क' },
      'Free for SC, ST, Women, PwBD candidates': { te: 'SC, ST, మహిళలు మరియు PwBD అభ్యర్థులకు ఉచితం', hi: 'SC, ST, महिला और PwBD उम्मीदवारों के लिए निःशुल्क' },
      'No application fee required': { te: 'దరఖాస్తు రుసుము లేదు', hi: 'कोई आवेदन शुल्क आवश्यक नहीं है' },
      'Official recruitment for': { te: 'అధికారిక నియామక ప్రక్రియ:', hi: 'के लिए आधिकारिक भर्ती:' },
    };

    // Replace known dictionary entries
    for (const [en, trans] of Object.entries(DICTIONARY)) {
      if (result.includes(en)) {
        result = result.replaceAll(en, trans[lang]);
      }
    }

    return result;
  }
}
