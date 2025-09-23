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
  username?: string; // New field
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  password?: string; // Only for registration/login, not stored
  passwordHash?: string; // Stored in DB
  role: UserRole;
  pharmacistId?: ObjectId | null; // New field, allow null for unassigned preparateurs
  createdAt?: Date;
  updatedAt?: Date;
  resetPasswordToken?: string; // New field
  resetPasswordExpires?: Date; // New field
  readFicheIds?: string[]; // Add this
  viewedMediaIds?: string[]; // Add this
  quizHistory?: { quizId: string; score: number; completedAt: Date }[]; // Add this
  hasActiveSubscription?: boolean;
  subscriptionEndDate?: Date;
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

export interface Treatment {
  medicament: string;
  posologie: string;
  duree: string;
  conseil_dispensation: string;
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
    mainTreatment: Treatment[];
    associatedProducts: Treatment[];
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
  youtubeUrl?: string; // Add this
  knowledgeBaseUrl?: string; // New field for Google Doc URL
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface PharmacologyMemoFiche {
  _id: any;
  title: string;
  theme: string;
  pathology: string;
  pathologyOverview: string;
  introduction: string;
  pharmacologicalClasses: {
    className: string;
    mechanismOfAction: string;
    differentialAdvantages: string;
    roleOfDiet: string;
    drugs: {
      name: string;
      dosages: string;
      precautionsForUse: string;
    }[];
  }[];
  summaryTable: {
    headers: string[];
    rows: string[][];
  };
  keyPoints: string[];
  glossary: {
    term: string;
    definition: string;
  }[];
  media: {
    type: string;
    title: string;
    url: string;
  }[];
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  creationDate: string;
  coverImageUrl?: string;
  youtubeUrl?: string;
}

export interface ExhaustiveMemoFiche {
  _id: any;
  title: string;
  targetAudience: string;
  objectives: string[];
  introductionToPathology: {
    title: string;
    definitionAndDiagnosis: string;
    prevalenceAndImportance: string;
    riskFactorsAndCauses: string;
    complications: string;
    treatmentGoals: string;
    lifestyleMeasures: string;
  };
  drugClasses: {
    title: string;
    generalPrinciples: string;
    classes: {
      name: string;
      examples: string;
      mechanismOfAction: string;
      mainSideEffects: string;
      patientAdvice: string;
      contraindications: string;
      drugInteractions: string;
    }[];
  };
  dispensingAndCounseling: {
    title: string;
    essentialDispensingAdvice: {
      title: string;
      medicationExplanation: string;
      lifestyleReminder: string;
      monitoringAndSelfMeasurement: string;
      intercurrentEventManagement: string;
    };
    additionalSalesAndServices: {
      title: string;
      products: string[];
      services: string[];
    };
    pharmacistRoleValorization: {
      title: string;
      medicationExpertise: string;
      patientEducation: string;
      interprofessionalCollaboration: string;
    };
  };
  conclusion: string;
  glossary: {
    term: string;
    definition: string;
  }[];
  media: {
    type: string;
    title: string;
    url: string;
  }[];
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  creationDate: string;
  coverImageUrl?: string;
  youtubeUrl?: string;
}

export type MemoFiche = CaseStudy | PharmacologyMemoFiche | ExhaustiveMemoFiche;