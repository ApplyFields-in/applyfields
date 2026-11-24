import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// The preview card WhatsApp, X, LinkedIn etc. show for any shared ApplyFields link.
export const alt = 'ApplyFields: government jobs, exams, scholarships and admissions in one place';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logo = await readFile(join(process.cwd(), 'public/logo.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 64,
          padding: '0 80px',
          background: 'linear-gradient(135deg, #ffffff 0%, #eef4ff 100%)',
          color: '#082046',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={406} height={299} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>Every opportunity. One place.</div>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: '#3b4a66' }}>
            Government jobs, exams, scholarships, admissions and services, with eligibility checks and deadline
            reminders.
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1f63e0' }}>applyfields.com</div>
        </div>
      </div>
    ),
    size,
  );
}
