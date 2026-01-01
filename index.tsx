
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  FileText,
  LogOut,
  Hash,
  PauseCircle
} from 'lucide-react';

// --- Types & Constants ---

type Priority = 'Low' | 'Medium' | 'High';
type Status = 'To Do' | 'In Progress' | 'Pending Approval' | 'Completed';
type Role = 'Team' | 'Client';

interface Comment {
  id: string;
  author: string;
  role: Role;
  text: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  author: string;
  role: Role;
  text: string;
  timestamp: number;
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
  projectName: string;
}

const STORAGE_KEY_TASKS = 'avocado_tasks_v2';
const STORAGE_KEY_USER = 'avocado_current_user';
const STORAGE_KEY_CHAT = 'avocado_global_chat';

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Design System Update',
    description: 'Update the core design system to include new color palettes.',
    status: 'In Progress',
    priority: 'High',
    assignee: 'Alex Morgan',
    dueDate: '2024-10-25',
    progress: 65,
    projectName: 'GreenTech Rebrand',
    subtasks: [
      { id: 's1', text: 'Color palette refinement', completed: true },
      { id: 's2', text: 'Typography audit', completed: true },
      { id: 's3', text: 'Button components update', completed: false }
    ],
    comments: [],
    internalNotes: 'Customer prefers rounded corners over sharp ones.'
  }
];

// --- Utility Components ---

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

// --- Login Component ---

const LoginScreen = ({ onLogin }: { onLogin: (role: Role, name: string) => void }) => {
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 mb-4">
            <Kanban size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Avocado</h1>
          <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Project Manager</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              disabled={!name.trim()}
              onClick={() => onLogin('Team', name)}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 bg-slate-100 group-hover:bg-emerald-100 rounded-full flex items-center justify-center text-slate-500 group-hover:text-emerald-600">
                <Users size={20} />
              </div>
              <span className="font-bold text-slate-700">Team Login</span>
            </button>
            <button 
              disabled={!name.trim()}
              onClick={() => onLogin('Client', name)}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 bg-slate-100 group-hover:bg-emerald-100 rounded-full flex items-center justify-center text-slate-500 group-hover:text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <span className="font-bold text-slate-700">Client Login</span>
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-[10px] mt-10 uppercase font-bold tracking-widest">
          Secured Enterprise Access
        </p>
      </div>
    </div>
  );
};

// --- Task Components ---

