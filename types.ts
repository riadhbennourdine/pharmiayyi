export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  MEMO_FICHE = 'MEMO_FICHE',
  GENERATOR = 'GENERATOR',
  QUIZ = 'QUIZ',
  EDIT_MEMO_FICHE = 'EDIT_MEMO_FICHE',
}

export enum UserRole {
  PREPARATEUR = 'PREPARATEUR',
  PHARMACIEN = 'PHARMACIEN',
  FORMATEUR = 'FORMATEUR',
  ADMIN = 'ADMIN',
}

import { ObjectId } from 'mongodb'; // Add this import

export interface User {
  _id?: ObjectId; // Change to ObjectId
  email: string;
  password?: string; // Only for registration/login, not stored
  passwordHash?: string; // Stored in DB
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
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
  _id: any;
  title: string;
  theme: string;
  system: string;
  patientSituation: string;
  keyQuestions: string[];
  pathologyOverview: string;
  redFlags: string[];
  recommendations: {
    mainTreatment: string[];
    associatedProducts: string[];
    lifestyleAdvice: string[];
    dietaryAdvice: string[];
  };
  keyPoints: string[];
  references: string[];
  flashcards: { question: string; answer: string; }[];
  glossary: { term: string; definition: string; }[];
  media: {
    type: 'video' | 'podcast' | 'infographic' | string;
    title: string;
    url: string;
  }[];
  quiz: any[];
  coverImageUrl?: string;
  creationDate: string;
  level?: string;
  shortDescription?: string;
  kahootUrl?: string;
  sourceText?: string; // Nouveau champ pour le texte source complet
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}