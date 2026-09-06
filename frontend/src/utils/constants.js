export const APP_NAME = 'CareerAI';
export const APP_TAGLINE = 'AI Career & Technical Interview Intelligence Platform';

export const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/#features' },
  { label: 'Tracks', path: '/#tracks' },
  { label: 'Dashboard', path: '/dashboard' },
];

export const DASHBOARD_NAV = [
  { label: 'Overview', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Resume Intelligence', path: '/dashboard/resume', icon: 'FileText', badge: 'Upcoming' },
  { label: 'Mock Interviewer', path: '/dashboard/interview', icon: 'Video', badge: 'Upcoming' },
  { label: 'Coding Assessment', path: '/dashboard/coding', icon: 'Code', badge: 'Upcoming' },
  { label: 'Skill Gap Matrix', path: '/dashboard/skills', icon: 'BarChart2', badge: 'Upcoming' },
  { label: 'Career Roadmaps', path: '/dashboard/roadmaps', icon: 'Compass', badge: 'Upcoming' },
  { label: 'Settings', path: '/dashboard/settings', icon: 'Settings' },
];

export const CAREER_TRACKS = [
  {
    id: 'fullstack',
    title: 'Full Stack Engineering',
    desc: 'MERN, Next.js, System Design, REST & GraphQL APIs',
    level: 'Entry - Mid',
    icon: 'Layers',
    color: '#6366F1',
  },
  {
    id: 'backend',
    title: 'Backend & Cloud Systems',
    desc: 'Node.js, Go, Microservices, Databases, AWS & Docker',
    level: 'Freshers - Senior',
    icon: 'Server',
    color: '#06B6D4',
  },
  {
    id: 'frontend',
    title: 'Frontend & UI Architecture',
    desc: 'React, TypeScript, Performance, Web Security & CSS',
    level: 'Beginner - Advanced',
    icon: 'Monitor',
    color: '#EC4899',
  },
  {
    id: 'ai-ml',
    title: 'AI & Data Engineering',
    desc: 'Python, LLMs, Vector Databases, Retrieval Systems',
    level: 'All Levels',
    icon: 'Cpu',
    color: '#10B981',
  },
];