// Fix: Use React.FC to properly support key prop and improve type inference in JSX
const TaskCard: React.FC<{ 
  task: Task; 
  onClick: () => void; 
  role: Role; 
  onDragStart?: (e: React.DragEvent) => void; 
}> = ({ task, onClick, role, onDragStart }) => {
  return (
    <div 
      draggable={role === 'Team'}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group ${role === 'Team' ? 'active:cursor-grabbing' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <PriorityBadge priority={task.priority} />
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{task.projectName}</span>
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
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${task.progress}%` }} />
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [user, setUser] = useState<{ role: Role, name: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  
  // Storage Effect - Sync tasks and chat
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const savedChat = localStorage.getItem(STORAGE_KEY_CHAT);

    if (savedTasks) setTasks(JSON.parse(savedTasks));
    else setTasks(INITIAL_TASKS);

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedChat) setChatMessages(JSON.parse(savedChat));

    // Listen for storage events across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_TASKS) setTasks(JSON.parse(e.newValue || '[]'));
      if (e.key === STORAGE_KEY_CHAT) setChatMessages(JSON.parse(e.newValue || '[]'));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (tasks.length > 0) localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (chatMessages.length > 0) localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(chatMessages));
  }, [chatMessages]);

  const handleLogin = (role: Role, name: string) => {
    const newUser = { role, name };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const addTask = (title: string, description: string, priority: Priority, projectName: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      status: 'To Do',
      priority,
      assignee: user?.name || 'Unassigned',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      subtasks: [],
      comments: [],
      projectName
    };
    setTasks([...tasks, newTask]);
    setShowNewTaskModal(false);
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDrop = (e: React.DragEvent, newStatus: Status) => {
    if (user?.role !== 'Team') return;
    const taskId = e.dataTransfer.getData('taskId');
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim() || !user) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      author: user.name,
      role: user.role,
      text,
      timestamp: Date.now()
    };
    setChatMessages([...chatMessages, msg]);
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const progress = Math.round((completed / total) * 100) || 0;
    return { total, completed, progress };
  }, [tasks]);

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-700">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-slate-400 flex flex-col p-4 lg:p-6 transition-all">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer justify-center lg:justify-start">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900">
            <Kanban size={24} />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-white font-bold text-lg">Avocado</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Shared Manager</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
          <SidebarItem active={activeTab === 'board'} icon={<Kanban size={20} />} label="Task Board" onClick={() => setActiveTab('board')} />
          <SidebarItem active={activeTab === 'chat'} icon={<MessageSquare size={20} />} label="Global Chat" onClick={() => setActiveTab('chat')} />
          <SidebarItem active={activeTab === 'timeline'} icon={<Calendar size={20} />} label="Timeline" onClick={() => setActiveTab('timeline')} />
        </nav>

        <div className="pt-6 border-t border-slate-800 space-y-2 mt-auto">
          <SidebarItem icon={<Settings size={20} />} label="Settings" />
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all justify-center lg:justify-start">
            <LogOut size={20} />
            <span className="hidden lg:block font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100 uppercase tracking-wide">
               {user.role} Access
             </div>
             <h2 className="text-lg font-bold text-slate-800 hidden sm:block">GreenTech Project</h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
               <span className="text-sm font-bold text-slate-800 leading-none">{user.name}</span>
               <span className="text-[10px] text-slate-400 font-medium">Active Now</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
               <User size={20} className="text-slate-500" />
             </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard label="Total Tasks" value={stats.total} icon={<Hash size={20}/>} color="bg-blue-500" />
                  <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={20}/>} color="bg-emerald-500" />
                  <StatCard label="Project Health" value={`${stats.progress}%`} icon={<Clock size={20}/>} color="bg-amber-500" />
               </div>
               
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Current Progress</h3>
                      <p className="text-sm text-slate-400">Project: <span className="text-emerald-600 font-bold">GreenTech Rebrand</span></p>
                    </div>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${stats.progress}%` }} />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'board' && (
            <div className="flex h-full gap-6 overflow-x-auto pb-4">
               {(['To Do', 'In Progress', 'Pending Approval', 'Completed'] as Status[]).map(status => (
                 <div 
                    key={status} 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, status)}
                    className="flex-1 min-w-[300px] flex flex-col"
                  >
                   <div className="flex items-center justify-between mb-4 px-2">
                     <div className="flex items-center gap-2">
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{status}</h3>
                       <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                         {tasks.filter(t => t.status === status).length}
                       </span>
                     </div>
                     <button onClick={() => setShowNewTaskModal(true)} className="text-slate-400 hover:text-emerald-600 transition-colors">
                        <Plus size={18} />
                     </button>
                   </div>

                   <div className={`flex-1 space-y-4 rounded-xl transition-colors ${user.role === 'Team' ? 'hover:bg-slate-100/50' : ''} p-2`}>
                      {tasks.filter(t => t.status === status).map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          role={user.role}
                          onClick={() => setSelectedTask(task)} 
                          onDragStart={(e) => onDragStart(e, task.id)}
                        />
                      ))}
                      <button 
                        onClick={() => setShowNewTaskModal(true)}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all text-xs font-bold"
                      >
                        + NEW TASK
                      </button>
                   </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in duration-300">
               <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Global Team & Client Chat</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Encrypted Channel</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Channel</span>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                      <MessageSquare size={64} className="mb-4 opacity-20" />
                      <p className="font-bold text-lg">Start the conversation</p>
                      <p className="text-sm">Messages are shared across all devices in real-time.</p>
                    </div>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.author === user.name ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className={`text-[10px] font-bold ${msg.role === 'Team' ? 'text-emerald-600' : 'text-blue-600'}`}>{msg.author}</span>
                          <span className="text-[9px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`p-4 rounded-2xl text-sm max-w-[80%] shadow-sm ${
                          msg.author === user.name 
                            ? 'bg-emerald-600 text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
               </div>

               <div className="p-4 bg-slate-50 border-t">
                  <ChatInput onSend={sendChatMessage} />
               </div>
            </div>
          )}

          {activeTab === 'timeline' && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in duration-300">
               <Calendar size={64} className="mb-4 opacity-20" />
               <h3 className="text-xl font-bold text-slate-800">Project Timeline</h3>
               <p className="text-slate-500">Visual Gantt chart view coming soon in Phase 2.</p>
             </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showNewTaskModal && (
        <NewTaskModal 
          onClose={() => setShowNewTaskModal(false)} 
          onAdd={addTask} 
        />
      )}
      
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          user={user} 
          onClose={() => setSelectedTask(null)}
          onUpdate={(t) => setTasks(prev => prev.map(old => old.id === t.id ? t : old))}
        />
      )}
    </div>
  );
};

