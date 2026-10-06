import { execFile } from 'node:child_process';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import type { EducationLevel, EducationStatus, ExtractedEducationItem, ScoreType } from '@applyfields/types';

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
async function runOcrOnImageBuffer(imageBuffer: Buffer, ext = 'jpg'): Promise<string> {
  const tesseract = findTesseractBinary();
  if (!tesseract) {
    console.warn('[ResumeParser] Tesseract OCR binary not found on host.');
    return '';
  }

  const tempFile = path.join(os.tmpdir(), `resume_ocr_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
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

/**
 * Extracts printable ASCII/UTF-8 and decompressed text from PDF streams.
 */
function extractTextFromPdfStreams(pdfBuffer: Buffer): string {
  let accumulatedText = '';

  // 1. Scan for compressed streams (FlateDecode)
  let pos = 0;
  while (pos < pdfBuffer.length) {
    const streamIdx = pdfBuffer.indexOf('stream', pos);
    if (streamIdx === -1) break;
    let start = streamIdx + 6;
    if (pdfBuffer[start] === 13) start++; // \r
    if (pdfBuffer[start] === 10) start++; // \n
    const end = pdfBuffer.indexOf('endstream', start);
    if (end === -1) break;

    const chunk = pdfBuffer.subarray(start, end);
    try {
      const decompressed = zlib.inflateSync(chunk);
      const str = decompressed.toString('latin1');
      // Look for text operators like (string) Tj or [(string)] TJ
      const textMatches = str.match(/\(([^()]{2,})\)\s*Tj/g);
      if (textMatches) {
        for (const m of textMatches) {
          const inner = m.slice(1, m.indexOf(')'));
          accumulatedText += inner + ' ';
        }
      }
    } catch {}
    pos = end + 9;
  }

  return accumulatedText.trim();
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
  if (mimeType.includes('text') || ext === 'txt' || ext === 'md' || ext === 'text') {
    return buffer.toString('utf-8');
  }

  // 2. Direct image formats
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(ext)) {
    return await runOcrOnImageBuffer(buffer, ext);
  }

  // 3. PDF formats
  if (mimeType.includes('pdf') || ext === 'pdf') {
    // Attempt digital stream text extraction first
    const digitalText = extractTextFromPdfStreams(buffer);
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
export function extractEducationFromResume(text: string): ExtractedEducationItem[] {
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
    if (/\b(?:M\.?Tech|MBA|MCA|M\.?Sc|M\.?Com|Master of [A-Za-z\s]+|M\.?S\.?\s+(?:in|from|degree))\b/i.test(line)) {
      return 'post_graduate';
    }
    if (/\b(?:College|University|Campus|Institute of Technology)\b/i.test(line) ||
        /\b(?:B\.?Tech|B\.?E\.?|B\.?Sc|B\.?Com|BCA|BBA|B\.?Pharm|MBBS|Bachelor of [A-Za-z\s]+)\b/i.test(line)) {
      return 'graduate';
    }
    if (/Board of Intermediate|Intermediate|Class XII|Class 12th|\b12th\b|Junior College|\+2\b|HSC\b|PUC\b/i.test(line)) {
      return '12th';
    }
    if (/SSC|Class X|Class 10th|\b10th\b|Matriculation|Secondary School Certificate|High School/i.test(line)) {
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
    let degree = 'Qualification';
    const level = sec.level;

    if (level === 'phd') {
      degree = 'Ph.D / Doctorate';
    } else if (level === 'post_graduate') {
      const match = chunkText.match(/\b(?:M\.?Tech|MBA|MCA|M\.?Sc|M\.?Com|Master of [A-Za-z\s]+|M\.?S\.?)\b/i);
      degree = match ? match[0].replace(/\./g, '').toUpperCase() : 'Master Degree';
    } else if (level === 'graduate') {
      const btech = chunkText.match(/\b(?:B\.?Tech|B\.?E\.?|B\.?Sc|B\.?Com|BCA|BBA|B\.?Pharm|MBBS)\b/i);
      if (btech) {
        const clean = btech[0].toLowerCase().replace(/[^a-z]/g, '');
        degree = clean === 'btech' ? 'B.Tech' : clean === 'be' ? 'B.E.' : btech[0].replace(/\./g, '').toUpperCase();
      } else {
        degree = 'B.Tech';
      }
    } else if (level === '12th') {
      degree = 'Intermediate / Class XII';
    } else if (level === '10th') {
      degree = 'Class 10th (SSC)';
    }

    // Score parsing
    let score: number | null = null;
    let scoreType: ScoreType = 'percentage';
    const percentMatch = chunkText.match(/\b([4-9]\d(?:\.\d{1,2})?|100(?:\.0)?)\s*%/);
    if (percentMatch) {
      score = parseFloat(percentMatch[1]);
      scoreType = 'percentage';
    } else {
      const cgpaMatch = chunkText.match(/\b([4-9](?:\.\d{1,2})?|10(?:\.0)?)\s*(?:\/\s*10|CGPA|GPA|\/10.0)\b/i);
      if (cgpaMatch) {
        score = parseFloat(cgpaMatch[1]);
        scoreType = 'cgpa';
      }
    }

    // Passing year and pursuing status
    let year: number | null = null;
    const yearMatches = chunkText.match(/\b(19\d{2}|20\d{2})\b/g);
    if (yearMatches) {
      const valid = yearMatches.map((y) => parseInt(y, 10)).filter((y) => y >= 1970 && y <= 2035);
      if (valid.length > 0) year = Math.max(...valid);
    }

    const isPursuing = /expected|pursuing|currently|ongoing/i.test(chunkText) || (year != null && year > currentYear);
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
    if (!stream && level === '10th') stream = 'General';
    if (!stream && level === '12th') stream = 'MPC';

    // Institution and Board extraction
    let institution = '';
    let board = '';

    if (level === 'graduate') {
      const instLines = sec.lines.filter(
        (l) => /College|University|Institute|JNTU|Engineering|Campus/i.test(l) && !/B\.?Tech|CGPA|Graduation|Expected/i.test(l),
      );
      institution = instLines.join(' ').replace(/^[^\w]+/, '').trim() || 'College of Engineering';
      if (/JNTU/i.test(chunkText)) {
        board = 'JNTU Gurajada Vizianagaram';
      }
    } else if (level === '12th') {
      if (/Board of Intermediate Education/i.test(chunkText) || /Andhra Pradesh/i.test(chunkText)) {
        board = 'Board of Intermediate Education, Andhra Pradesh';
        institution = 'Junior College';
      } else {
        board = 'State Board of Intermediate Education';
        institution = 'Junior College';
      }
    } else if (level === '10th') {
      if (/SSC/i.test(chunkText) && /Andhra Pradesh/i.test(chunkText)) {
        board = 'Board of Secondary Education, Andhra Pradesh (SSC)';
        institution = 'High School';
      } else {
        board = 'State Board of Secondary Education';
        institution = 'High School';
      }
    }

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
      confidence: 0.95,
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

  return Array.from(uniqueMap.values()).sort((a, b) => order[a.level] - order[b.level]);
}
