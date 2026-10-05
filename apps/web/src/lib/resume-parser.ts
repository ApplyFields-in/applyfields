import type { EducationLevel, EducationStatus, ScoreType } from '@applyfields/types';

export interface ExtractedEducation {
  level: EducationLevel;
  degree: string;
  stream: string;
  board_or_university: string;
  institution_name: string;
  year_of_passing: number | null;
  score: number | null;
  score_type: ScoreType;
  status: EducationStatus;
  confidence: number;
}

const STREAM_KEYWORDS = [
  'Computer Science and Engineering',
  'Computer Science & Engineering',
  'Computer Science',
  'Information Technology',
  'Mechanical Engineering',
  'Electrical and Electronics Engineering',
  'Electronics and Communication Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Artificial Intelligence',
  'Data Science',
  'Commerce',
  'MPC (Maths, Physics, Chemistry)',
  'BiPC (Biology, Physics, Chemistry)',
  'Economics',
  'Business Administration',
  'Accountancy',
  'Science',
  'Arts',
  'MPC',
  'BiPC',
  'CSE',
  'ECE',
  'EEE',
  'IT',
  'MECH',
  'CIVIL',
];

const BOARD_KEYWORDS = [
  'CBSE',
  'ICSE',
  'State Board',
  'BSE Telangana',
  'BIE Telangana',
  'AP Board',
  'JNTU Hyderabad',
  'JNTU Kakinada',
  'Osmania University',
  'Andhra University',
  'Delhi University',
  'Anna University',
  'VTU',
  'Mumbai University',
  'IIT',
  'NIT',
  'BITS Pilani',
];

/**
 * Extracts educational milestones from raw resume text using pattern recognition.
 */