// --- Helper Components ---

const SidebarItem = ({ active, icon, label, onClick }: { active?: boolean, icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'hover:bg-slate-800'}`}
  >
    {icon}
    <span className="hidden lg:block font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-800">{value}</h3>
    </div>
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
      {icon}
    </div>
  </div>
);

const ChatInput = ({ onSend }: { onSend: (val: string) => void }) => {
  const [text, setText] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input 
        type="text" 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
      />
      <button type="submit" className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20">
        <Send size={20} />
      </button>
    </form>
  );
};

const NewTaskModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (t: string, d: string, p: Priority, prj: string) => void }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [prj, setPrj] = useState('GreenTech Rebrand');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
       <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Create New Task</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
          </div>
          <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Project Name</label>
               <input value={prj} onChange={(e) => setPrj(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Task Title</label>
               <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
               <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</label>
               <div className="flex gap-2">
                 {(['Low', 'Medium', 'High'] as Priority[]).map(p => (
                   <button 
                    key={p} 
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition-all ${priority === p ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                   >
                     {p}
                   </button>
                 ))}
               </div>
             </div>
             <button 
                onClick={() => onAdd(title, desc, priority, prj)}
                disabled={!title.trim()}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
             >
               CREATE TASK
             </button>
          </div>
       </div>
    </div>
  );
};

const TaskDetailModal = ({ task, user, onClose, onUpdate }: { task: Task, user: { role: Role, name: string }, onClose: () => void, onUpdate: (t: Task) => void }) => {
  const [commentText, setCommentText] = useState('');
  
  const addComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: user.name,
      role: user.role,
      text: commentText,
      timestamp: 'Just now'
    };
    onUpdate({ ...task, comments: [...task.comments, newComment] });
    setCommentText('');
  };

  const handleStatusChange = (status: Status) => {
    onUpdate({ ...task, status });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
           <div className="flex items-center gap-3">
             <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-black uppercase">{task.status}</div>
             <h3 className="text-xl font-black text-slate-800">{task.title}</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all border border-slate-200 shadow-sm"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2 p-8 space-y-8 border-r">
             <section>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Description</h4>
                <p className="text-slate-600 leading-relaxed text-lg">{task.description}</p>
             </section>

             <section>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Task Controls</h4>
                <div className="flex flex-wrap gap-2">
                   {user.role === 'Team' && (['To Do', 'In Progress', 'Pending Approval', 'Completed'] as Status[]).map(s => (
                     <button 
                        key={s} 
                        onClick={() => handleStatusChange(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${task.status === s ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                       {s}
                     </button>
                   ))}
                   {user.role === 'Client' && task.status === 'Pending Approval' && (
                     <div className="flex gap-2 w-full">
                       <button onClick={() => handleStatusChange('Completed')} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all">APPROVE PROJECT</button>
                       <button onClick={() => handleStatusChange('In Progress')} className="flex-1 border-2 border-red-500 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50 transition-all">REQUEST CHANGES</button>
                     </div>
                   )}
                </div>
             </section>

             {user.role === 'Team' && (
               <section className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                  <h4 className="text-[10px] font-black uppercase text-amber-700 tracking-[0.2em] mb-2 flex items-center gap-2">
                    <ShieldCheck size={14} /> Internal Audit Log
                  </h4>
                  <p className="text-amber-800 text-sm">Last updated by {task.assignee} • Due: {task.dueDate}</p>
               </section>
             )}
          </div>

          <div className="bg-slate-50 p-8 flex flex-col h-full">
             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 flex items-center gap-2">
               <MessageSquare size={14} /> Activity Feed
             </h4>
             <div className="flex-1 space-y-4 mb-6">
                {task.comments.length === 0 ? (
                  <div className="text-center py-10 opacity-20"><MessageSquare size={48} className="mx-auto" /></div>
                ) : (
                  task.comments.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">{c.author}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{c.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{c.text}</p>
                    </div>
                  ))
                )}
             </div>
             <div className="relative">
                <input 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm pr-12 outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Post an update..."
                />
                <button onClick={addComment} className="absolute right-2 top-2 p-1.5 bg-emerald-600 text-white rounded-lg"><Send size={16} /></button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
