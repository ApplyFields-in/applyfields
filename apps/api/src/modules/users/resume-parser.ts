import { execFile } from 'node:child_process';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import type {
  EducationLevel,
  EducationStatus,
  ExtractedEducationItem,
  ExtractedResumeProfile,
  ScoreType,
  UserGender,
} from '@applyfields/types';

const execFileAsync = promisify(execFile);

function findTesseractBinary(): string | null {
  if (process.env.TESSERACT_PATH && existsSync(process.env.TESSERACT_PATH)) {
    return process.env.TESSERACT_PATH;
  }
  const defaultWin = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
  if (existsSync(defaultWin)) return defaultWin;
  return null;
}

/**
 * Runs OCR on an image buffer using local Tesseract engine.
 */
async function runOcrOnImageBuffer(
  imageBuffer: Buffer,
  ext = 'jpg',
): Promise<string> {
  const tesseract = findTesseractBinary();
  if (!tesseract) {
    console.warn('[ResumeParser] Tesseract OCR binary not found on host.');
    return '';
  }

  const tempFile = path.join(
    os.tmpdir(),
    `resume_ocr_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
  );
  try {
    writeFileSync(tempFile, imageBuffer);
    const { stdout } = await execFileAsync(tesseract, [tempFile, 'stdout'], {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout || '';
  } catch (err: any) {
    console.warn('[ResumeParser] OCR failed on image chunk:', err.message);
    return '';
  } finally {
    try {
      if (existsSync(tempFile)) unlinkSync(tempFile);
    } catch {}
  }
}

/** Reads word/document.xml out of a .docx (a zip) with the central directory; no zip library needed. */
function extractTextFromDocx(buf: Buffer): string {
  try {
    const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (eocd < 0) return '';
    const count = buf.readUInt16LE(eocd + 10);
    let p = buf.readUInt32LE(eocd + 16);
    for (let i = 0; i < count && buf.readUInt32LE(p) === 0x02014b50; i++) {
      const method = buf.readUInt16LE(p + 10);
      const size = buf.readUInt32LE(p + 20);
      const nameLen = buf.readUInt16LE(p + 28);
      const skip = nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
      const local = buf.readUInt32LE(p + 42);
      if (buf.toString('utf8', p + 46, p + 46 + nameLen) === 'word/document.xml') {
        const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
        const data = buf.subarray(start, start + size);
        // maxOutputLength guards against zip bombs
        const xml = (method === 8 ? zlib.inflateRawSync(data, { maxOutputLength: 20 * 1024 * 1024 }) : data).toString('utf8');
        return xml
          .replace(/<\/w:p>/g, '\n')
          .replace(/<w:(?:tab|br)\/>/g, ' ')
          .replace(/<[^>]+>/g, '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, '&');
      }
      p += 46 + skip;
    }
  } catch {
    // corrupt or not a zip
  }
  return '';
}

/**
 * Extracts embedded JPEG images from PDF byte streams.
 */
function extractEmbeddedJpegsFromPdf(pdfBuffer: Buffer): Buffer[] {
  const images: Buffer[] = [];
  let pos = 0;
  while (pos < pdfBuffer.length) {
    const start = pdfBuffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]), pos);
    if (start === -1) break;
    const end = pdfBuffer.indexOf(Buffer.from([0xff, 0xd9]), start);
    if (end === -1) break;

    const jpg = pdfBuffer.subarray(start, end + 2);
    // Ignore small thumbnails under 15KB
    if (jpg.length > 15000) {
      images.push(jpg);
    }
    pos = end + 2;
  }
  return images;
}

/**
 * High-fidelity resume text extractor supporting text documents, digital PDFs, and scanned/image PDFs.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. Plain text formats
  if (
    mimeType.includes('text') ||
    ext === 'txt' ||
    ext === 'md' ||
    ext === 'text'
  ) {
    return buffer.toString('utf-8');
  }

  // 2. Direct image formats
  if (
    mimeType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(ext)
  ) {
    return await runOcrOnImageBuffer(buffer, ext);
  }

  // 3. Word documents
  if (mimeType.includes('wordprocessingml') || ext === 'docx') {
    return extractTextFromDocx(buffer);
  }

  // 4. PDF formats
  if (mimeType.includes('pdf') || ext === 'pdf') {
    // Digital PDFs: pdf.js keeps line breaks, which the section parsers rely on
    let digitalText = '';
    try {
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      digitalText = (await extractText(pdf, { mergePages: true })).text;
    } catch (err: any) {
      console.warn('[ResumeParser] PDF text extraction failed:', err.message);
    }
    const wordCount = digitalText.split(/\s+/).filter(Boolean).length;

    // If PDF has ample digital text (>= 60 words), use it
    if (wordCount >= 60) {
      return digitalText;
    }

    // Scanned / Image PDF: Extract embedded JPEG images and run OCR
    const embeddedImages = extractEmbeddedJpegsFromPdf(buffer);
    if (embeddedImages.length > 0) {
      let ocrCombinedText = '';
      for (const imgBuf of embeddedImages) {
        const text = await runOcrOnImageBuffer(imgBuf, 'jpg');
        ocrCombinedText += '\n' + text;
      }
      if (ocrCombinedText.trim().length > 30) {
        return ocrCombinedText.trim();
      }
    }

    // Fallback: return any partial digital text
    return digitalText;
  }

  return '';
}

/**
 * High-precision segmented resume qualifications parser.
 */
export function extractEducationFromResume(
  text: string,
): ExtractedEducationItem[] {
  if (!text || text.trim().length === 0) return [];

  const currentYear = new Date().getFullYear();

  // 1. Isolate the education section if explicit headers exist
  let eduSection = text;
  const eduMatch = text.match(
    /(?:EDUCATION|ACADEMIC BACKGROUND|EDUCATIONAL QUALIFICATIONS)([\s\S]*?)(?:EXPERIENCE|PROJECTS|TECHNICAL SKILLS|SKILLS|CERTIFICATIONS|LEADERSHIP & ACTIVITIES|LEADERSHIP|$)/i,
  );
  if (eduMatch && eduMatch[1].trim().length > 30) {
    eduSection = eduMatch[1];
  }

  const lines = eduSection
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 2. Milestone section segmenter
  function detectMilestone(line: string): EducationLevel | null {
    if (/\b(?:Ph\.?D|Doctorate|Doctor of Philosophy)\b/i.test(line)) {
      return 'phd';
    }
    // Strict PG: Avoid bare "MS" or "BA" from words like DBMS or Basic
    if (
      /\b(?:M\.?Tech|MBA|MCA|M\.?Sc|M\.?Com|Master of [A-Za-z\s]+|M\.?S\.?\s+(?:in|from|degree))\b/i.test(
        line,
      )
    ) {
      return 'post_graduate';
    }
    if (
      /\b(?:College|University|Campus|Institute of Technology)\b/i.test(line) ||
      /\b(?:B\.?Tech|B\.?E\.?|B\.?Sc|B\.?Com|BCA|BBA|B\.?Pharm|MBBS|Bachelor of [A-Za-z\s]+)\b/i.test(
        line,
      )
    ) {
      return 'graduate';
    }
    if (
      /Board of Intermediate|Intermediate|Class XII|Class 12th|\b12th\b|Junior College|\+2\b|HSC\b|PUC\b/i.test(
        line,
      )
    ) {
      return '12th';
    }
    if (
      /SSC|Class X|Class 10th|\b10th\b|Matriculation|Secondary School Certificate|High School/i.test(
        line,
      )
    ) {
      return '10th';
    }
    return null;
  }

  interface SectionBlock {
    level: EducationLevel;
    lines: string[];
  }

  const sections: SectionBlock[] = [];
  let currentSec: SectionBlock | null = null;

  for (const line of lines) {
    const detected = detectMilestone(line);
    if (detected && (!currentSec || currentSec.level !== detected)) {
      if (currentSec) sections.push(currentSec);
      currentSec = { level: detected, lines: [line] };
    } else if (currentSec) {
      currentSec.lines.push(line);
    }
  }
  if (currentSec) sections.push(currentSec);

  const results: ExtractedEducationItem[] = [];

  for (const sec of sections) {
    const chunkText = sec.lines.join('\n');
    let degree = '';
    const level = sec.level;

    if (level === 'phd') {
      degree = 'Ph.D / Doctorate';
    } else if (level === 'post_graduate') {
      const match = chunkText.match(
        /\b(?:M\.?Tech|MBA|MCA|M\.?Sc|M\.?Com|Master of [A-Za-z\s]+|M\.?S\.?)\b/i,
      );
      degree = match ? match[0].replace(/\./g, '').toUpperCase() : '';
    } else if (level === 'graduate') {
      const btech = chunkText.match(
        /\b(?:B\.?Tech|B\.?E\.?|B\.?Sc|B\.?Com|BCA|BBA|B\.?Pharm|MBBS)\b/i,
      );
      if (btech) {
        const clean = btech[0].toLowerCase().replace(/[^a-z]/g, '');
        degree =
          clean === 'btech'
            ? 'B.Tech'
            : clean === 'be'
              ? 'B.E.'
              : btech[0].replace(/\./g, '').toUpperCase();
      }
    } else if (level === '12th') {
      degree = 'Intermediate / Class XII';
    } else if (level === '10th') {
      degree = 'Class 10th (SSC)';
    }

    // Score parsing
    let score: number | null = null;
    let scoreType: ScoreType = 'percentage';
    const percentMatch = chunkText.match(
      /\b([4-9]\d(?:\.\d{1,2})?|100(?:\.0)?)\s*%/,
    );
    if (percentMatch) {
      score = parseFloat(percentMatch[1]);
      scoreType = 'percentage';
    } else {
      const cgpaMatch = chunkText.match(
        /\b([4-9](?:\.\d{1,2})?|10(?:\.0)?)\s*(?:\/\s*10|CGPA|GPA|\/10.0)\b/i,
      );
      if (cgpaMatch) {
        score = parseFloat(cgpaMatch[1]);
        scoreType = 'cgpa';
      }
    }

    // Passing year and pursuing status
    let year: number | null = null;
    const yearMatches = chunkText.match(/\b(19\d{2}|20\d{2})\b/g);
    if (yearMatches) {
      const valid = yearMatches
        .map((y) => parseInt(y, 10))
        .filter((y) => y >= 1970 && y <= 2035);
      if (valid.length > 0) year = Math.max(...valid);
    }

    const isPursuing =
      /expected|pursuing|currently|ongoing/i.test(chunkText) ||
      (year != null && year > currentYear);
    const status: EducationStatus = isPursuing ? 'pursuing' : 'completed';

    // Stream detection
    let stream = '';
    const streamKeywords = [
      'Information Technology',
      'Computer Science & Engineering',
      'Computer Science and Engineering',
      'Computer Science',
      'Artificial Intelligence',
      'Data Science',
      'Electronics and Communication',
      'Electrical and Electronics',
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'MPC',
      'BiPC',
      'Commerce',
      'General',
    ];
    for (const kw of streamKeywords) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(chunkText)) {
        stream = kw;
        break;
      }
    }

    // Institution and board: only text that is actually in the resume, never a guessed default.
    // Lines without scores/years/degree words are the name lines; a wrapped name joins back up.
    const nameText = sec.lines
      .filter(
        (l) =>
          !/%|CGPA|GPA|\b(?:19|20)\d{2}\b|Graduation|Expected|B\.?Tech|M\.?Tech|\bB\.?E\b|B\.?Sc|M\.?Sc|B\.?Com|M\.?Com|\bBCA\b|\bMCA\b|\bBBA\b|\bMBA\b|Bachelor|Master/i.test(l),
      )
      .map((l) => l.replace(/^(?:[^\p{L}\p{N}]+|[oO°]\s+)+/u, '').trim())
      .filter(Boolean)
      .join(' ');
    let institution = '';
    let board = '';
    const isSchool = level === '10th' || level === '12th';
    if (isSchool && /\b(?:Board|CBSE|ICSE|SSC|Secondary Education)\b/i.test(nameText)) {
      board = nameText;
    } else if (/College|University|Institute|School|Vidyalaya|Academy|Campus|JNTU/i.test(nameText)) {
      institution = nameText;
    }
    if (!isSchool) {
      const uni = nameText.match(/\b(?:[A-Z][\w.]*\s+)*University(?:\s+of\s+[A-Z]\w*)?|\bJNTU\w*\b/);
      if (uni) board = uni[0].trim();
    }

    // Confidence = share of the four key fields actually found
    const found = [degree, institution || board, year, score].filter((v) => v !== '' && v != null).length;

    results.push({
      level,
      degree,
      stream,
      board_or_university: board,
      institution_name: institution,
      year_of_passing: year,
      score,
      score_type: scoreType,
      status,
      confidence: Math.round((0.4 + 0.15 * found) * 100) / 100,
    });
  }

  // Deduplicate by level
  const uniqueMap = new Map<EducationLevel, ExtractedEducationItem>();
  for (const item of results) {
    if (!uniqueMap.has(item.level)) {
      uniqueMap.set(item.level, item);
    }
  }

  const order: Record<EducationLevel, number> = {
    '10th': 1,
    '12th': 2,
    iti: 3,
    diploma: 4,
    graduate: 5,
    post_graduate: 6,
    phd: 7,
  };

  return Array.from(uniqueMap.values()).sort(
    (a, b) => order[a.level] - order[b.level],
  );
}

// ---------------------------------------------------------------------------------------------
// Profile fields (name, DOB, gender, address, skills, languages). Everything is read from the
// resume text; a field that isn't there comes back null/empty, never guessed. The citizen reviews
// every value before it is saved.
// ---------------------------------------------------------------------------------------------

/** Codes match the web profile's INDIAN_STATES list (TS = Telangana, OD = Odisha). */
const STATE_CODES: Record<string, string> = {
  'andhra pradesh': 'AP', 'arunachal pradesh': 'AR', assam: 'AS', bihar: 'BR', chhattisgarh: 'CG',
  goa: 'GA', gujarat: 'GJ', haryana: 'HR', 'himachal pradesh': 'HP', jharkhand: 'JH',
  karnataka: 'KA', kerala: 'KL', 'madhya pradesh': 'MP', maharashtra: 'MH', manipur: 'MN',
  meghalaya: 'ML', mizoram: 'MZ', nagaland: 'NL', odisha: 'OD', orissa: 'OD', punjab: 'PB',
  rajasthan: 'RJ', sikkim: 'SK', 'tamil nadu': 'TN', telangana: 'TS', tripura: 'TR',
  'uttar pradesh': 'UP', uttarakhand: 'UK', 'west bengal': 'WB', 'andaman and nicobar': 'AN',
  chandigarh: 'CH', delhi: 'DL', 'new delhi': 'DL', 'jammu and kashmir': 'JK', 'jammu & kashmir': 'JK',
  ladakh: 'LA', lakshadweep: 'LD', puducherry: 'PY', pondicherry: 'PY',
};
// Longest names first so "New Delhi" wins over "Delhi"
const STATE_RE = new RegExp(
  `\\b(${Object.keys(STATE_CODES).sort((a, b) => b.length - a.length).join('|')})\\b`,
  'i',
);

const SECTION_HEADER =
  /^(?:education(?:al)?(?: qualifications?| details)?|academic (?:background|details|qualifications?|profile)|qualifications?|(?:work |professional )?experience|internships?|(?:academic |personal )?projects?|(?:technical |key |core |soft |professional )?skills(?: (?:&|and) tools)?|tools(?: (?:&|and) technologies)?|certifications?|courses|languages(?: known)?|achievements|awards|hobbies|interests|personal (?:details|information|profile|data)|declaration|(?:professional )?summary|(?:career )?objective|profile|activities|leadership(?: (?:&|and) activities)?|extra[- ]?curricular(?: activities)?|references|contact(?: details| information)?)$/i;

const cleanLine = (l: string) => l.replace(/^[^\p{L}\p{N}]+/u, '').trim();
const isHeader = (l: string) => SECTION_HEADER.test(cleanLine(l).replace(/\s*:$/, ''));

/** Lines under a header (until the next header), or the rest of an inline "Header: a, b" line. */
function sectionLines(lines: string[], header: RegExp): string[] {
  const inlineRe = new RegExp(`^(?:${header.source})\\s*[:\\-–]\\s*(.+)$`, 'i');
  const blockRe = new RegExp(`^(?:${header.source})\\s*:?$`, 'i');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = cleanLine(lines[i]);
    const inline = l.match(inlineRe);
    if (inline) {
      out.push(inline[1]);
      continue;
    }
    if (blockRe.test(l)) {
      for (let j = i + 1; j < lines.length && !isHeader(lines[j]); j++) out.push(lines[j]);
    }
  }
  return out;
}

function splitList(lines: string[], maxWords: number, cap: number): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const line of lines) {
    // "Programming Languages: Python, Java" -> keep the part after the label
    const body = line.includes(':') ? line.slice(line.indexOf(':') + 1) : line;
    for (const raw of body.split(/[,|•·;●▪◦]|\s{2,}|\t/)) {
      const item = raw
        .replace(/\(.*?\)/g, '')
        .replace(/^[^\p{L}\p{N}+#.]+|[\s.]+$/gu, '')
        .trim();
      const key = item.toLowerCase();
      if (item.length < 1 || item.length > 40 || item.split(/\s+/).length > maxWords) continue;
      if (/^\d+$/.test(item) || seen.has(key)) continue;
      seen.add(key);
      items.push(item);
      if (items.length >= cap) return items;
    }
  }
  return items;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Indian resumes write day first: 05/03/2002 is 5 March. Returns YYYY-MM-DD or null. */
export function parseResumeDate(s: string): string | null {
  let d: number, m: number, y: number;
  let r: RegExpMatchArray | null;
  if ((r = s.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/))) [y, m, d] = [+r[1], +r[2], +r[3]];
  else if ((r = s.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/))) [d, m, y] = [+r[1], +r[2], +r[3]];
  else if ((r = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s\-/.,]*([A-Za-z]{3,9})[\s\-/.,]*(\d{4})\b/)))
    [d, m, y] = [+r[1], MONTHS.indexOf(r[2].slice(0, 3).toLowerCase()) + 1, +r[3]];
  else if ((r = s.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/)))
    [d, m, y] = [+r[2], MONTHS.indexOf(r[1].slice(0, 3).toLowerCase()) + 1, +r[3]];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (m < 1 || date.getUTCDate() !== d || date.getUTCMonth() !== m - 1) return null;
  if (y < 1940 || y > new Date().getFullYear() - 10) return null;
  return date.toISOString().slice(0, 10);
}

const titleCase = (s: string) =>
  s === s.toUpperCase() ? s.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase()) : s;

const NOT_A_NAME =
  /resume|curriculum|vitae|\bcv\b|engineer|developer|student|analyst|manager|designer|intern|email|phone|mobile|address|linkedin|github|profile|india|scan|view/i;

export function extractProfileFromResume(text: string): ExtractedResumeProfile {
  const lines = (text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const all = lines.join('\n');
  const firstHeader = lines.findIndex(isHeader);
  const topBlock = lines.slice(0, firstHeader === -1 ? 12 : Math.min(firstHeader, 12));

  // Name: an explicit "Name:" label, else the first name-looking lines at the top (a wrapped
  // all-caps name like "YENDLURI GHANA / SATHYA KARTHIK" joins back into one)
  let full_name: string | null = null;
  const labelled = all.match(/^(?:full\s+)?name\s*[:\-–]\s*([\p{L} .']{3,60})$/imu);
  if (labelled) full_name = labelled[1].trim();
  else {
    const isNameLine = (l: string) =>
      /^[\p{L} .']+$/u.test(l) && l.split(/\s+/).length <= 4 && !NOT_A_NAME.test(l) && !isHeader(l);
    const start = topBlock.findIndex(isNameLine);
    if (start !== -1) {
      const parts = [topBlock[start]];
      const next = topBlock[start + 1];
      if (next && isNameLine(next) && next === next.toUpperCase() && parts[0] === parts[0].toUpperCase())
        parts.push(next);
      const words = parts.join(' ').split(/\s+/);
      if (words.length >= 2 && words.length <= 6) full_name = words.join(' ');
    }
  }
  if (full_name) full_name = titleCase(full_name);

  const dobMatch = all.match(
    /(?:date\s*of\s*birth|\bd\.?\s*o\.?\s*b\b\.?|\bborn(?:\s+on)?)\s*[:\-–]?\s*([^\n]{6,30})/i,
  );
  const date_of_birth = dobMatch ? parseResumeDate(dobMatch[1]) : null;

  const g = all.match(/\b(?:gender|sex)\s*[:\-–]?\s*(male|female|transgender)\b/i);
  const gender = g ? (g[1].toLowerCase() as UserGender) : null;

  // Address: the contact block at the top plus labelled address lines. Phone numbers are blanked
  // first so their digits can't be read as a PIN code.
  const addressLines = [...topBlock];
  lines.forEach((l, i) => {
    if (
      /^(?:(?:permanent|present|current|residential|communication)\s+)?address|^location\b|^residence\b|^city\b/i.test(
        cleanLine(l),
      )
    )
      addressLines.push(l, lines[i + 1] ?? '');
  });
  const addressText = addressLines
    .join('\n')
    .replace(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g, ' ');

  let state_code: string | null = null;
  let district: string | null = null;
  const stateLine = addressText.split('\n').find((l) => STATE_RE.test(l));
  if (stateLine) {
    state_code = STATE_CODES[stateLine.match(STATE_RE)![1].toLowerCase()] ?? null;
    // "Vinukonda, Palnadu, Andhra Pradesh" -> the part just before the state
    const before = stateLine
      .slice(0, stateLine.search(STATE_RE))
      .split(',')
      .map(cleanLine)
      .filter(Boolean);
    const last = before.at(-1)?.replace(/^(?:address|location|city)\s*[:\-–]?\s*/i, '');
    if (last && /^[\p{L} .]{3,30}$/u.test(last) && !/india/i.test(last)) district = last;
  }

  const pin =
    addressText.match(/\b([1-9]\d{2})\s?(\d{3})\b/) ??
    all.match(/\bpin(?:\s*code)?\s*[:\-–]?\s*([1-9]\d{2})\s?(\d{3})\b/i);
  const pin_code = pin ? pin[1] + pin[2] : null;

  const skills = splitList(
    sectionLines(
      lines,
      /(?:technical |key |core |soft |professional )?skills(?: (?:&|and) tools)?|tools(?: (?:&|and) technologies)?/,
    ),
    5,
    30,
  );
  const languages = splitList(sectionLines(lines, /languages(?: known)?/), 2, 10).map(titleCase);

  return { full_name, date_of_birth, gender, state_code, district, pin_code, skills, languages };
}
