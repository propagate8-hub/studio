export interface Institution {
  school_id: string;
  name: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  contact_email: string;
}

export type UserRole = 'Admin' | 'Student' | 'Teacher' | 'Parent' | 'B2C';

export interface User {
  user_id: string;
  school_id?: string; // Nullable for B2C users
  role: UserRole;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface IdentityRecord {
  identity_id: string;
  user_id: string;
  rfid_tag?: string;
  biometric_hash?: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    answer: string;
    aptitude_category: 'Verbal' | 'Numerical' | 'Spatial' | 'Abstract';
    difficulty_level: number; // 1 to 5
}

export interface Assessment {
  assessment_id: string;
  title: string;
  type: 'ACET' | 'Academic';
  is_offline_enabled: boolean;
  questions?: Question[];
}

export interface AssessmentLog {
  log_id: string;
  user_id: string;
  assessment_id: string;
  scores: Record<string, number>;
  sync_status: 'pending' | 'synced';
  payment_status: 'paid' | 'n/a';
  completedAt: Date;
}

export interface Survey {
  survey_id: string;
  school_id: string;
  title: string;
  target_role: 'Teacher Eval' | 'School Climate';
  questions: any[]; // JSON-based questions
}

export type EvaluatorRole = 'Parent' | 'Student' | 'Teacher';

export interface SurveyResponse {
  response_id: string;
  survey_id: string;
  evaluator_role: EvaluatorRole;
  json_answers: string; // JSON string of answers
  submittedBy: string; // user_id
  submittedAt: Date;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  gateway_reference: string;
  date: Date;
}

export interface UploadTask {
    task_id: string;
    school_id: string;
    fileName: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
    userId: string;
}
