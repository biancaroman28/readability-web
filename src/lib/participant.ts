export type Letter = 'A' | 'B' | 'C' | 'D';
type Attribution = { author: string; title: string; year: string };
export type Step =
  | { pas: number; tip: 'pereche'; fragmentA: string; fragmentB: string; attributionA: Attribution | null; attributionB: Attribution | null }
  | { pas: number; tip: 'grila'; question: string; options: { letter: Letter; text: string }[] };

export type Session = { enrolled: false } | { enrolled: true; step: Step | null; total: number };

