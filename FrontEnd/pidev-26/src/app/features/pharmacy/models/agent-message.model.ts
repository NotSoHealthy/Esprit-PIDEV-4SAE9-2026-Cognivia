export interface AgentMessage {
  id: number;
  medicationId: number;
  content: string;
  actionType: 'DELETE' | 'PATCH_AND_ACCEPT' | 'ACCEPT' | 'REVIEW_REQUIRED';
  createdAt: string;
  rawAnalysisData?: string;
}
