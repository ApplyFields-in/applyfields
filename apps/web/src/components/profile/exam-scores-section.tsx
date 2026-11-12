'use client';

import React from 'react';
import {
  CompetitiveExamScoresCard,
  type CompetitiveExamScore,
} from './competitive-exam-scores-card';

interface ExamScoresSectionProps {
  onScoresChange?: (scores: CompetitiveExamScore[]) => void;
}

export function ExamScoresSection({ onScoresChange }: ExamScoresSectionProps) {
  return (
    <div id="exam-scores-section">
      <CompetitiveExamScoresCard onScoresChange={onScoresChange} />
    </div>
  );
}
