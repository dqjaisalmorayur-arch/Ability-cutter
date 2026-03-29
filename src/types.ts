export type Language = 'en' | 'ml' | 'hi' | 'ta' | 'kn' | 'te';
export type ScreenReader = 'nvda' | 'jaws' | 'narrator';

export interface Lesson {
  id: string;
  title: {
    [key in Language]?: string;
  };
  content: {
    [key in Language]?: string;
  };
  videoUrl?: string;
  audioUrl?: string;
}

export interface Question {
  id: string;
  text: {
    [key in Language]?: string;
  };
  options: {
    [key in Language]?: string[];
  };
  correctIndex: number;
}

export interface Module {
  id: string;
  category: string;
  level: 'basic' | 'advanced';
  title: {
    [key in Language]?: string;
  };
  description: {
    [key in Language]?: string;
  };
  lessons: Lesson[];
  quiz: Question[];
  order: number;
  imageUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'admin' | 'student';
  age?: number;
  phone?: string;
  preferredLanguage: Language;
  preferredScreenReader?: ScreenReader;
}

export interface UserProgress {
  id?: string;
  userId: string;
  moduleId: string;
  completedLessons: string[];
  quizCompleted: boolean;
  quizScore?: number;
  lastUpdated: string;
}

export interface QuizResult {
  id?: string;
  studentName: string;
  studentEmail: string;
  moduleTitle: string;
  score: number;
  total: number;
  timestamp: string;
}
