import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Kanban, 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  User, 
  MoreVertical, 
  Plus, 
  ArrowRight, 
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
  Database,
  Terminal,
  RefreshCw,
  Activity
} from 'lucide-react';

// --- Types ---

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

interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string;
  dueDate: string;
  progress: number;
  comments: Comment[];
  projectName: string;
}

interface ServerLog {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  time: string;
}

// --- Mock Database (IndexedDB Simulation) ---

class AvocadoDB {
  private static dbName = 'AvocadoProjectManagerDB';
  private static version = 1;

  static async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('chat')) db.createObjectStore('chat', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAll(storeName: string): Promise<any[]> {
    const db: any = await this.init();
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
  }

  static async put(storeName: string, data: any) {
    const db: any = await this.init();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(data);
  }
}

// --- Mock Server API ---

class MockServer {
  static logs: ServerLog[] = [];
  static onLogUpdate: (logs: ServerLog[]) => void = () => {};

  private static log(method: string, endpoint: string, status = 200) {
    const newLog = {
      id: Math.random().toString(36).substring(7),
      method,
      endpoint,
      status,
      time: new Date().toLocaleTimeString()
    };
    this.logs = [newLog, ...this.logs].slice(0, 50);
    this.onLogUpdate(this.logs);
  }

  static async getTasks(): Promise<Task[]> {
    this.log('GET', '/api/v1/tasks');
    await new Promise(r => setTimeout(r, 600));
    const tasks = await AvocadoDB.getAll('tasks');
    if (tasks.length === 0) {
      const initial = [{
        id: 'task-1',
        title: 'Initial Project Setup',
        description: 'Configure the database and base architecture.',
        status: 'Completed' as Status,
        priority: 'High' as Priority,
        assignee: 'System',
        dueDate: '2024-10-20',
        progress: 100,
        comments: [],
        projectName: 'Internal'
      }];
      for (const t of initial) await AvocadoDB.put('tasks', t);
      return initial;
    }
    return tasks;
  }

  static async saveTask(task: Task) {
    this.log('PUT', `/api/v1/tasks/${task.id}`);
    await new Promise(r => setTimeout(r, 400));
    await AvocadoDB.put('tasks', task);
  }

  static async getChat(): Promise<ChatMessage[]> {
    this.log('GET', '/api/v1/chat');
    await new Promise(r => setTimeout(r, 300));
    return await AvocadoDB.getAll('chat');
  }

  static async sendChatMessage(msg: ChatMessage) {
    this.log('POST', '/api/v1/chat');
    await new Promise(r => setTimeout(r, 200));
    await AvocadoDB.put('chat', msg);
  }
}

// --- Components ---

const Badge = ({ children, color }: { children?: React.ReactNode, color: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
    {children}
  </span>
);

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = { Low: 'bg-blue-100 text-blue-700', Medium: 'bg-yellow-100 text-yellow-700', High: 'bg-red-100 text-red-700' };
  return <Badge color={colors[priority]}>{priority}</Badge>;
};

