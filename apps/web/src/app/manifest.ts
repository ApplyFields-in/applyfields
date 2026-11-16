import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ApplyFields — Every opportunity. One place.',
    short_name: 'ApplyFields',
    description:
      'Government jobs, exams, scholarships, admissions, government services and career guidance — in one place.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0F4F8',
    theme_color: '#082046',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/logo-mark.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}