export function extractEducationFromResume(text: string): ExtractedEducation[] {
  if (!text || text.trim().length === 0) return [];

  const results: ExtractedEducation[] = [];

  // Helper to extract year from text block
  function findYear(block: string): number | null {
    const yearMatch = block.match(/\b(19\d{2}|20\d{2})\b/g);
    if (!yearMatch) return null;
    // Return latest year if multiple
    const years = yearMatch.map((y) => parseInt(y, 10)).filter((y) => y >= 1970 && y <= 2035);
    return years.length > 0 ? Math.max(...years) : null;
  }

  // Helper to extract score / percentage / CGPA
  function findScore(block: string): { score: number | null; scoreType: ScoreType } {
    const percentMatch = block.match(/\b([4-9]\d(?:\.\d{1,2})?|\d{2}(?:\.\d{1,2})?)\s*%/);
    if (percentMatch) {
      const val = parseFloat(percentMatch[1]);
      if (val >= 35 && val <= 100) return { score: val, scoreType: 'percentage' };
    }

    const cgpaMatch = block.match(/\b([4-9](?:\.\d{1,2})?|10(?:\.0)?)\s*(?:\/\s*10|CGPA|GPA|\/10.0)\b/i);
    if (cgpaMatch) {
      const val = parseFloat(cgpaMatch[1]);
      if (val >= 4 && val <= 10) return { score: val, scoreType: 'cgpa' };
    }

    return { score: null, scoreType: 'percentage' };
  }

  // Helper to find matching stream
  function findStream(block: string): string {
    const matched = STREAM_KEYWORDS.find((s) => new RegExp(`\\b${s}\\b`, 'i').test(block));
    return matched ?? '';
  }

  // Helper to find board or university
  function findBoardOrUniversity(block: string): string {
    const matched = BOARD_KEYWORDS.find((b) => new RegExp(`\\b${b}\\b`, 'i').test(block));
    if (matched) return matched;

    // Scan for university keyword in lines
    const uniLine = block.match(/(?:[A-Z][a-zA-Z\s&]+\b(?:University|Board|Institute of Technology|Council)\b)/i);
    return uniLine ? uniLine[0].trim() : '';
  }

  // Helper to find institution / college
  function findInstitution(block: string): string {
    const instMatch = block.match(/(?:[A-Z][a-zA-Z\s&]+\b(?:College|School|Vidyalaya|Academy|Campus|Polytechnic|Institute)\b)/i);
    return instMatch ? instMatch[0].trim() : '';
  }

  // 1. Check for Ph.D / Doctorate
  const phdRegex = /\b(?:Ph\.?D|Doctorate|Doctor of Philosophy)\b/i;
  if (phdRegex.test(text)) {
    const block = findContextBlock(text, phdRegex);
    const scoreData = findScore(block);
    results.push({
      level: 'phd',
      degree: 'Ph.D / Doctorate',
      stream: findStream(block),
      board_or_university: findBoardOrUniversity(block),
      institution_name: findInstitution(block),
      year_of_passing: findYear(block),
      score: scoreData.score,
      score_type: scoreData.scoreType,
      status: block.toLowerCase().includes('pursuing') ? 'pursuing' : 'completed',
      confidence: 0.9,
    });
  }

  // 2. Check for Master's / Post Graduate (M.Tech, MBA, MCA, M.Sc, M.Com, M.A)
  const pgRegex = /\b(?:M\.?Tech|MBA|MCA|M\.?S|M\.?Sc|M\.?Com|Master of [A-Za-z\s]+|Post Graduation)\b/i;
  if (pgRegex.test(text)) {
    const block = findContextBlock(text, pgRegex);
    const matchDeg = block.match(pgRegex)?.[0] ?? 'Post Graduate';
    const scoreData = findScore(block);
    results.push({
      level: 'post_graduate',
      degree: matchDeg.toUpperCase().replace(/\./g, ''),
      stream: findStream(block),
      board_or_university: findBoardOrUniversity(block),
      institution_name: findInstitution(block),
      year_of_passing: findYear(block),
      score: scoreData.score,
      score_type: scoreData.scoreType,
      status: block.toLowerCase().includes('pursuing') ? 'pursuing' : 'completed',
      confidence: 0.88,
    });
  }

  // 3. Check for Bachelor's / Graduation (B.Tech, B.E., B.Sc, B.Com, B.A, MBBS, BCA, BBA)
  const ugRegex = /\b(?:B\.?Tech|B\.?E\.?|Bachelor of Technology|Bachelor of Engineering|B\.?Sc|B\.?Com|B\.?A|BCA|BBA|MBBS|B\.?Pharm|Graduation)\b/i;
  if (ugRegex.test(text)) {
    const block = findContextBlock(text, ugRegex);
    const matchDeg = block.match(ugRegex)?.[0] ?? 'B.Tech';
    const scoreData = findScore(block);
    results.push({
      level: 'graduate',
      degree: matchDeg.toUpperCase().replace(/\./g, ''),
      stream: findStream(block),
      board_or_university: findBoardOrUniversity(block),
      institution_name: findInstitution(block),
      year_of_passing: findYear(block),
      score: scoreData.score,
      score_type: scoreData.scoreType,
      status: block.toLowerCase().includes('pursuing') ? 'pursuing' : 'completed',
      confidence: 0.95,
    });
  }

  // 4. Check for Diploma / Polytechnic
  const dipRegex = /\b(?:Diploma|Polytechnic|State Board of Technical Education)\b/i;
  if (dipRegex.test(text)) {
    const block = findContextBlock(text, dipRegex);
    const scoreData = findScore(block);
    results.push({
      level: 'diploma',
      degree: 'Polytechnic Diploma',
      stream: findStream(block),
      board_or_university: findBoardOrUniversity(block),
      institution_name: findInstitution(block),
      year_of_passing: findYear(block),
      score: scoreData.score,
      score_type: scoreData.scoreType,
      status: 'completed',
      confidence: 0.85,
    });
  }

  // 5. Check for 12th / Intermediate / Higher Secondary / +2 / PUC
  const interRegex = /\b(?:Intermediate|Class XII|Class 12th|12th|Higher Secondary|HSC|\+2|Senior Secondary|PUC)\b/i;
  if (interRegex.test(text)) {
    const block = findContextBlock(text, interRegex);
    const scoreData = findScore(block);
    results.push({
      level: '12th',
      degree: 'Intermediate / Class XII',
      stream: findStream(block) || 'MPC',
      board_or_university: findBoardOrUniversity(block) || 'State Board of Intermediate Education',
      institution_name: findInstitution(block) || 'Junior College',
      year_of_passing: findYear(block),
      score: scoreData.score,
      score_type: scoreData.scoreType,
      status: 'completed',
      confidence: 0.9,
    });
  }

  // 6. Check for 10th / Secondary / SSC / Matriculation / Class X
  const sscRegex = /\b(?:SSC|Class X\b|Class 10th|10th\b|Matriculation|Secondary School Certificate|CBSE 10th)\b/i;
  if (sscRegex.test(text)) {
    const block = findContextBlock(text, sscRegex);
    const scoreData = findScore(block);
    results.push({
      level: '10th',
      degree: 'Class 10th (SSC)',
      stream: 'General',
      board_or_university: findBoardOrUniversity(block) || 'State Board of Secondary Education',
      institution_name: findInstitution(block) || 'High School',
      year_of_passing: findYear(block),
      score: scoreData.score,
      score_type: scoreData.scoreType,
      status: 'completed',
      confidence: 0.92,
    });
  }

  // Sort qualifications logically: 10th -> 12th -> diploma -> graduate -> post_graduate -> phd
  const order: Record<EducationLevel, number> = {
    '10th': 1,
    '12th': 2,
    iti: 3,
    diploma: 4,
    graduate: 5,
    post_graduate: 6,
    phd: 7,
  };

  return results.sort((a, b) => order[a.level] - order[b.level]);
}

/**
 * Extracts a window of ~5 lines around the matched keyword to get context like university, score, and year.
 */
function findContextBlock(fullText: string, regex: RegExp): string {
  const lines = fullText.split(/\r?\n/);
  const matchIdx = lines.findIndex((l) => regex.test(l));
  if (matchIdx === -1) return fullText.slice(0, 500);

  const start = Math.max(0, matchIdx - 2);
  const end = Math.min(lines.length, matchIdx + 4);
  return lines.slice(start, end).join('\n');
}

/**
 * Extracts printable ASCII / UTF-8 strings from an ArrayBuffer (client-side PDF & document fallback).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Plain text / markdown
  if (extension === 'txt' || extension === 'text' || extension === 'md') {
    return file.text();
  }

  // PDF or binary documents: extract text streams
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Decode readable ASCII text streams
  let text = '';
  let currentWord = '';

  for (let i = 0; i < bytes.length; i++) {
    const code = bytes[i];
    // Printable ASCII characters
    if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
      currentWord += String.fromCharCode(code);
    } else {
      if (currentWord.length >= 2) {
        text += currentWord + ' ';
      }
      currentWord = '';
    }
  }

  return text;
}
