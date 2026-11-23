import { readFileSync } from 'node:fs';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

/**
 * The letter a college's principal signs and stamps to authorise its ApplyFields desk.
 * It carries the account's reference, so staff can match the uploaded copy to the right sign-up.
 */

/** Same formula is shown in admin (colleges desk) so staff can match the uploaded letter. */
export const letterRef = (partnerId: string) => `AF-INST-${partnerId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

export interface LetterDetails {
  partnerId: string;
  collegeName: string;
  address: string;
  representative: string;
  email: string | null;
  phone: string;
  date?: Date;
}

// dist/modules/partners → apps/api/assets (and the same from src/ in tests).
const LOGO_PATH = new URL('../../../assets/logo.png', import.meta.url);

const NAVY = rgb(0.03, 0.13, 0.27);
const BLUE = rgb(0.05, 0.48, 0.96);
const GREY = rgb(0.33, 0.4, 0.5);
const M = 56; // page margin
const W = 595.28; // A4
const H = 841.89;

/** The built-in PDF fonts only cover Latin-1; anything else (e.g. Telugu) would throw. */
const latin = (s: string) => s.replace(/[^\x20-\x7e\xa0-\xff]/g, '').trim();

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of latin(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildAuthorizationLetter(d: LetterDetails): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`ApplyFields authorisation letter - ${latin(d.collegeName)}`);
  pdf.setAuthor('ApplyFields');
  const page: PDFPage = pdf.addPage([W, H]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ref = letterRef(d.partnerId);
  const date = (d.date ?? new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  let y = H - M;
  const text = (s: string, opts: { size?: number; f?: PDFFont; color?: typeof NAVY; x?: number } = {}) => {
    page.drawText(latin(s), { x: opts.x ?? M, y, size: opts.size ?? 10, font: opts.f ?? font, color: opts.color ?? NAVY });
  };
  const para = (s: string, size = 10, gap = 4) => {
    for (const l of wrap(s, font, size, W - 2 * M)) {
      text(l, { size });
      y -= size + 4;
    }
    y -= gap;
  };

  // Header: logo left, reference + date right.
  const logo = await pdf.embedPng(readFileSync(LOGO_PATH));
  const logoW = 96;
  const logoH = (logo.height / logo.width) * logoW;
  page.drawImage(logo, { x: M, y: y - logoH + 8, width: logoW, height: logoH });
  text(`Ref: ${ref}`, { f: bold, x: W - M - 170 });
  y -= 14;
  text(`Date: ${date}`, { x: W - M - 170 });
  y -= logoH - 4;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: BLUE });
  y -= 26;

  text('Institution Authorisation Letter', { size: 16, f: bold });
  y -= 22;
  text('To: Partner Verification Team, ApplyFields (applyfields.com)', { color: GREY });
  y -= 20;
  para(`Subject: Authorisation to run the official ApplyFields admissions desk for ${d.collegeName}`, 10, 8);

  para(
    `I, the undersigned Principal / Head of ${d.collegeName}, ${d.address}, authorise the person named below to manage ` +
      `our institution's official admissions desk on ApplyFields under account reference ${ref}.`,
  );

  // Details block
  const rows: Array<[string, string]> = [
    ['Institution', d.collegeName],
    ['Address', d.address],
    ['Authorised representative', d.representative],
    ['Official email', d.email ?? '-'],
    ['Mobile', d.phone],
    ['ApplyFields account ref', ref],
  ];
  y -= 2;
  for (const [k, v] of rows) {
    text(k, { f: bold, size: 9.5 });
    const lines = wrap(v, font, 9.5, W - 2 * M - 150);
    lines.forEach((l, i) => {
      text(l, { size: 9.5, x: M + 150 });
      if (i < lines.length - 1) y -= 13;
    });
    y -= 16;
  }
  y -= 4;

  text('We confirm and agree that:', { f: bold });
  y -= 16;
  [
    'The details above and the documents we submit are true. ApplyFields may verify them with AICTE, UGC or other authorities.',
    'The representative may publish our programmes, fees, seats and admission dates, and reply to student enquiries on our behalf.',
    'We will keep this information accurate and up to date, and will not mislead students or ask them for payment outside official channels.',
    'Student details received through ApplyFields are used only to answer that student, and are not shared or sold.',
    'We will inform ApplyFields in writing if this authorisation is withdrawn or the representative changes.',
    'ApplyFields may suspend or remove our desk if any of this is found to be untrue, and we accept the ApplyFields Partner Terms.',
  ].forEach((s, i) => {
    const lines = wrap(s, font, 9.5, W - 2 * M - 16);
    text(`${i + 1}.`, { size: 9.5 });
    lines.forEach((l) => {
      text(l, { size: 9.5, x: M + 16 });
      y -= 13.5;
    });
    y -= 3;
  });

  // Signature + seal boxes
  y -= 10;
  const boxH = 110;
  const boxW = (W - 2 * M - 20) / 2;
  page.drawRectangle({ x: M, y: y - boxH, width: boxW, height: boxH, borderColor: GREY, borderWidth: 0.8 });
  page.drawRectangle({ x: M + boxW + 20, y: y - boxH, width: boxW, height: boxH, borderColor: GREY, borderWidth: 0.8 });
  const top = y;
  y = top - 16;
  text('Signature of Principal / Head', { f: bold, size: 9, x: M + 10 });
  text('College seal / stamp', { f: bold, size: 9, x: M + boxW + 30 });
  y = top - boxH + 34;
  text('Name: ______________________________', { size: 9, x: M + 10 });
  y -= 18;
  text('Date:  ______________________________', { size: 9, x: M + 10 });
  y = top - boxH - 26;

  para(
    `Next step: print this letter, have the Principal sign it and put the college seal in the box, then upload a clear ` +
      `scan or photo at partners.applyfields.com under "Principal authorisation". Letters without both the signature ` +
      `and the seal are not accepted. This letter is valid only for account ${ref}.`,
    8.5,
  );

  return pdf.save();
}
