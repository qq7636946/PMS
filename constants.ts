
import { Project, Status, Priority, Member } from './types';

// Helper to generate consistent avatars
const getAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;

export const DEFAULT_STAGES = [
  '洽詢'
];

export const INITIAL_MEMBERS: Member[] = [
  { id: 'admin-main', name: '超級管理員', email: 'qq7636946@gmail.com', password: 'password', role: 'CEO', accessLevel: 'Admin', avatar: getAvatar('Super Admin'), status: 'Active' },
  { id: 'm2', name: '李雅婷', email: 'sarah@nexus.ai', password: 'password', role: 'UI/UX 設計師', accessLevel: 'Manager', avatar: getAvatar('Sarah Lee'), status: 'Active' },
  { id: 'm3', name: '陳建宏', email: 'mike@nexus.ai', password: 'password', role: '前端工程師', accessLevel: 'Member', avatar: getAvatar('Mike Chen'), status: 'Active' },
  { id: 'm4', name: '林志偉', email: 'david@nexus.ai', password: 'password', role: '後端工程師', accessLevel: 'Member', status: 'Active' },
  { id: 'm5', name: '張惠君', email: 'eve@nexus.ai', password: 'password', role: '平面設計', accessLevel: 'Member', status: 'Active' },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'TechFlow 企業官網改版',
    clientName: 'TechFlow 科技',
    category: '網頁設計',
    clientAvatar: '',
    description: '針對品牌重塑進行的響應式 (RWD) 官網改版，包含動效設計與 CMS 後台建置。',
    stage: '前端開發',
    stages: DEFAULT_STAGES,
    completedStages: [
      '洽詢',
      '簽約',
      '視覺設計',
      '第一次修改',
      '第二次修改',
      '第三次修改'
    ],
    progress: 65,
    riskLevel: 'Low',
    teamMembers: ['admin-main', 'm2', 'm3'],
    startDate: '2025-05-01',
    dueDate: '2025-07-15',
    budget: '850000',
    paymentStatus: {
      depositPaid: true,
      interim1Paid: true,
      interim2Paid: false,
      finalPaid: false
    },
    links: {
      figma: 'https://figma.com/file/xyz',
      staging: 'https://dev.techflow.com',
    },
    notes: '客戶強調首頁 Hero Section 的 Loading 動畫效能，需特別注意行動裝置表現。第二期款項已收到。',
    chatMessages: [
      { id: 'c1', senderId: 'admin-main', content: '客戶提到 Hero Section 的動畫希望能再順暢一點，前端這邊有問題嗎？', timestamp: '2025-05-18T10:00:00' },
      { id: 'c2', senderId: 'm3', content: '沒問題，我會調整 GSAP 的參數。', timestamp: '2025-05-18T10:15:00' },
      { id: 'c3', senderId: 'm2', content: '設計稿已經更新，請參考 v2 版本。', timestamp: '2025-05-19T09:30:00' }
    ],
    transactions: [
      { id: 'tx1', title: '伺服器架設費用', amount: 2400, date: '2025-06-12', category: 'Server', type: 'expense' },
      { id: 'tx2', title: '圖庫授權購買', amount: 5000, date: '2025-05-20', category: 'Design', type: 'expense' },
      { id: 'tx3', title: '外包插畫師', amount: 12000, date: '2025-05-25', category: 'Design', type: 'expense' }
    ],
    proofing: [],
    unreadCount: 3,
    tasks: [
      {
        id: 't1',
        projectId: 'p1',
        title: 'Design System 設計規範建立',
        description: '定義字體、色票、Grid System 與共用元件庫。',
        status: Status.DONE,
        priority: Priority.HIGH,
        startDate: '2025-05-01',
        dueDate: '2025-05-10',
        subtasks: [
          { id: 's1', title: '定義 Typography (H1-H6, Body)', completed: true },
          { id: 's2', title: '設定主要與次要色票 (Color Palette)', completed: true },
          { id: 's3', title: '製作 Button 與 Input 元件狀態', completed: true }
        ],
        aiSuggestions: '建議確認色彩對比度是否符合 WCAG 2.1 AA 標準。'
      },
      {
        id: 't2',
        projectId: 'p1',
        title: '首頁前端切版 (React + Tailwind)',
        description: '根據 Figma 設計稿進行首頁高保真切版。',
        status: Status.IN_PROGRESS,
        priority: Priority.HIGH,
        startDate: '2025-05-12',
        dueDate: '2025-06-20',
        subtasks: [
          { id: 's4', title: 'Hero Section 動畫實作', completed: false },
          { id: 's5', title: 'RWD 手機版樣式調整', completed: false }
        ],
      },
      {
        id: 't3',
        projectId: 'p1',
        title: 'SEO 基礎設定與效能優化',
        description: '設定 Meta Tags, Sitemap 並優化 Core Web Vitals。',
        status: Status.TODO,
        priority: Priority.MEDIUM,
        startDate: '2025-06-25',
        dueDate: '2025-06-30',
        subtasks: [],
      }
    ]
  },
  {
    id: 'p2',
    name: 'FreshMart 生鮮電商 App',
    category: 'App 開發',
    clientName: 'FreshMart 生鮮',
    clientAvatar: '',
    description: 'iOS 與 Android 雙平台生鮮購物應用程式開發，包含金流串接。',
    stage: '視覺設計',
    stages: DEFAULT_STAGES,
    completedStages: [
      '洽詢',
      '簽約'
    ],
    progress: 30,
    riskLevel: 'High',
    teamMembers: ['m4', 'm5'],
    startDate: '2025-06-10',
    dueDate: '2025-09-20',
    budget: '1200000',
    paymentStatus: {
      depositPaid: true,
      interim1Paid: false,
      interim2Paid: false,
      finalPaid: false
    },
    links: {
      figma: 'https://figma.com/file/abc'
    },
    notes: '目前設計風格客戶覺得太過冷硬，需要增加「有機」、「新鮮」的視覺元素。週三需要提交第二版設計。',
    chatMessages: [],
    transactions: [],
    proofing: [],
    unreadCount: 1,
    tasks: [
      {
        id: 't4',
        projectId: 'p2',
        title: '購物車流程 UX 測試',
        description: '針對結帳流程進行使用者測試與易用性分析。',
        status: Status.TODO,
        priority: Priority.CRITICAL,
        startDate: '2025-06-15',
        dueDate: '2025-06-18',
        subtasks: [],
      },
      {
        id: 't5',
        projectId: 'p2',
        title: 'API 串接文件撰寫',
        description: '與後端確認會員登入與訂單建立的 API 規格。',
        status: Status.IN_PROGRESS,
        priority: Priority.HIGH,
        startDate: '2025-06-20',
        dueDate: '2025-07-05',
        subtasks: [],
      }
    ]
  }
];