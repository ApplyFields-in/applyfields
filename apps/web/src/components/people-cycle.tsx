'use client';

import { useEffect, useState } from 'react';

const PEOPLE = ['student', 'engineer', 'doctor', 'police', 'student-girl'];

/** Auth panel: one person every 2s. A timer, not a CSS animation, so it still changes with OS "reduce motion" on (the fade just becomes instant). */
export function PeopleCycle() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setShown((n) => (n + 1) % PEOPLE.length), 2000);
    return () => clearInterval(id);
  }, []);

  return PEOPLE.map((name, i) => (
    // eslint-disable-next-line @next/next/no-img-element -- small pre-cut WebP files, all five load up front
    <img
      key={name}
      src={`/auth/${name}.webp`}
      alt=""
      className={`absolute inset-x-0 bottom-0 mx-auto h-full w-auto transition-opacity duration-500 ${i === shown ? 'opacity-100' : 'opacity-0'}`}
    />
  ));
}
