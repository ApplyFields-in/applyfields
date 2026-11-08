import { describe, it, expect } from 'vitest';
import zlib from 'node:zlib';
import {
  extractEducationFromResume,
  extractProfileFromResume,
  extractTextFromBuffer,
  parseResumeDate,
} from './resume-parser.js';

describe('extractEducationFromResume', () => {
  it('correctly extracts B.Tech, Intermediate, and SSC from user resume text without false positives', () => {
    const resumeOcrText = `
& +919182888062 BRM _yendlurighanasathyakarthik@gmail.com
Q  Vinukonda, Palnadu, Andhra Pradesh, India

YENDLURI GHANA
SATHYA KARTHIK

AI/ML Engineer | Full Stack Developer | Problem Solver

SCAN TO VIEW
LINKEDIN PROFILE

EBD linkedin.com/in/yendluri-ghana-sathya-karthik-8689802b7 ) sithub.com/yghanasathyakarthik

© EDUCATION

JINTUGV CEV College of
Engineering, Vizianagaram
B.Tech — Information Technology
CGPA: 8.38 / 10

Expected Graduation: Aug 2027

Board of Intermediate
Education, Andhra Pradesh
96% — 2023

O SSC, Andhra Pradesh
100% — 2021

° EXPERIENCE
AI/ML Engineer Intern
UPToSkills
`;

    const qualifications = extractEducationFromResume(resumeOcrText);
    expect(qualifications).toHaveLength(3);

    // 10th
    const ssc = qualifications.find((q) => q.level === '10th');
    expect(ssc).toBeDefined();
    expect(ssc?.score).toBe(100);
    expect(ssc?.score_type).toBe('percentage');
    expect(ssc?.year_of_passing).toBe(2021);
    expect(ssc?.status).toBe('completed');

    // 12th
    const inter = qualifications.find((q) => q.level === '12th');
    expect(inter).toBeDefined();
    expect(inter?.score).toBe(96);
    expect(inter?.score_type).toBe('percentage');
    expect(inter?.year_of_passing).toBe(2023);
    expect(inter?.board_or_university).toContain('Intermediate');
    expect(inter?.status).toBe('completed');

    // Graduation
    const grad = qualifications.find((q) => q.level === 'graduate');
    expect(grad).toBeDefined();
    expect(grad?.degree).toBe('B.Tech');
    expect(grad?.stream).toBe('Information Technology');
    expect(grad?.score).toBe(8.38);
    expect(grad?.score_type).toBe('cgpa');
    expect(grad?.year_of_passing).toBe(2027);
    expect(grad?.status).toBe('pursuing');

    // Ensure NO fake MS or BA
    expect(qualifications.some((q) => q.level === 'post_graduate')).toBe(false);
    expect(
      qualifications.some((q) => q.degree === 'MS' || q.degree === 'BA'),
    ).toBe(false);
  });
});

const OCR_RESUME = `
& +919182888062 BRM _yendlurighanasathyakarthik@gmail.com
Q  Vinukonda, Palnadu, Andhra Pradesh, India

YENDLURI GHANA
SATHYA KARTHIK

AI/ML Engineer | Full Stack Developer | Problem Solver

© EDUCATION
JINTUGV CEV College of
Engineering, Vizianagaram
B.Tech — Information Technology
CGPA: 8.38 / 10

TECHNICAL SKILLS
Programming Languages: Python, Java, C++
Frameworks: React, Node.js | FastAPI
LANGUAGES
English (Fluent), Telugu, Hindi
`;

describe('extractProfileFromResume', () => {
  it('reads name, state, district and skills from the contact block and sections', () => {
    const p = extractProfileFromResume(OCR_RESUME);
    expect(p.full_name).toBe('Yendluri Ghana Sathya Karthik');
    expect(p.state_code).toBe('AP');
    expect(p.district).toBe('Palnadu');
    expect(p.pin_code).toBeNull(); // phone digits must not become a PIN
    expect(p.skills).toEqual(['Python', 'Java', 'C++', 'React', 'Node.js', 'FastAPI']);
    expect(p.languages).toEqual(['English', 'Telugu', 'Hindi']);
    expect(p.date_of_birth).toBeNull();
    expect(p.gender).toBeNull();
  });

  it('reads labelled personal details', () => {
    const p = extractProfileFromResume(`CURRICULUM VITAE
Name: Ravi Teja
PERSONAL DETAILS
Date of Birth: 05/03/2002
Gender: Male
Address: 4-12, Gandhi Nagar, Warangal, Telangana - 506 002
Languages Known: Telugu, English`);
    expect(p.full_name).toBe('Ravi Teja');
    expect(p.date_of_birth).toBe('2002-03-05');
    expect(p.gender).toBe('male');
    expect(p.state_code).toBe('TS');
    expect(p.district).toBe('Warangal');
    expect(p.pin_code).toBe('506002');
    expect(p.languages).toEqual(['Telugu', 'English']);
  });

  it('returns nothing for an empty resume', () => {
    expect(extractProfileFromResume('')).toEqual({
      full_name: null, date_of_birth: null, gender: null, state_code: null,
      district: null, pin_code: null, skills: [], languages: [],
    });
  });
});

describe('parseResumeDate', () => {
  it('handles Indian day-first and written formats, rejects junk', () => {
    expect(parseResumeDate('12-08-2001')).toBe('2001-08-12');
    expect(parseResumeDate('3rd March 2000')).toBe('2000-03-03');
    expect(parseResumeDate('March 3, 2000')).toBe('2000-03-03');
    expect(parseResumeDate('2001-08-12')).toBe('2001-08-12');
    expect(parseResumeDate('31/02/2001')).toBeNull();
    expect(parseResumeDate('01/01/2024')).toBeNull(); // too recent to be a DOB
  });
});

describe('education never invents values', () => {
  it('leaves degree, board and institution empty when the resume does not say them', () => {
    const [grad] = extractEducationFromResume(`EDUCATION
Bachelor of Arts
2020`);
    expect(grad.level).toBe('graduate');
    expect(grad.degree).toBe('');
    expect(grad.institution_name).toBe('');
    expect(grad.board_or_university).toBe('');
    expect(grad.stream).toBe('');
  });
});

describe('extractTextFromBuffer (docx)', () => {
  it('reads paragraphs out of word/document.xml', async () => {
    // Minimal one-file zip: local header + deflated data + central directory + end record
    const xml = Buffer.from('<w:document><w:body><w:p><w:r><w:t>Ravi &amp; Co</w:t></w:r></w:p><w:p><w:t>SKILLS</w:t></w:p></w:body></w:document>');
    const data = zlib.deflateRawSync(xml);
    const name = Buffer.from('word/document.xml');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(xml.length, 22); local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(8, 10);
    central.writeUInt32LE(data.length, 20); central.writeUInt32LE(xml.length, 24); central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(0, 42);
    const cdOffset = 30 + name.length + data.length;
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10);
    end.writeUInt32LE(46 + name.length, 12); end.writeUInt32LE(cdOffset, 16);
    const docx = Buffer.concat([local, name, data, central, name, end]);
    const text = await extractTextFromBuffer(
      docx,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'cv.docx',
    );
    expect(text.trim()).toBe(`Ravi & Co
SKILLS`);
  });
});
