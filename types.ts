export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  MEMO_FICHE = 'MEMO_FICHE',
  GENERATOR = 'GENERATOR',
  QUIZ = 'QUIZ',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  type: 'single-choice' | 'true-false';
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface MediaSuggestion {
  title: string;
  description: string;
  type: 'video' | 'infographic';
}

export interface CaseStudy {
  title: string;
  theme: string;
  system: string;
  patientSituation: string;
  pathologyOverview: string;
  keyQuestions: string[];
  recommendations: {
    mainTreatment: string[];
    associatedProducts: string[];
    lifestyleAdvice: string[];
    dietaryAdvice: string[];
  };
  redFlags: string[];
  keyPoints: string[];
  references: string[];
  flashcards: Flashcard[];
  glossary: GlossaryTerm[];
  media: MediaSuggestion[];
  quiz: QuizQuestion[];
  coverImageUrl?: string;
  youtubeUrl?: string;
  creationDate?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}