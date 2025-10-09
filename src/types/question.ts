export interface Transform {
  type: "translate" | "rotate" | "scale";
  params: number[];
}

export interface QuestionVariant {
  shape: string;
  frame: string;
  sequence: Transform[];
  numInstances?: number; // For Q6: number of drawOne() calls
}

export interface Question {
  questionId: string;
  seed: string;
  type: string;
  tier: number;
  family: string;
  variant: QuestionVariant;
  options: Transform[][];
  correctIndex: number;
}

export interface GenerateRequest {
  examKey: string;
  studentId: string;
  type: string;
  tier: number;
  slot: number;
}
