import { describe, it, expect } from 'vitest';
import { extractEducationFromResume } from './resume-parser.js';

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
