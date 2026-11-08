export type Project = {
  id: string;
  organizationId: string;
  name: string;
  targetUrl: string;
  createdAt: Date;
};

export type ProjectSummary = Project & {
  repositoryCount: number;
  runCount: number;
  lastRunStatus: string | null;
  lastRunAt: Date | null;
};
