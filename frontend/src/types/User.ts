// types/user.ts
export interface GoalMilestone {
  _id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Goal {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "paused";
  progress: number;
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  title: string;
  achievedAt: string;
  relatedGoalId?: string;
}

export interface PersonalityScores {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number;
}

export interface PersonalityHistory {
  date: string;
  scores: PersonalityScores;
}

export interface Personality {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number;
  updatedAt: string;
  history: PersonalityHistory[];
}


export interface Growth {
  journalStreak: number;
  milestoneCount: number;
  personalityGrowth: number;
}

export interface Subscription {
  tier: "free" | "pro" | "premium";
  status: "active" | "cancelled" | "expired";
  startDate?: string;
  endDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  dob: string;
  gender: string;
  occupation: string;
  avatar?: string;
  goals: Goal[];
  milestones: Milestone[];
  personality: Personality;
  growth: Growth;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}
