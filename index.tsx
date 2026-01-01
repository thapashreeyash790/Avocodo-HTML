
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Kanban, 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  CheckCircle2, 
  Clock, 
  User, 
  MoreVertical, 
  Plus, 
  ArrowRight, 
  ChevronRight, 
  Search, 
  Bell,
  Settings,
  ShieldCheck,
  Users,
  AlertCircle,
  X,
  Send,
  FileText
} from 'lucide-react';

// --- Types & Constants ---

type Priority = 'Low' | 'Medium' | 'High';
type Status = 'To Do' | 'In Progress' | 'Completed';
type Role = 'Team' | 'Client';

interface Comment {
  id: string;
  author: string;
  role: Role;
  text: string;
  timestamp: string;
}

interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string;
  dueDate: string;
  progress: number;
  subtasks: SubTask[];
  comments: Comment[];
  internalNotes?: string;
  isApproved?: boolean;
}

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Design System Update',
    description: 'Update the core design system to include new color palettes and component variants for the 2024 rebrand.',
    status: 'In Progress',
    priority: 'High',
    assignee: 'Alex Morgan',
    dueDate: '2024-10-25',
    progress: 65,
    subtasks: [
      { id: 's1', text: 'Color palette refinement', completed: true },
      { id: 's2', text: 'Typography audit', completed: true },
      { id: 's3', text: 'Button components update', completed: false }
    ],
    comments: [
      { id: 'c1', author: 'Sarah (Client)', role: 'Client', text: 'Looking forward to seeing the new greens!', timestamp: '2h ago' },
      { id: 'c2', author: 'Alex Morgan', role: 'Team', text: 'Almost there, just finalizing the button state variants.', timestamp: '1h ago' }
    ],
    internalNotes: 'Customer prefers rounded corners over sharp ones.'
  },
  {
    id: '2',
    title: 'API Integration: Stripe',
    description: 'Implement secure payment processing using Stripe Connect for the merchant dashboard.',
    status: 'To Do',
    priority: 'High',
    assignee: 'Jordan Lee',
    dueDate: '2024-11-01',
    progress: 0,
    subtasks: [
      { id: 's4', text: 'Schema design', completed: false },
      { id: 's5', text: 'Webhook setup', completed: false }
    ],
    comments: [],
    internalNotes: 'Need to check PCI compliance docs.'
  },
  {
    id: '3',
    title: 'Homepage Hero Animation',
    description: 'Create a smooth SVG animation for the homepage landing section to increase engagement.',
    status: 'Completed',
    priority: 'Medium',
    assignee: 'Casey Wright',
    dueDate: '2024-10-18',
    progress: 100,
    subtasks: [
      { id: 's6', text: 'Illustrator export', completed: true },
      { id: 's7', text: 'GSAP implementation', completed: true }
    ],
    comments: [
      { id: 'c3', author: 'Casey Wright', role: 'Team', text: 'Ready for review.', timestamp: 'Yesterday' }
    ],
    isApproved: false
  },
  {
    id: '4',
    title: 'Content Strategy Audit',
    description: 'Comprehensive review of current blog content and SEO keyword performance.',
    status: 'To Do',
    priority: 'Low',
    assignee: 'Taylor Reed',
    dueDate: '2024-11-15',
    progress: 0,
    subtasks: [],
    comments: []
  }
];

// --- Components ---

// Fix: Marking children as optional to satisfy TypeScript when the component is used with JSX children.
const Badge = ({ children, color }: { children?: React.ReactNode, color: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
    {children}
  </span>
);

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    Low: 'bg-blue-100 text-blue-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    High: 'bg-red-100 text-red-700'
  };
  return <Badge color={colors[priority]}>{priority}</Badge>;
};