const TaskCard: React.FC<{ 
  task: Task; 
  onClick: () => void; 
  role: Role; 
  onDragStart?: (e: React.DragEvent) => void; 
}> = ({ task, onClick, role, onDragStart }) => (
  <div 
    draggable={role === 'Team'}
    onDragStart={onDragStart}
    onClick={onClick}
    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
  >
    <div className="flex justify-between items-start mb-2">
      <PriorityBadge priority={task.priority} />
      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{task.projectName}</span>
    </div>
    <h4 className="text-slate-800 font-bold mb-1 group-hover:text-emerald-700">{task.title}</h4>
    <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
      <div className="flex items-center gap-1.5">
        <Calendar size={12} />
        <span>{task.dueDate}</span>
      </div>
      <div className="flex items-center gap-1">
        <MessageSquare size={12} />
        <span>{task.comments.length}</span>
      </div>
    </div>
    <div className="mt-4">
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${task.progress}%` }} />
      </div>
    </div>
  </div>
);

// --- Main App ---

const App = () => {
  const [user, setUser] = useState<{ role: Role, name: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [activeTab, setActiveTab] = useState('board');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Initialize Login
  useEffect(() => {
    const savedUser = localStorage.getItem('avocado_current_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Initialize Data & Real-time Logs
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setIsSyncing(true);
      const [t, c] = await Promise.all([MockServer.getTasks(), MockServer.getChat()]);
      setTasks(t);
      setChatMessages(c.sort((a, b) => a.timestamp - b.timestamp));
      setIsSyncing(false);
    };

    MockServer.onLogUpdate = (logs) => setServerLogs(logs);
    fetchData();

    // Poll for changes (Simulated server push)
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (role: Role, name: string) => {
    const newUser = { role, name };
    setUser(newUser);
    localStorage.setItem('avocado_current_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('avocado_current_user');
  };

  const syncTask = async (task: Task) => {
    setIsSyncing(true);
    await MockServer.saveTask(task);
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    setIsSyncing(false);
  };

  const addTask = async (title: string, description: string, priority: Priority, projectName: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title, description, priority, projectName,
      status: 'To Do',
      assignee: user?.name || 'User',
      dueDate: new Date(Date.now() + 604800000).toISOString().split('T')[0],
      progress: 0,
      comments: []
    };
    setIsSyncing(true);
    await MockServer.saveTask(newTask);
    setTasks([...tasks, newTask]);
    setShowNewTaskModal(false);
    setIsSyncing(false);
  };

  const sendChat = async (text: string) => {
    if (!text.trim() || !user) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      author: user.name,
      role: user.role,
      text,
      timestamp: Date.now()
    };
    setIsSyncing(true);
    await MockServer.sendChatMessage(msg);
    setChatMessages(prev => [...prev, msg]);
    setIsSyncing(false);
  };

  if (!user) return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900 p-4 font-['Inter']">
      <div className="bg-white w-full max-w-md rounded-3xl p-10 shadow-2xl animate-in zoom-in-95">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 mb-4">
            <Kanban size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800">Avocado</h1>
          <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Enterprise Project Manager</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => handleLogin('Team', 'Alex (Internal)')} className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
            <div className="flex items-center gap-4">
              <Users className="text-slate-400 group-hover:text-emerald-500" />
              <div className="text-left">
                <p className="font-bold text-slate-700">Team Member</p>
                <p className="text-xs text-slate-400">Manage tasks & workflow</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300" />
          </button>
          <button onClick={() => handleLogin('Client', 'Sarah (Client)')} className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
            <div className="flex items-center gap-4">
              <ShieldCheck className="text-slate-400 group-hover:text-emerald-500" />
              <div className="text-left">
                <p className="font-bold text-slate-700">Client Access</p>
                <p className="text-xs text-slate-400">View progress & approve</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-['Inter']">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-slate-400 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 justify-center lg:justify-start">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Kanban size={24} />
          </div>
          <h1 className="text-white font-black text-xl hidden lg:block">Avocado</h1>
        </div>
        <nav className="space-y-2 flex-1">
          <SidebarItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
          <SidebarItem active={activeTab === 'board'} icon={<Kanban size={20} />} label="Task Board" onClick={() => setActiveTab('board')} />
          <SidebarItem active={activeTab === 'chat'} icon={<MessageSquare size={20} />} label="Global Chat" onClick={() => setActiveTab('chat')} />
          {/* Only show Server Status to Team members */}
          {user.role === 'Team' && (
            <SidebarItem active={activeTab === 'server'} icon={<Terminal size={20} />} label="Server Status" onClick={() => setActiveTab('server')} />
          )}
        </nav>
        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all justify-center lg:justify-start">
          <LogOut size={20} />
          <span className="hidden lg:block font-bold">Log out</span>
        </button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-500 border border-slate-200">
              {user.role} View
            </div>
            {isSyncing && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 animate-pulse">
                <RefreshCw size={12} className="animate-spin" /> SYNCING...
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 leading-none">{user.name}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Verified Session</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
              <User size={20} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Views */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'board' && (
            <div className="flex gap-6 min-h-full pb-8 overflow-x-auto">
              {(['To Do', 'In Progress', 'Pending Approval', 'Completed'] as Status[]).map(status => (
                <div 
                  key={status} 
                  onDragOver={e => e.preventDefault()}
                  onDrop={async (e) => {
                    if (user.role !== 'Team') return;
                    const taskId = e.dataTransfer.getData('taskId');
                    const task = tasks.find(t => t.id === taskId);
                    if (task && task.status !== status) {
                      await syncTask({ ...task, status });
                    }
                  }}
                  className="flex-1 min-w-[280px] flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status === 'In Progress' ? 'bg-blue-400' : status === 'Completed' ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                      {status}
                    </h3>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {tasks.filter(t => t.status === status).length}
                    </span>
                  </div>
                  <div className="flex-1 space-y-4 p-2 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200 group">
                    {tasks.filter(t => t.status === status).map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        role={user.role} 
                        onClick={() => setSelectedTask(task)} 
                        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                      />
                    ))}
                    <button onClick={() => setShowNewTaskModal(true)} className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all text-[10px] font-black">
                      + ADD TASK
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto h-[70vh] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <MessageSquare size={20} />
                  </div>
                  <h3 className="font-black text-slate-800">Unified Project Stream</h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                  <Activity size={12} /> Real-time active
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.author === user.name ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className={`text-[9px] font-black uppercase ${msg.role === 'Team' ? 'text-emerald-600' : 'text-blue-600'}`}>{msg.author}</span>
                      <span className="text-[9px] text-slate-300 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className={`p-4 rounded-2xl text-sm max-w-[70%] shadow-sm ${msg.author === user.name ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-white border-t">
                <ChatInput onSend={sendChat} />
              </div>
            </div>
          )}

          {/* Ensure Server Status is only visible to Team role */}
          {activeTab === 'server' && user.role === 'Team' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-white font-black flex items-center gap-3">
                    <Terminal className="text-emerald-500" /> Database Activity Logs
                  </h3>
                  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase border border-emerald-500/30">
                    Host: Avocado-Node-01
                  </div>
                </div>
                <div className="space-y-2 font-mono text-[11px] h-[400px] overflow-y-auto custom-scrollbar">
                  {serverLogs.map(log => (
                    <div key={log.id} className="flex gap-4 p-2 rounded hover:bg-slate-800/50 border-b border-slate-800/30 transition-colors">
                      <span className="text-slate-500">[{log.time}]</span>
                      <span className={`font-bold ${log.method === 'GET' ? 'text-blue-400' : 'text-amber-400'}`}>{log.method}</span>
                      <span className="text-emerald-400">{log.endpoint}</span>
                      <span className="text-slate-500 ml-auto">STATUS: <span className="text-emerald-500">{log.status} OK</span></span>
                    </div>
                  ))}
                  {serverLogs.length === 0 && <div className="text-slate-600 italic">No activity detected yet...</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Database size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Engine</p>
                    <p className="font-black text-slate-800">IndexedDB v1.0</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Activity size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Latency</p>
                    <p className="font-black text-slate-800">24ms (Local)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
             <div className="animate-in fade-in duration-500 space-y-8">
               <div className="mb-4">
                 <h2 className="text-3xl font-black text-slate-800">Hello, {user.name.split(' ')[0]} 👋</h2>
                 <p className="text-slate-400 font-medium mt-1">Everything is in sync with the central project database.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard label="Live Tasks" value={tasks.length} icon={<Hash />} color="bg-blue-500" />
                 <StatCard label="Approvals" value={tasks.filter(t => t.status === 'Pending Approval').length} icon={<ShieldCheck />} color="bg-amber-500" />
                 <StatCard label="Success Rate" value={`${Math.round((tasks.filter(t=>t.status==='Completed').length / (tasks.length || 1)) * 100)}%`} icon={<CheckCircle2 />} color="bg-emerald-500" />
               </div>
             </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showNewTaskModal && <NewTaskModal onClose={() => setShowNewTaskModal(false)} onAdd={addTask} />}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          user={user} 
          onClose={() => setSelectedTask(null)}
          onUpdate={syncTask}
        />
      )}
    </div>
  );
};

