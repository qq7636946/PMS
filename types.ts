
export enum Status {
  TODO = '待辦事項',
  IN_PROGRESS = '進行中',
  REVIEW = '審核中',
  DONE = '已完成'
}

export enum Priority {
  LOW = '低',
  MEDIUM = '中',
  HIGH = '高',
  CRITICAL = '緊急'
}

export type AccessLevel = 'Admin' | 'Manager' | 'SeniorMember' | 'Member';

export type ProjectStage = string;

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee?: string;
  subtasks: SubTask[];
  aiSuggestions?: string;
  startDate?: string; // New: Schedule Start
  dueDate?: string;   // New: Schedule End
}

export interface ProjectLinks {
  figma?: string;
  staging?: string;
  production?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string; // Account ID
  password?: string; // Optional for mock data, required for creation
  role: string; // Job Title e.g., 'Frontend Dev'
  accessLevel: AccessLevel; // System Permission e.g., 'Admin'
  team?: string; // Legacy: Single team
  teams?: string[]; // New: Multiple teams assignment
  avatar?: string;
  status?: 'Active' | 'Suspended'; // Account Status
}

export interface PaymentStatus {
  depositPaid: boolean;  // 訂金
  interim1Paid: boolean; // 一期款
  interim2Paid: boolean; // 二期款
  finalPaid: boolean;    // 尾款
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string; // e.g., 'Dev', 'Design', 'Server', 'Other'
  type: 'expense' | 'income';
}

export interface ProofingRound {
  id: string;
  title: string; // e.g. "V1 Homepage"
  date: string;
  images: string[]; // URLs or Base64
}

export interface Project {
  id: string;
  name: string;
  category: string; // New: Project Category Grouping
  clientName: string;
  clientAvatar?: string; // New: Client Logo/Image
  description: string;
  stage: ProjectStage;
  stages: string[]; // New: Dynamic stages per project
  completedStages: string[]; // List of specific stages that are verified as done
  progress: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
  team?: string; // Team assignment for project
  teamMembers: string[]; // Stores Member IDs
  startDate: string;
  dueDate: string;
  budget: string; // Total Budget String e.g. "850000"
  budgetVisibleToMembers?: boolean; // Whether regular members can see budget
  paymentStatus: PaymentStatus;
  links: ProjectLinks;
  notes: string;
  notesLastModified?: string; // ISO timestamp of last notes update
  notesLastModifiedBy?: string; // Member ID who last updated notes
  tasks: Task[];
  chatMessages: ChatMessage[];
  transactions: Transaction[]; // New field for budget tracking
  proofing: ProofingRound[]; // New field for proofing/images
  unreadCount?: number; // Red badge count
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  tag: string; // e.g., 'Urgent', 'General', 'Update'
  priority: 'Normal' | 'High';
  targetMemberIds: string[]; // Empty array means ALL members
  authorId: string;
  createdAt: string;
  readBy: string[]; // List of member IDs who have read this
}