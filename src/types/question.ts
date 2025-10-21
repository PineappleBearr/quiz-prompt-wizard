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
  type: "transform_mcq" | "code_picture" | "stack_reasoning" | "code_input" | "ray_sphere";
  tier: number;
  family: string;
  variant: QuestionVariant;
  options: Transform[][];
  correctIndex: number;
  targetSequence?: Transform[]; // For Q7: the correct answer sequence
  raySphereData?: import('./raySphereTypes').RaySphereQuestionData; // For ray-sphere questions
}

export interface GenerateRequest {
  examKey: string;
  studentId: string;
  type: string;
  tier: number;
  slot: number;
}
