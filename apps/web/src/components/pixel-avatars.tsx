'use client';

import React from 'react';

export interface PixelAvatarData {
  id: string;
  name: string;
  title: string;
  bg: string;
  pixels: { x: number; y: number; c: string }[];
}

// Color Palette for Pixel Avatars (Theme friendly: Teal, Sea, Celadon, Cream + natural skin & hair tones)
const C = {
  skinLight: '#ffd6ba',
  skinWarm: '#f2a65a',
  skinDeep: '#8c5028',
  hairDark: '#1b262c',
  hairBrown: '#593d3b',
  hairGold: '#e3b23c',
  hairAuburn: '#9a3b3b',
  teal: '#114b5f',
  sea: '#028090',
  celadon: '#8fc0a9',
  tea: '#c8d6af',
  cream: '#fbfbf2',
  navy: '#0f3460',
  red: '#e76f51',
  blue: '#457b9d',
  gold: '#f4a261',
  glasses: '#3a86ff',
  green: '#588157',
};

export const PIXEL_AVATARS: PixelAvatarData[] = [
  {
    id: 'pixel-scholar',
    name: 'The Scholar',
    title: 'Academic Aspirant',
    bg: '#114b5f',
    pixels: [
      // Mortarboard cap
      { x: 4, y: 2, c: C.navy }, { x: 5, y: 2, c: C.navy }, { x: 6, y: 2, c: C.navy }, { x: 7, y: 2, c: C.navy }, { x: 8, y: 2, c: C.navy }, { x: 9, y: 2, c: C.navy }, { x: 10, y: 2, c: C.navy }, { x: 11, y: 2, c: C.navy },
      { x: 6, y: 1, c: C.gold }, { x: 7, y: 1, c: C.gold }, { x: 12, y: 3, c: C.gold }, { x: 12, y: 4, c: C.gold },
      { x: 6, y: 3, c: C.navy }, { x: 7, y: 3, c: C.navy }, { x: 8, y: 3, c: C.navy }, { x: 9, y: 3, c: C.navy },
      // Hair & Face
      { x: 5, y: 4, c: C.hairDark }, { x: 6, y: 4, c: C.skinLight }, { x: 7, y: 4, c: C.skinLight }, { x: 8, y: 4, c: C.skinLight }, { x: 9, y: 4, c: C.skinLight }, { x: 10, y: 4, c: C.hairDark },
      { x: 4, y: 5, c: C.hairDark }, { x: 5, y: 5, c: C.glasses }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.skinLight }, { x: 8, y: 5, c: C.skinLight }, { x: 9, y: 5, c: C.glasses }, { x: 10, y: 5, c: C.hairDark }, { x: 11, y: 5, c: C.hairDark },
      { x: 5, y: 6, c: C.glasses }, { x: 6, y: 6, c: C.skinLight }, { x: 7, y: 6, c: C.glasses }, { x: 8, y: 6, c: C.glasses }, { x: 9, y: 6, c: C.skinLight }, { x: 10, y: 6, c: C.glasses },
      { x: 5, y: 7, c: C.skinLight }, { x: 6, y: 7, c: C.skinLight }, { x: 7, y: 7, c: C.skinLight }, { x: 8, y: 7, c: C.skinLight }, { x: 9, y: 7, c: C.skinLight }, { x: 10, y: 7, c: C.skinLight },
      // Smile
      { x: 6, y: 8, c: C.skinLight }, { x: 7, y: 8, c: C.red }, { x: 8, y: 8, c: C.red }, { x: 9, y: 8, c: C.skinLight },
      { x: 6, y: 9, c: C.skinLight }, { x: 7, y: 9, c: C.skinLight }, { x: 8, y: 9, c: C.skinLight }, { x: 9, y: 9, c: C.skinLight },
      // Shirt / Robe
      { x: 4, y: 10, c: C.sea }, { x: 5, y: 10, c: C.sea }, { x: 6, y: 10, c: C.cream }, { x: 7, y: 10, c: C.red }, { x: 8, y: 10, c: C.red }, { x: 9, y: 10, c: C.cream }, { x: 10, y: 10, c: C.sea }, { x: 11, y: 10, c: C.sea },
      { x: 3, y: 11, c: C.sea }, { x: 4, y: 11, c: C.sea }, { x: 5, y: 11, c: C.sea }, { x: 6, y: 11, c: C.cream }, { x: 7, y: 11, c: C.red }, { x: 8, y: 11, c: C.red }, { x: 9, y: 11, c: C.cream }, { x: 10, y: 11, c: C.sea }, { x: 11, y: 11, c: C.sea }, { x: 12, y: 11, c: C.sea },
      { x: 3, y: 12, c: C.sea }, { x: 4, y: 12, c: C.sea }, { x: 5, y: 12, c: C.sea }, { x: 6, y: 12, c: C.navy }, { x: 7, y: 12, c: C.navy }, { x: 8, y: 12, c: C.navy }, { x: 9, y: 12, c: C.navy }, { x: 10, y: 12, c: C.sea }, { x: 11, y: 12, c: C.sea }, { x: 12, y: 12, c: C.sea },
    ],
  },
  {
    id: 'pixel-engineer',
    name: 'The Engineer',
    title: 'Tech & Problem Solver',
    bg: '#028090',
    pixels: [
      // Headphones band
      { x: 5, y: 2, c: C.red }, { x: 6, y: 2, c: C.red }, { x: 7, y: 2, c: C.red }, { x: 8, y: 2, c: C.red }, { x: 9, y: 2, c: C.red }, { x: 10, y: 2, c: C.red },
      // Hair
      { x: 5, y: 3, c: C.hairBrown }, { x: 6, y: 3, c: C.hairBrown }, { x: 7, y: 3, c: C.hairBrown }, { x: 8, y: 3, c: C.hairBrown }, { x: 9, y: 3, c: C.hairBrown }, { x: 10, y: 3, c: C.hairBrown },
      // Headphone ear cups & face
      { x: 3, y: 4, c: C.red }, { x: 4, y: 4, c: C.red }, { x: 5, y: 4, c: C.hairBrown }, { x: 6, y: 4, c: C.skinLight }, { x: 7, y: 4, c: C.skinLight }, { x: 8, y: 4, c: C.skinLight }, { x: 9, y: 4, c: C.skinLight }, { x: 10, y: 4, c: C.hairBrown }, { x: 11, y: 4, c: C.red }, { x: 12, y: 4, c: C.red },
      { x: 3, y: 5, c: C.red }, { x: 4, y: 5, c: C.red }, { x: 5, y: 5, c: C.hairDark }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.skinLight }, { x: 8, y: 5, c: C.skinLight }, { x: 9, y: 5, c: C.hairDark }, { x: 10, y: 5, c: C.hairDark }, { x: 11, y: 5, c: C.red }, { x: 12, y: 5, c: C.red },
      { x: 3, y: 6, c: C.cream }, { x: 4, y: 6, c: C.red }, { x: 5, y: 6, c: C.skinLight }, { x: 6, y: 6, c: C.skinLight }, { x: 7, y: 6, c: C.skinLight }, { x: 8, y: 6, c: C.skinLight }, { x: 9, y: 6, c: C.skinLight }, { x: 10, y: 6, c: C.skinLight }, { x: 11, y: 6, c: C.red }, { x: 12, y: 6, c: C.cream },
      { x: 5, y: 7, c: C.skinLight }, { x: 6, y: 7, c: C.skinLight }, { x: 7, y: 7, c: C.red }, { x: 8, y: 7, c: C.red }, { x: 9, y: 7, c: C.skinLight }, { x: 10, y: 7, c: C.skinLight },
      { x: 6, y: 8, c: C.skinLight }, { x: 7, y: 8, c: C.skinLight }, { x: 8, y: 8, c: C.skinLight }, { x: 9, y: 8, c: C.skinLight },
      // Hoodie
      { x: 4, y: 9, c: C.teal }, { x: 5, y: 9, c: C.teal }, { x: 6, y: 9, c: C.skinLight }, { x: 7, y: 9, c: C.skinLight }, { x: 8, y: 9, c: C.skinLight }, { x: 9, y: 9, c: C.skinLight }, { x: 10, y: 9, c: C.teal }, { x: 11, y: 9, c: C.teal },
      { x: 3, y: 10, c: C.teal }, { x: 4, y: 10, c: C.teal }, { x: 5, y: 10, c: C.teal }, { x: 6, y: 10, c: C.celadon }, { x: 7, y: 10, c: C.celadon }, { x: 8, y: 10, c: C.celadon }, { x: 9, y: 10, c: C.celadon }, { x: 10, y: 10, c: C.teal }, { x: 11, y: 10, c: C.teal }, { x: 12, y: 10, c: C.teal },
      { x: 2, y: 11, c: C.teal }, { x: 3, y: 11, c: C.teal }, { x: 4, y: 11, c: C.teal }, { x: 5, y: 11, c: C.teal }, { x: 6, y: 11, c: C.celadon }, { x: 7, y: 11, c: C.cream }, { x: 8, y: 11, c: C.cream }, { x: 9, y: 11, c: C.celadon }, { x: 10, y: 11, c: C.teal }, { x: 11, y: 11, c: C.teal }, { x: 12, y: 11, c: C.teal }, { x: 13, y: 11, c: C.teal },
    ],
  },
  {
    id: 'pixel-officer',
    name: 'The Officer',
    title: 'Civil Services Aspirant',
    bg: '#114b5f',
    pixels: [
      // Peak cap with emblem
      { x: 5, y: 2, c: C.navy }, { x: 6, y: 2, c: C.navy }, { x: 7, y: 2, c: C.gold }, { x: 8, y: 2, c: C.gold }, { x: 9, y: 2, c: C.navy }, { x: 10, y: 2, c: C.navy },
      { x: 4, y: 3, c: C.navy }, { x: 5, y: 3, c: C.gold }, { x: 6, y: 3, c: C.gold }, { x: 7, y: 3, c: C.gold }, { x: 8, y: 3, c: C.gold }, { x: 9, y: 3, c: C.gold }, { x: 10, y: 3, c: C.gold }, { x: 11, y: 3, c: C.navy },
      { x: 3, y: 4, c: C.hairDark }, { x: 4, y: 4, c: C.hairDark }, { x: 5, y: 4, c: C.hairDark }, { x: 6, y: 4, c: C.hairDark }, { x: 7, y: 4, c: C.hairDark }, { x: 8, y: 4, c: C.hairDark }, { x: 9, y: 4, c: C.hairDark }, { x: 10, y: 4, c: C.hairDark }, { x: 11, y: 4, c: C.hairDark }, { x: 12, y: 4, c: C.hairDark },
      // Face
      { x: 5, y: 5, c: C.skinWarm }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.skinWarm }, { x: 8, y: 5, c: C.skinWarm }, { x: 9, y: 5, c: C.hairDark }, { x: 10, y: 5, c: C.skinWarm },
      { x: 4, y: 6, c: C.hairDark }, { x: 5, y: 6, c: C.skinWarm }, { x: 6, y: 6, c: C.skinWarm }, { x: 7, y: 6, c: C.skinWarm }, { x: 8, y: 6, c: C.skinWarm }, { x: 9, y: 6, c: C.skinWarm }, { x: 10, y: 6, c: C.skinWarm }, { x: 11, y: 6, c: C.hairDark },
      { x: 5, y: 7, c: C.skinWarm }, { x: 6, y: 7, c: C.skinWarm }, { x: 7, y: 7, c: C.hairDark }, { x: 8, y: 7, c: C.hairDark }, { x: 9, y: 7, c: C.skinWarm }, { x: 10, y: 7, c: C.skinWarm },
      { x: 6, y: 8, c: C.skinWarm }, { x: 7, y: 8, c: C.skinWarm }, { x: 8, y: 8, c: C.skinWarm }, { x: 9, y: 8, c: C.skinWarm },
      // Uniform collar with stars/ties
      { x: 4, y: 9, c: C.gold }, { x: 5, y: 9, c: C.navy }, { x: 6, y: 9, c: C.cream }, { x: 7, y: 9, c: C.navy }, { x: 8, y: 9, c: C.navy }, { x: 9, y: 9, c: C.cream }, { x: 10, y: 9, c: C.navy }, { x: 11, y: 9, c: C.gold },
      { x: 3, y: 10, c: C.navy }, { x: 4, y: 10, c: C.navy }, { x: 5, y: 10, c: C.navy }, { x: 6, y: 10, c: C.cream }, { x: 7, y: 10, c: C.gold }, { x: 8, y: 10, c: C.gold }, { x: 9, y: 10, c: C.cream }, { x: 10, y: 10, c: C.navy }, { x: 11, y: 10, c: C.navy }, { x: 12, y: 10, c: C.navy },
      { x: 2, y: 11, c: C.navy }, { x: 3, y: 11, c: C.navy }, { x: 4, y: 11, c: C.navy }, { x: 5, y: 11, c: C.navy }, { x: 6, y: 11, c: C.navy }, { x: 7, y: 11, c: C.gold }, { x: 8, y: 11, c: C.gold }, { x: 9, y: 11, c: C.navy }, { x: 10, y: 11, c: C.navy }, { x: 11, y: 11, c: C.navy }, { x: 12, y: 11, c: C.navy }, { x: 13, y: 11, c: C.navy },
    ],
  },
  {
    id: 'pixel-aspirant-f',
    name: 'The Aspirant',
    title: 'Dedicated Student',
    bg: '#8fc0a9',
    pixels: [
      // Ribbon / Hairband
      { x: 6, y: 1, c: C.red }, { x: 7, y: 1, c: C.red }, { x: 8, y: 1, c: C.red }, { x: 9, y: 1, c: C.red },
      // Hair
      { x: 5, y: 2, c: C.hairDark }, { x: 6, y: 2, c: C.hairDark }, { x: 7, y: 2, c: C.red }, { x: 8, y: 2, c: C.red }, { x: 9, y: 2, c: C.hairDark }, { x: 10, y: 2, c: C.hairDark },
      { x: 4, y: 3, c: C.hairDark }, { x: 5, y: 3, c: C.hairDark }, { x: 6, y: 3, c: C.hairDark }, { x: 7, y: 3, c: C.hairDark }, { x: 8, y: 3, c: C.hairDark }, { x: 9, y: 3, c: C.hairDark }, { x: 10, y: 3, c: C.hairDark }, { x: 11, y: 3, c: C.hairDark },
      // Face
      { x: 4, y: 4, c: C.hairDark }, { x: 5, y: 4, c: C.skinLight }, { x: 6, y: 4, c: C.skinLight }, { x: 7, y: 4, c: C.skinLight }, { x: 8, y: 4, c: C.skinLight }, { x: 9, y: 4, c: C.skinLight }, { x: 10, y: 4, c: C.skinLight }, { x: 11, y: 4, c: C.hairDark },
      { x: 4, y: 5, c: C.hairDark }, { x: 5, y: 5, c: C.skinLight }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.skinLight }, { x: 8, y: 5, c: C.skinLight }, { x: 9, y: 5, c: C.hairDark }, { x: 10, y: 5, c: C.skinLight }, { x: 11, y: 5, c: C.hairDark },
      { x: 4, y: 6, c: C.hairDark }, { x: 5, y: 6, c: C.skinLight }, { x: 6, y: 6, c: C.skinLight }, { x: 7, y: 6, c: C.skinLight }, { x: 8, y: 6, c: C.skinLight }, { x: 9, y: 6, c: C.skinLight }, { x: 10, y: 6, c: C.skinLight }, { x: 11, y: 6, c: C.hairDark },
      { x: 5, y: 7, c: C.skinLight }, { x: 6, y: 7, c: C.skinLight }, { x: 7, y: 7, c: C.red }, { x: 8, y: 7, c: C.red }, { x: 9, y: 7, c: C.skinLight }, { x: 10, y: 7, c: C.skinLight },
      { x: 6, y: 8, c: C.skinLight }, { x: 7, y: 8, c: C.skinLight }, { x: 8, y: 8, c: C.skinLight }, { x: 9, y: 8, c: C.skinLight },
      // Dress
      { x: 5, y: 9, c: C.teal }, { x: 6, y: 9, c: C.teal }, { x: 7, y: 9, c: C.skinLight }, { x: 8, y: 9, c: C.skinLight }, { x: 9, y: 9, c: C.teal }, { x: 10, y: 9, c: C.teal },
      { x: 4, y: 10, c: C.teal }, { x: 5, y: 10, c: C.teal }, { x: 6, y: 10, c: C.teal }, { x: 7, y: 10, c: C.gold }, { x: 8, y: 10, c: C.gold }, { x: 9, y: 10, c: C.teal }, { x: 10, y: 10, c: C.teal }, { x: 11, y: 10, c: C.teal },
      { x: 3, y: 11, c: C.teal }, { x: 4, y: 11, c: C.teal }, { x: 5, y: 11, c: C.teal }, { x: 6, y: 11, c: C.teal }, { x: 7, y: 11, c: C.gold }, { x: 8, y: 11, c: C.gold }, { x: 9, y: 11, c: C.teal }, { x: 10, y: 11, c: C.teal }, { x: 11, y: 11, c: C.teal }, { x: 12, y: 11, c: C.teal },
    ],
  },
  {
    id: 'pixel-aspirant-m',
    name: 'The Achiever',
    title: 'Career Focused',
    bg: '#114b5f',
    pixels: [
      // Spiky modern hair
      { x: 6, y: 1, c: C.hairBrown }, { x: 7, y: 1, c: C.hairBrown }, { x: 9, y: 1, c: C.hairBrown },
      { x: 5, y: 2, c: C.hairBrown }, { x: 6, y: 2, c: C.hairBrown }, { x: 7, y: 2, c: C.hairBrown }, { x: 8, y: 2, c: C.hairBrown }, { x: 9, y: 2, c: C.hairBrown }, { x: 10, y: 2, c: C.hairBrown },
      { x: 4, y: 3, c: C.hairBrown }, { x: 5, y: 3, c: C.hairBrown }, { x: 6, y: 3, c: C.hairBrown }, { x: 7, y: 3, c: C.hairBrown }, { x: 8, y: 3, c: C.hairBrown }, { x: 9, y: 3, c: C.hairBrown }, { x: 10, y: 3, c: C.hairBrown }, { x: 11, y: 3, c: C.hairBrown },
      // Face
      { x: 4, y: 4, c: C.hairBrown }, { x: 5, y: 4, c: C.skinLight }, { x: 6, y: 4, c: C.skinLight }, { x: 7, y: 4, c: C.skinLight }, { x: 8, y: 4, c: C.skinLight }, { x: 9, y: 4, c: C.skinLight }, { x: 10, y: 4, c: C.skinLight }, { x: 11, y: 4, c: C.hairBrown },
      { x: 4, y: 5, c: C.hairBrown }, { x: 5, y: 5, c: C.skinLight }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.skinLight }, { x: 8, y: 5, c: C.skinLight }, { x: 9, y: 5, c: C.hairDark }, { x: 10, y: 5, c: C.skinLight }, { x: 11, y: 5, c: C.hairBrown },
      { x: 5, y: 6, c: C.skinLight }, { x: 6, y: 6, c: C.skinLight }, { x: 7, y: 6, c: C.skinLight }, { x: 8, y: 6, c: C.skinLight }, { x: 9, y: 6, c: C.skinLight }, { x: 10, y: 6, c: C.skinLight },
      { x: 5, y: 7, c: C.skinLight }, { x: 6, y: 7, c: C.skinLight }, { x: 7, y: 7, c: C.red }, { x: 8, y: 7, c: C.red }, { x: 9, y: 7, c: C.skinLight }, { x: 10, y: 7, c: C.skinLight },
      { x: 6, y: 8, c: C.skinLight }, { x: 7, y: 8, c: C.skinLight }, { x: 8, y: 8, c: C.skinLight }, { x: 9, y: 8, c: C.skinLight },
      // Smart Blazer & Shirt
      { x: 4, y: 9, c: C.sea }, { x: 5, y: 9, c: C.sea }, { x: 6, y: 9, c: C.cream }, { x: 7, y: 9, c: C.skinLight }, { x: 8, y: 9, c: C.skinLight }, { x: 9, y: 9, c: C.cream }, { x: 10, y: 9, c: C.sea }, { x: 11, y: 9, c: C.sea },
      { x: 3, y: 10, c: C.sea }, { x: 4, y: 10, c: C.sea }, { x: 5, y: 10, c: C.sea }, { x: 6, y: 10, c: C.cream }, { x: 7, y: 10, c: C.blue }, { x: 8, y: 10, c: C.blue }, { x: 9, y: 10, c: C.cream }, { x: 10, y: 10, c: C.sea }, { x: 11, y: 10, c: C.sea }, { x: 12, y: 10, c: C.sea },
      { x: 3, y: 11, c: C.sea }, { x: 4, y: 11, c: C.sea }, { x: 5, y: 11, c: C.sea }, { x: 6, y: 11, c: C.blue }, { x: 7, y: 11, c: C.blue }, { x: 8, y: 11, c: C.blue }, { x: 9, y: 11, c: C.blue }, { x: 10, y: 11, c: C.sea }, { x: 11, y: 11, c: C.sea }, { x: 12, y: 11, c: C.sea },
    ],
  },
  {
    id: 'pixel-scientist',
    name: 'The Scientist',
    title: 'Research & Labs',
    bg: '#028090',
    pixels: [
      // Lab Goggles on Forehead
      { x: 5, y: 1, c: C.glasses }, { x: 6, y: 1, c: C.glasses }, { x: 7, y: 1, c: C.cream }, { x: 8, y: 1, c: C.cream }, { x: 9, y: 1, c: C.glasses }, { x: 10, y: 1, c: C.glasses },
      { x: 4, y: 2, c: C.hairGold }, { x: 5, y: 2, c: C.glasses }, { x: 6, y: 2, c: C.glasses }, { x: 7, y: 2, c: C.hairDark }, { x: 8, y: 2, c: C.hairDark }, { x: 9, y: 2, c: C.glasses }, { x: 10, y: 2, c: C.glasses }, { x: 11, y: 2, c: C.hairGold },
      // Hair & Face
      { x: 4, y: 3, c: C.hairGold }, { x: 5, y: 3, c: C.hairGold }, { x: 6, y: 3, c: C.hairGold }, { x: 7, y: 3, c: C.hairGold }, { x: 8, y: 3, c: C.hairGold }, { x: 9, y: 3, c: C.hairGold }, { x: 10, y: 3, c: C.hairGold }, { x: 11, y: 3, c: C.hairGold },
      { x: 4, y: 4, c: C.hairGold }, { x: 5, y: 4, c: C.skinLight }, { x: 6, y: 4, c: C.skinLight }, { x: 7, y: 4, c: C.skinLight }, { x: 8, y: 4, c: C.skinLight }, { x: 9, y: 4, c: C.skinLight }, { x: 10, y: 4, c: C.skinLight }, { x: 11, y: 4, c: C.hairGold },
      { x: 4, y: 5, c: C.hairGold }, { x: 5, y: 5, c: C.skinLight }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.skinLight }, { x: 8, y: 5, c: C.skinLight }, { x: 9, y: 5, c: C.hairDark }, { x: 10, y: 5, c: C.skinLight }, { x: 11, y: 5, c: C.hairGold },
      { x: 5, y: 6, c: C.skinLight }, { x: 6, y: 6, c: C.skinLight }, { x: 7, y: 6, c: C.skinLight }, { x: 8, y: 6, c: C.skinLight }, { x: 9, y: 6, c: C.skinLight }, { x: 10, y: 6, c: C.skinLight },
      { x: 5, y: 7, c: C.skinLight }, { x: 6, y: 7, c: C.skinLight }, { x: 7, y: 7, c: C.red }, { x: 8, y: 7, c: C.red }, { x: 9, y: 7, c: C.skinLight }, { x: 10, y: 7, c: C.skinLight },
      { x: 6, y: 8, c: C.skinLight }, { x: 7, y: 8, c: C.skinLight }, { x: 8, y: 8, c: C.skinLight }, { x: 9, y: 8, c: C.skinLight },
      // White Lab Coat & Tie
      { x: 4, y: 9, c: C.cream }, { x: 5, y: 9, c: C.cream }, { x: 6, y: 9, c: C.cream }, { x: 7, y: 9, c: C.celadon }, { x: 8, y: 9, c: C.celadon }, { x: 9, y: 9, c: C.cream }, { x: 10, y: 9, c: C.cream }, { x: 11, y: 9, c: C.cream },
      { x: 3, y: 10, c: C.cream }, { x: 4, y: 10, c: C.cream }, { x: 5, y: 10, c: C.cream }, { x: 6, y: 10, c: C.cream }, { x: 7, y: 10, c: C.celadon }, { x: 8, y: 10, c: C.celadon }, { x: 9, y: 10, c: C.cream }, { x: 10, y: 10, c: C.cream }, { x: 11, y: 10, c: C.cream }, { x: 12, y: 10, c: C.cream },
      { x: 3, y: 11, c: C.cream }, { x: 4, y: 11, c: C.cream }, { x: 5, y: 11, c: C.cream }, { x: 6, y: 11, c: C.cream }, { x: 7, y: 11, c: C.teal }, { x: 8, y: 11, c: C.teal }, { x: 9, y: 11, c: C.cream }, { x: 10, y: 11, c: C.cream }, { x: 11, y: 11, c: C.cream }, { x: 12, y: 11, c: C.cream },
    ],
  },
  {
    id: 'pixel-explorer',
    name: 'The Explorer',
    title: 'Field & Forest Services',
    bg: '#588157',
    pixels: [
      // Field Hat / Boonie
      { x: 3, y: 2, c: C.green }, { x: 4, y: 2, c: C.green }, { x: 5, y: 2, c: C.green }, { x: 6, y: 2, c: C.green }, { x: 7, y: 2, c: C.green }, { x: 8, y: 2, c: C.green }, { x: 9, y: 2, c: C.green }, { x: 10, y: 2, c: C.green }, { x: 11, y: 2, c: C.green }, { x: 12, y: 2, c: C.green },
      { x: 2, y: 3, c: C.green }, { x: 3, y: 3, c: C.green }, { x: 4, y: 3, c: C.gold }, { x: 5, y: 3, c: C.gold }, { x: 6, y: 3, c: C.gold }, { x: 7, y: 3, c: C.gold }, { x: 8, y: 3, c: C.gold }, { x: 9, y: 3, c: C.gold }, { x: 10, y: 3, c: C.gold }, { x: 11, y: 3, c: C.gold }, { x: 12, y: 3, c: C.green }, { x: 13, y: 3, c: C.green },
      // Face
      { x: 4, y: 4, c: C.hairBrown }, { x: 5, y: 4, c: C.skinWarm }, { x: 6, y: 4, c: C.skinWarm }, { x: 7, y: 4, c: C.skinWarm }, { x: 8, y: 4, c: C.skinWarm }, { x: 9, y: 4, c: C.skinWarm }, { x: 10, y: 4, c: C.skinWarm }, { x: 11, y: 4, c: C.hairBrown },
      { x: 4, y: 5, c: C.hairBrown }, { x: 5, y: 5, c: C.skinWarm }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.skinWarm }, { x: 8, y: 5, c: C.skinWarm }, { x: 9, y: 5, c: C.hairDark }, { x: 10, y: 5, c: C.skinWarm }, { x: 11, y: 4, c: C.hairBrown },
      { x: 5, y: 6, c: C.skinWarm }, { x: 6, y: 6, c: C.skinWarm }, { x: 7, y: 6, c: C.skinWarm }, { x: 8, y: 6, c: C.skinWarm }, { x: 9, y: 6, c: C.skinWarm }, { x: 10, y: 6, c: C.skinWarm },
      { x: 5, y: 7, c: C.skinWarm }, { x: 6, y: 7, c: C.skinWarm }, { x: 7, y: 7, c: C.red }, { x: 8, y: 7, c: C.red }, { x: 9, y: 7, c: C.skinWarm }, { x: 10, y: 7, c: C.skinWarm },
      { x: 6, y: 8, c: C.skinWarm }, { x: 7, y: 8, c: C.skinWarm }, { x: 8, y: 8, c: C.skinWarm }, { x: 9, y: 8, c: C.skinWarm },
      // Field Jacket
      { x: 4, y: 9, c: C.green }, { x: 5, y: 9, c: C.green }, { x: 6, y: 9, c: C.tea }, { x: 7, y: 9, c: C.skinWarm }, { x: 8, y: 9, c: C.skinWarm }, { x: 9, y: 9, c: C.tea }, { x: 10, y: 9, c: C.green }, { x: 11, y: 9, c: C.green },
      { x: 3, y: 10, c: C.green }, { x: 4, y: 10, c: C.green }, { x: 5, y: 10, c: C.green }, { x: 6, y: 10, c: C.tea }, { x: 7, y: 10, c: C.gold }, { x: 8, y: 10, c: C.gold }, { x: 9, y: 10, c: C.tea }, { x: 10, y: 10, c: C.green }, { x: 11, y: 10, c: C.green }, { x: 12, y: 10, c: C.green },
      { x: 3, y: 11, c: C.green }, { x: 4, y: 11, c: C.green }, { x: 5, y: 11, c: C.green }, { x: 6, y: 11, c: C.green }, { x: 7, y: 11, c: C.gold }, { x: 8, y: 11, c: C.gold }, { x: 9, y: 11, c: C.green }, { x: 10, y: 11, c: C.green }, { x: 11, y: 11, c: C.green }, { x: 12, y: 11, c: C.green },
    ],
  },
  {
    id: 'pixel-cadet',
    name: 'The Cadet',
    title: 'Defence & Police Wings',
    bg: '#114b5f',
    pixels: [
      // Maroon Beret tilted
      { x: 4, y: 2, c: C.red }, { x: 5, y: 2, c: C.red }, { x: 6, y: 2, c: C.red }, { x: 7, y: 2, c: C.red }, { x: 8, y: 2, c: C.red }, { x: 9, y: 2, c: C.red },
      { x: 3, y: 3, c: C.red }, { x: 4, y: 3, c: C.red }, { x: 5, y: 3, c: C.gold }, { x: 6, y: 3, c: C.red }, { x: 7, y: 3, c: C.red }, { x: 8, y: 3, c: C.red }, { x: 9, y: 3, c: C.red }, { x: 10, y: 3, c: C.red }, { x: 11, y: 3, c: C.red },
      // Face
      { x: 4, y: 4, c: C.hairDark }, { x: 5, y: 4, c: C.skinWarm }, { x: 6, y: 4, c: C.skinWarm }, { x: 7, y: 4, c: C.skinWarm }, { x: 8, y: 4, c: C.skinWarm }, { x: 9, y: 4, c: C.skinWarm }, { x: 10, y: 4, c: C.skinWarm }, { x: 11, y: 4, c: C.hairDark },
      { x: 4, y: 5, c: C.hairDark }, { x: 5, y: 5, c: C.skinWarm }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.skinWarm }, { x: 8, y: 5, c: C.skinWarm }, { x: 9, y: 5, c: C.hairDark }, { x: 10, y: 5, c: C.skinWarm }, { x: 11, y: 5, c: C.hairDark },
      { x: 5, y: 6, c: C.skinWarm }, { x: 6, y: 6, c: C.skinWarm }, { x: 7, y: 6, c: C.skinWarm }, { x: 8, y: 6, c: C.skinWarm }, { x: 9, y: 6, c: C.skinWarm }, { x: 10, y: 6, c: C.skinWarm },
      { x: 5, y: 7, c: C.skinWarm }, { x: 6, y: 7, c: C.skinWarm }, { x: 7, y: 7, c: C.red }, { x: 8, y: 7, c: C.red }, { x: 9, y: 7, c: C.skinWarm }, { x: 10, y: 7, c: C.skinWarm },
      { x: 6, y: 8, c: C.skinWarm }, { x: 7, y: 8, c: C.skinWarm }, { x: 8, y: 8, c: C.skinWarm }, { x: 9, y: 8, c: C.skinWarm },
      // Khaki / Olive Uniform
      { x: 4, y: 9, c: C.tea }, { x: 5, y: 9, c: C.tea }, { x: 6, y: 9, c: C.tea }, { x: 7, y: 9, c: C.skinWarm }, { x: 8, y: 9, c: C.skinWarm }, { x: 9, y: 9, c: C.tea }, { x: 10, y: 9, c: C.tea }, { x: 11, y: 9, c: C.tea },
      { x: 3, y: 10, c: C.tea }, { x: 4, y: 10, c: C.tea }, { x: 5, y: 10, c: C.gold }, { x: 6, y: 10, c: C.tea }, { x: 7, y: 10, c: C.tea }, { x: 8, y: 10, c: C.tea }, { x: 9, y: 10, c: C.tea }, { x: 10, y: 10, c: C.gold }, { x: 11, y: 10, c: C.tea }, { x: 12, y: 10, c: C.tea },
      { x: 3, y: 11, c: C.tea }, { x: 4, y: 11, c: C.tea }, { x: 5, y: 11, c: C.tea }, { x: 6, y: 11, c: C.tea }, { x: 7, y: 11, c: C.tea }, { x: 8, y: 11, c: C.tea }, { x: 9, y: 11, c: C.tea }, { x: 10, y: 11, c: C.tea }, { x: 11, y: 11, c: C.tea }, { x: 12, y: 11, c: C.tea },
    ],
  },
  {
    id: 'pixel-innovator',
    name: 'The Innovator',
    title: 'Creative & Strategy',
    bg: '#028090',
    pixels: [
      // Cool Violet / Aqua Beanie
      { x: 5, y: 1, c: C.blue }, { x: 6, y: 1, c: C.blue }, { x: 7, y: 1, c: C.blue }, { x: 8, y: 1, c: C.blue }, { x: 9, y: 1, c: C.blue }, { x: 10, y: 1, c: C.blue },
      { x: 4, y: 2, c: C.blue }, { x: 5, y: 2, c: C.blue }, { x: 6, y: 2, c: C.blue }, { x: 7, y: 2, c: C.blue }, { x: 8, y: 2, c: C.blue }, { x: 9, y: 2, c: C.blue }, { x: 10, y: 2, c: C.blue }, { x: 11, y: 2, c: C.blue },
      { x: 4, y: 3, c: C.hairDark }, { x: 5, y: 3, c: C.hairDark }, { x: 6, y: 3, c: C.blue }, { x: 7, y: 3, c: C.blue }, { x: 8, y: 3, c: C.blue }, { x: 9, y: 3, c: C.blue }, { x: 10, y: 3, c: C.hairDark }, { x: 11, y: 3, c: C.hairDark },
      // Face with glasses
      { x: 4, y: 4, c: C.hairDark }, { x: 5, y: 4, c: C.skinLight }, { x: 6, y: 4, c: C.skinLight }, { x: 7, y: 4, c: C.skinLight }, { x: 8, y: 4, c: C.skinLight }, { x: 9, y: 4, c: C.skinLight }, { x: 10, y: 4, c: C.skinLight }, { x: 11, y: 4, c: C.hairDark },
      { x: 4, y: 5, c: C.glasses }, { x: 5, y: 5, c: C.glasses }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.glasses }, { x: 8, y: 5, c: C.glasses }, { x: 9, y: 5, c: C.hairDark }, { x: 10, y: 5, c: C.glasses }, { x: 11, y: 5, c: C.glasses },
      { x: 5, y: 6, c: C.skinLight }, { x: 6, y: 6, c: C.skinLight }, { x: 7, y: 6, c: C.skinLight }, { x: 8, y: 6, c: C.skinLight }, { x: 9, y: 6, c: C.skinLight }, { x: 10, y: 6, c: C.skinLight },
      { x: 5, y: 7, c: C.skinLight }, { x: 6, y: 7, c: C.skinLight }, { x: 7, y: 7, c: C.red }, { x: 8, y: 7, c: C.red }, { x: 9, y: 7, c: C.skinLight }, { x: 10, y: 7, c: C.skinLight },
      { x: 6, y: 8, c: C.skinLight }, { x: 7, y: 8, c: C.skinLight }, { x: 8, y: 8, c: C.skinLight }, { x: 9, y: 8, c: C.skinLight },
      // Jacket
      { x: 4, y: 9, c: C.teal }, { x: 5, y: 9, c: C.teal }, { x: 6, y: 9, c: C.gold }, { x: 7, y: 9, c: C.skinLight }, { x: 8, y: 9, c: C.skinLight }, { x: 9, y: 9, c: C.gold }, { x: 10, y: 9, c: C.teal }, { x: 11, y: 9, c: C.teal },
      { x: 3, y: 10, c: C.teal }, { x: 4, y: 10, c: C.teal }, { x: 5, y: 10, c: C.teal }, { x: 6, y: 10, c: C.gold }, { x: 7, y: 10, c: C.gold }, { x: 8, y: 10, c: C.gold }, { x: 9, y: 10, c: C.gold }, { x: 10, y: 10, c: C.teal }, { x: 11, y: 10, c: C.teal }, { x: 12, y: 10, c: C.teal },
      { x: 3, y: 11, c: C.teal }, { x: 4, y: 11, c: C.teal }, { x: 5, y: 11, c: C.teal }, { x: 6, y: 11, c: C.teal }, { x: 7, y: 11, c: C.cream }, { x: 8, y: 11, c: C.cream }, { x: 9, y: 11, c: C.teal }, { x: 10, y: 11, c: C.teal }, { x: 11, y: 11, c: C.teal }, { x: 12, y: 11, c: C.teal },
    ],
  },
  {
    id: 'pixel-leader',
    name: 'The Leader',
    title: 'Inspiration & Vision',
    bg: '#114b5f',
    pixels: [
      // Golden Crown
      { x: 5, y: 1, c: C.gold }, { x: 7, y: 1, c: C.gold }, { x: 8, y: 1, c: C.gold }, { x: 10, y: 1, c: C.gold },
      { x: 4, y: 2, c: C.gold }, { x: 5, y: 2, c: C.red }, { x: 6, y: 2, c: C.gold }, { x: 7, y: 2, c: C.gold }, { x: 8, y: 2, c: C.gold }, { x: 9, y: 2, c: C.gold }, { x: 10, y: 2, c: C.red }, { x: 11, y: 2, c: C.gold },
      { x: 4, y: 3, c: C.gold }, { x: 5, y: 3, c: C.gold }, { x: 6, y: 3, c: C.gold }, { x: 7, y: 3, c: C.gold }, { x: 8, y: 3, c: C.gold }, { x: 9, y: 3, c: C.gold }, { x: 10, y: 3, c: C.gold }, { x: 11, y: 3, c: C.gold },
      // Hair & Face
      { x: 4, y: 4, c: C.hairAuburn }, { x: 5, y: 4, c: C.skinLight }, { x: 6, y: 4, c: C.skinLight }, { x: 7, y: 4, c: C.skinLight }, { x: 8, y: 4, c: C.skinLight }, { x: 9, y: 4, c: C.skinLight }, { x: 10, y: 4, c: C.skinLight }, { x: 11, y: 4, c: C.hairAuburn },
      { x: 4, y: 5, c: C.hairAuburn }, { x: 5, y: 5, c: C.skinLight }, { x: 6, y: 5, c: C.hairDark }, { x: 7, y: 5, c: C.skinLight }, { x: 8, y: 5, c: C.skinLight }, { x: 9, y: 5, c: C.hairDark }, { x: 10, y: 5, c: C.skinLight }, { x: 11, y: 5, c: C.hairAuburn },
      { x: 5, y: 6, c: C.skinLight }, { x: 6, y: 6, c: C.skinLight }, { x: 7, y: 6, c: C.skinLight }, { x: 8, y: 6, c: C.skinLight }, { x: 9, y: 6, c: C.skinLight }, { x: 10, y: 6, c: C.skinLight },
      { x: 5, y: 7, c: C.skinLight }, { x: 6, y: 7, c: C.skinLight }, { x: 7, y: 7, c: C.red }, { x: 8, y: 7, c: C.red }, { x: 9, y: 7, c: C.skinLight }, { x: 10, y: 7, c: C.skinLight },
      { x: 6, y: 8, c: C.skinLight }, { x: 7, y: 8, c: C.skinLight }, { x: 8, y: 8, c: C.skinLight }, { x: 9, y: 8, c: C.skinLight },
      // Royal Cape & Jewel
      { x: 4, y: 9, c: C.navy }, { x: 5, y: 9, c: C.navy }, { x: 6, y: 9, c: C.gold }, { x: 7, y: 9, c: C.red }, { x: 8, y: 9, c: C.red }, { x: 9, y: 9, c: C.gold }, { x: 10, y: 9, c: C.navy }, { x: 11, y: 9, c: C.navy },
      { x: 3, y: 10, c: C.navy }, { x: 4, y: 10, c: C.navy }, { x: 5, y: 10, c: C.navy }, { x: 6, y: 10, c: C.cream }, { x: 7, y: 10, c: C.red }, { x: 8, y: 10, c: C.red }, { x: 9, y: 10, c: C.cream }, { x: 10, y: 10, c: C.navy }, { x: 11, y: 10, c: C.navy }, { x: 12, y: 10, c: C.navy },
      { x: 3, y: 11, c: C.navy }, { x: 4, y: 11, c: C.navy }, { x: 5, y: 11, c: C.navy }, { x: 6, y: 11, c: C.gold }, { x: 7, y: 11, c: C.gold }, { x: 8, y: 11, c: C.gold }, { x: 9, y: 11, c: C.gold }, { x: 10, y: 11, c: C.navy }, { x: 11, y: 11, c: C.navy }, { x: 12, y: 11, c: C.navy },
    ],
  },
];

export function PixelAvatar({
  avatarId,
  size = 64,
  className = '',
}: {
  avatarId?: string | null;
  size?: number;
  className?: string;
}) {
  const avatar = PIXEL_AVATARS.find((a) => a.id === avatarId) ?? PIXEL_AVATARS[0];

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`rounded-2xl shadow-xs overflow-hidden ${className}`}
      style={{ backgroundColor: avatar.bg }}
    >
      {avatar.pixels.map((p, idx) => (
        <rect key={idx} x={p.x} y={p.y} width={1} height={1} fill={p.c} />
      ))}
    </svg>
  );
}