// --- Helpers ---

const SidebarItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'hover:bg-slate-800'}`}>
    {icon} <span className="hidden lg:block font-bold text-sm">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-800">{value}</h3>
    </div>
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>{icon}</div>
  </div>
);

const ChatInput = ({ onSend }: any) => {
  const [text, setText] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSend(text); setText(''); } }} className="flex gap-4">
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Type shared message..." className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
      <button type="submit" className="bg-emerald-600 text-white px-8 rounded-2xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-900/20"><Send size={20} /></button>
    </form>
  );
};

const NewTaskModal = ({ onClose, onAdd }: any) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [prj, setPrj] = useState('GreenTech Rebrand');
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
       <div className="bg-white w-full max-w-lg rounded-[32px] p-10 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-800">Add New Entry</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
          </div>
          <div className="space-y-6">
             <input value={prj} onChange={e => setPrj(e.target.value)} placeholder="Project Name" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold" />
             <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Task Title" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4" />
             <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Task Details..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4" />
             <button onClick={() => onAdd(title, desc, 'Medium', prj)} disabled={!title.trim()} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all disabled:opacity-50 uppercase tracking-widest">Post to Server</button>
          </div>
       </div>
    </div>
  );
};

const TaskDetailModal = ({ task, user, onClose, onUpdate }: any) => {
  const [commentText, setCommentText] = useState('');
  const addComment = () => {
    if (!commentText.trim()) return;
    onUpdate({ ...task, comments: [...task.comments, { id: Date.now().toString(), author: user.name, role: user.role, text: commentText, timestamp: 'Now' }] });
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
           <div className="flex items-center gap-4">
             <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">{task.status}</div>
             <h3 className="text-2xl font-black text-slate-800">{task.title}</h3>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-all border border-slate-200 shadow-sm"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2 p-10 space-y-10 border-r">
             <section>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2"><FileText size={14} /> Description</h4>
                <p className="text-slate-600 leading-relaxed text-xl font-medium">{task.description}</p>
             </section>
             <section>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Workflow Actions</h4>
                <div className="flex flex-wrap gap-2">
                   {user.role === 'Team' && (['To Do', 'In Progress', 'Pending Approval', 'Completed'] as Status[]).map(s => (
                     <button key={s} onClick={() => onUpdate({...task, status: s})} className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${task.status === s ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>{s}</button>
                   ))}
                   {user.role === 'Client' && task.status === 'Pending Approval' && (
                     <div className="flex gap-4 w-full">
                       <button onClick={() => onUpdate({...task, status: 'Completed'})} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl shadow-emerald-900/20">Finalize & Approve</button>
                       <button onClick={() => onUpdate({...task, status: 'In Progress'})} className="flex-1 border-2 border-red-500 text-red-500 py-5 rounded-2xl font-black uppercase hover:bg-red-50 transition-all">Reject Changes</button>
                     </div>
                   )}
                </div>
             </section>
          </div>
          <div className="bg-slate-50 p-10 flex flex-col">
             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-8">Interaction Log</h4>
             <div className="flex-1 space-y-4 mb-8">
                {task.comments.map((c: any) => (
                  <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{c.author}</span>
                      <span className="text-[9px] text-slate-300 font-bold uppercase">{c.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-bold leading-relaxed">{c.text}</p>
                  </div>
                ))}
                {task.comments.length === 0 && <div className="text-center opacity-20 py-10"><MessageSquare size={40} className="mx-auto" /></div>}
             </div>
             <div className="relative">
                <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold pr-14 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Type feedback..." />
                <button onClick={addComment} className="absolute right-3 top-2.5 p-2 bg-slate-900 text-white rounded-xl"><Send size={16} /></button>
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