// Fix: Adding 'key' to the prop type to prevent TypeScript from complaining when TaskCard is used within a map.
const TaskCard = ({ task, onClick, role }: { task: Task, onClick: () => void, role: Role, key?: string | number }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-2">
        <PriorityBadge priority={task.priority} />
        <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical size={16} />
        </button>
      </div>
      <h4 className="text-slate-800 font-semibold mb-1 group-hover:text-emerald-700 transition-colors">{task.title}</h4>
      <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
      
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
          <Calendar size={12} />
          <span>{task.dueDate}</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
          <MessageSquare size={12} />
          <span>{task.comments.length}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
          <span>Progress</span>
          <span>{task.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500" 
            style={{ width: `${task.progress}%` }} 
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden">
            <User size={14} className="text-slate-500" />
          </div>
          <span className="text-xs text-slate-600 font-medium">{task.assignee}</span>
        </div>
        {task.status === 'Completed' && task.isApproved && (
           <div className="bg-emerald-50 text-emerald-600 p-1 rounded-full" title="Approved">
             <CheckCircle2 size={16} />
           </div>
        )}
      </div>
    </div>
  );
};

const TaskModal = ({ task, onClose, onUpdate, role }: { task: Task, onClose: () => void, onUpdate: (t: Task) => void, role: Role }) => {
  const [commentText, setCommentText] = useState('');
  
  const addComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: role === 'Team' ? 'Alex Morgan' : 'Client User',
      role: role,
      text: commentText,
      timestamp: 'Just now'
    };
    onUpdate({ ...task, comments: [...task.comments, newComment] });
    setCommentText('');
  };

  const toggleSubtask = (sid: string) => {
    if (role === 'Client') return;
    const updated = task.subtasks.map(s => s.id === sid ? { ...s, completed: !s.completed } : s);
    const progress = Math.round((updated.filter(s => s.completed).length / updated.length) * 100) || 0;
    onUpdate({ ...task, subtasks: updated, progress });
  };

  const handleApproval = (approve: boolean) => {
    if (approve) {
      onUpdate({ ...task, isApproved: true });
    } else {
      onUpdate({ ...task, status: 'In Progress', isApproved: false, progress: 90 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <Badge color={task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
              {task.status}
            </Badge>
            <h3 className="text-lg font-bold text-slate-800">{task.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Main Info */}
          <div className="md:col-span-2 p-6 border-r border-slate-100">
            <section className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <FileText size={14} /> Description
              </h4>
              <p className="text-slate-600 leading-relaxed">{task.description}</p>
            </section>

            <section className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} /> Checklist
              </h4>
              <div className="space-y-2">
                {task.subtasks.map(s => (
                  <div key={s.id} className="flex items-center gap-3 group">
                    <button 
                      disabled={role === 'Client'}
                      onClick={() => toggleSubtask(s.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        s.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-500 bg-white'
                      }`}
                    >
                      {s.completed && <CheckCircle2 size={12} />}
                    </button>
                    <span className={`text-sm ${s.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {s.text}
                    </span>
                  </div>
                ))}
                {role === 'Team' && (
                  <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mt-2">
                    <Plus size={14} /> Add item
                  </button>
                )}
              </div>
            </section>

            {role === 'Team' && task.internalNotes && (
              <section className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <h4 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2 flex items-center gap-2">
                  <ShieldCheck size={14} /> Internal Team Notes
                </h4>
                <p className="text-amber-800 text-sm italic">{task.internalNotes}</p>
              </section>
            )}

            {task.status === 'Completed' && role === 'Client' && !task.isApproved && (
              <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200 text-center">
                <h4 className="text-emerald-800 font-bold mb-2 text-lg">Review Required</h4>
                <p className="text-emerald-700 text-sm mb-6">Team has finished this task. Would you like to approve it or request changes?</p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => handleApproval(true)}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Approve
                  </button>
                  <button 
                    onClick={() => handleApproval(false)}
                    className="px-6 py-2.5 bg-white border-2 border-emerald-600 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-all flex items-center gap-2"
                  >
                    <ArrowRight size={18} className="rotate-180" /> Request Changes
                  </button>
                </div>
              </div>
            )}

            {task.isApproved && (
              <div className="mt-8 p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-3 text-slate-600">
                <CheckCircle2 size={24} className="text-emerald-500" />
                <div>
                  <p className="font-bold">Task Approved</p>
                  <p className="text-xs">This task is finalized and locked for changes.</p>
                </div>
              </div>
            )}
          </div>

          {/* Activity/Comments */}
          <div className="p-6 bg-slate-50 flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <MessageSquare size={14} /> Activity Feed
            </h4>
            
            <div className="flex-1 space-y-4 mb-6 overflow-y-auto custom-scrollbar pr-2">
              {task.comments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs italic">No comments yet</p>
                </div>
              ) : (
                task.comments.map(c => (
                  <div key={c.id} className={`flex flex-col gap-1 ${c.role === role ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-500">{c.author}</span>
                      <span className="text-[9px] text-slate-400">{c.timestamp}</span>
                    </div>
                    <div className={`p-3 rounded-2xl text-sm max-w-full ${
                      c.role === 'Client' 
                        ? 'bg-white border border-slate-200 text-slate-700' 
                        : 'bg-emerald-600 text-white shadow-md'
                    }`}>
                      {c.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="relative mt-auto">
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
                placeholder="Write a message..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm pr-12 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-sm"
              />
              <button 
                onClick={addComment}
                className="absolute right-2 top-2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- App Root ---

const App = () => {
  const [role, setRole] = useState<Role>('Team');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('board');

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const progress = Math.round((completed / total) * 100) || 0;
    const overdue = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;
    return { total, completed, progress, overdue };
  }, [tasks]);

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleStatusChange = (taskId: string, newStatus: Status) => {
    if (role === 'Client') return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col p-6 hidden md:flex">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900 group-hover:scale-105 transition-all">
            <Kanban size={24} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">Avocado</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em]">Project Manager</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('board')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'board' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900' : 'hover:bg-slate-800'}`}
          >
            <Kanban size={20} />
            <span className="font-medium">Task Board</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800">
            <Calendar size={20} />
            <span className="font-medium">Timeline</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800">
            <MessageSquare size={20} />
            <span className="font-medium">Chat</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-800 mt-auto space-y-2">
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800">
            <AlertCircle size={20} />
            <span className="font-medium">Support</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setRole('Team')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${role === 'Team' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Users size={16} /> Team View
            </button>
            <button 
              onClick={() => setRole('Client')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${role === 'Client' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ShieldCheck size={16} /> Client View
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search project..." 
                className="bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none w-64 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-500 transition-all">
                <User size={24} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable View */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' ? (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800">Good Morning, {role === 'Team' ? 'Alex' : 'Sarah'}</h2>
                  <p className="text-slate-500">Here's what's happening in <span className="text-emerald-600 font-semibold">GreenTech Rebrand</span> today.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <LayoutDashboard size={24} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Total Tasks</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Completed</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.completed}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                      <Clock size={24} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">In Progress</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{tasks.filter(t => t.status === 'In Progress').length}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                      <AlertCircle size={24} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Overdue</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.overdue}</h3>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-slate-800">Project Timeline</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="font-bold text-slate-800">{stats.progress}%</span> overall completion
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000" 
                        style={{ width: `${stats.progress}%` }} 
                      />
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-md"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Kickoff</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className={`w-4 h-4 rounded-full ${stats.progress > 40 ? 'bg-emerald-500' : 'bg-slate-200'} border-4 border-white shadow-md`}></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">V1 Review</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className={`w-4 h-4 rounded-full ${stats.progress > 70 ? 'bg-emerald-500' : 'bg-slate-200'} border-4 border-white shadow-md`}></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Beta</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className={`w-4 h-4 rounded-full ${stats.progress === 100 ? 'bg-emerald-500' : 'bg-slate-200'} border-4 border-white shadow-md`}></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Launch</span>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          ) : (
            <div className="flex h-full gap-8 animate-in fade-in zoom-in-95 duration-500">
              {(['To Do', 'In Progress', 'Completed'] as Status[]).map(status => (
                <div key={status} className="flex-1 flex flex-col min-w-[300px]">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">{status}</h3>
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {tasks.filter(t => t.status === status).length}
                      </span>
                    </div>
                    {role === 'Team' && (
                      <button className="text-slate-400 hover:text-emerald-600 transition-colors">
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {tasks.filter(t => t.status === status).map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        role={role}
                        onClick={() => setSelectedTask(task)} 
                      />
                    ))}
                    {role === 'Team' && (
                       <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all text-sm font-medium flex items-center justify-center gap-2">
                         <Plus size={16} /> Add Task
                       </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          role={role}
          onClose={() => setSelectedTask(null)} 
          onUpdate={updateTask}
        />
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
