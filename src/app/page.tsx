"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brain, FileText, CheckSquare, Search, Home, ChevronRight, Clock, AlertCircle, CheckCircle, XCircle, Calendar, BookOpen, Activity, Zap, X, LogOut, Filter, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://njxjuvxosvwvluxefrzg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeGp1dnhvc3Z3dmx1eGVmcnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MjkyNTUsImV4cCI6MjA4NzQwNTI1NX0.FqfMyI3uSkiHVepWVccxFU4ie5RU00VVdrF-aOr9LjI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const ADMIN_PASSWORD = "jeff2026";

interface Memory { id: string; title: string; content: string; date: string; type: string; }
interface Document { id: string; title: string; path: string; type: string; date: string; size: number; }
interface Task { id: string; name: string; schedule: string; status: string; last_run: string; last_duration: string; next_run: string; error_count: number; }
type TabType = "home" | "memories" | "documents" | "tasks";

const features = [
  { icon: Brain, title: "记忆管理", desc: "自动收集、整理、智能检索", gradient: "gradient-violet" },
  { icon: FileText, title: "文档中心", desc: "统一管理所有文档笔记", gradient: "gradient-blue" },
  { icon: CheckSquare, title: "任务追踪", desc: "实时监控自动化任务", gradient: "gradient-emerald" },
  { icon: Zap, title: "智能分析", desc: "AI 驱动的洞察分析", gradient: "gradient-amber" },
];

const getToday = () => new Date().toISOString().split('T')[0];

export default function SecondBrain() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const auth = localStorage.getItem('secondbrain_auth');
    if (auth === 'true') setIsAuthenticated(true);
    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchData() {
      setLoading(true);
      const [memRes, docRes, taskRes] = await Promise.all([
        supabase.from('memories').select('*').order('date', { ascending: false }),
        supabase.from('documents').select('*').order('date', { ascending: false }),
        supabase.from('tasks').select('*'),
      ]);
      if (memRes.data) setMemories(memRes.data as Memory[]);
      if (docRes.data) setDocuments(docRes.data as Document[]);
      if (taskRes.data) setTasks(taskRes.data as Task[]);
      setLoading(false);
    }
    fetchData();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(false);
    setTimeout(() => {
      if (loginPassword === ADMIN_PASSWORD) {
        localStorage.setItem('secondbrain_auth', 'true');
        setIsAuthenticated(true);
      } else { setLoginError(true); setLoginPassword(""); }
      setLoggingIn(false);
    }, 500);
  };

  const handleLogout = () => { localStorage.removeItem('secondbrain_auth'); setIsAuthenticated(false); setLoginPassword(""); };
  const filteredMemories = memories.filter(m => m.date === dateFilter || m.type === 'long-term');
  const filteredDocuments = documents.filter(d => d.date === dateFilter);
  const stats = { totalMemories: filteredMemories.length, totalDocuments: filteredDocuments.length, activeTasks: tasks.filter(t => t.status === 'ok').length, errorTasks: tasks.filter(t => t.status === 'error').length };

  const cardStyle = (key: string, isError = false) => ({ backgroundColor: hovered === key ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", border: hovered === key ? (isError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(139,92,246,0.25)") : (isError ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)"), borderRadius: "16px", padding: "24px", transition: "all 0.3s", transform: hovered === key ? "translateY(-4px)" : "translateY(0)", boxShadow: hovered === key ? "0 12px 40px rgba(139,92,246,0.15)" : "none" });
  const cardSmallStyle = (key: string) => ({ backgroundColor: hovered === key ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", border: hovered === key ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px", transition: "all 0.3s", transform: hovered === key ? "translateY(-2px)" : "translateY(0)", cursor: "pointer" as const });
  const navButtonStyle = (active: boolean, key: string) => ({ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", border: active ? "1px solid rgba(139,92,246,0.3)" : hovered === key ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent", background: active ? "linear-gradient(135deg,rgba(139,92,246,0.15),rgba(147,51,234,0.15))" : hovered === key ? "rgba(255,255,255,0.05)" : "transparent", color: active ? "#fff" : "#a1a1aa", cursor: "pointer", transition: "all 0.2s", fontSize: "14px", marginBottom: "4px", transform: hovered === key ? "translateX(4px)" : "translateX(0)" });
  const getStatusIcon = (status: string) => { switch(status) { case "ok": return <CheckCircle size={16} style={{color:"#10b981"}}/>; case "error": return <XCircle size={16} style={{color:"#ef4444"}}/>; case "running": return <Activity size={16} style={{color:"#3b82f6"}} className="animate-pulse"/>; default: return <AlertCircle size={16} style={{color:"#f59e0b"}}/>; }};
  const getTypeIcon = (type: string) => { switch(type) { case "long-term": return <Brain size={16} style={{color:"#8b5cf6"}}/>; case "daily": return <Calendar size={16} style={{color:"#3b82f6"}}/>; case "evolution": return <Activity size={16} style={{color:"#10b981"}}/>; default: return <FileText size={16} style={{color:"#a1a1aa"}}/>; }};
  const getDocIcon = (type: string) => { switch(type) { case "memory": return <Brain size={16} style={{color:"#8b5cf6"}}/>; case "report": return <FileText size={16} style={{color:"#3b82f6"}}/>; case "newsletter": return <BookOpen size={16} style={{color:"#10b981"}}/>; default: return <FileText size={16} style={{color:"#a1a1aa"}}/>; }};
  const iconBox = (g: string) => ({ width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: g==="gradient-violet"?"linear-gradient(135deg,#8b5cf6,#9333ea)":g==="gradient-blue"?"linear-gradient(135deg,#3b82f6,#0891b2)":g==="gradient-emerald"?"linear-gradient(135deg,#10b981,#16a34a)":"linear-gradient(135deg,#f59e0b,#ea580c)" });

  const renderDateFilter = () => (
    <div style={{position:"relative"}}>
      <button onClick={()=>setShowDatePicker(!showDatePicker)} style={{display:"flex",alignItems:"center",gap:"8px",backgroundColor:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"10px 16px",color:"#fff",cursor:"pointer",fontSize:"14px"}}><Filter size={16} style={{color:"#8b5cf6"}}/><Calendar size={16} style={{color:"#71717a"}}/>{dateFilter||"全部"}</button>
      {showDatePicker && (<div style={{position:"absolute",top:"100%",right:0,marginTop:"8px",backgroundColor:"#1a1a1e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"16px",zIndex:100,minWidth:"200px"}}>
        <input type="date" value={dateFilter} onChange={(e)=>{setDateFilter(e.target.value);setShowDatePicker(false);}} max={getToday()} style={{width:"100%",backgroundColor:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"8px 12px",color:"#fff",fontSize:"14px"}} />
        <div style={{marginTop:"12px",display:"flex",gap:"8px"}}>
          <button onClick={()=>setDateFilter(getToday())} style={{flex:1,backgroundColor:"rgba(139,92,246,0.2)",border:"none",borderRadius:"6px",padding:"6px 12px",color:"#8b5cf6",fontSize:"12px",cursor:"pointer"}}>今天</button>
          <button onClick={()=>{setDateFilter("");setShowDatePicker(false);}} style={{flex:1,backgroundColor:"rgba(255,255,255,0.05)",border:"none",borderRadius:"6px",padding:"6px 12px",color:"#a1a1aa",fontSize:"12px",cursor:"pointer"}}>全部</button>
        </div>
      </div>)}
    </div>
  );

  const renderLogin = () => (
    <div style={{minHeight:"100vh",backgroundColor:"#0a0a0c",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none"}}><div style={{position:"absolute",top:0,left:"25%",width:"384px",height:"384px",backgroundColor:"rgba(139,92,246,0.1)",borderRadius:"9999px",filter:"blur(96px)"}} /><div style={{position:"absolute",bottom:0,right:"25%",width:"384px",height:"384px",backgroundColor:"rgba(147,51,234,0.1)",borderRadius:"9999px",filter:"blur(96px)"}} /></div>
      <div style={{width:"100%",maxWidth:"400px",backgroundColor:"rgba(255,255,255,0.03)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"24px",padding:"40px",position:"relative"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{width:"64px",height:"64px",borderRadius:"16px",background:"linear-gradient(135deg,#8b5cf6,#9333ea)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Brain size={32} color="#fff" /></div>
          <h1 style={{fontSize:"24px",fontWeight:"bold",color:"#fff",marginBottom:"8px"}}>第二大脑</h1><p style={{color:"#71717a",fontSize:"14px"}}>请输入访问密码</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:"24px"}}>
            <label style={{display:"block",color:"#a1a1aa",fontSize:"14px",marginBottom:"8px"}}>访问密码</label>
            <div style={{position:"relative"}}>
              <Lock size={18} style={{position:"absolute",left:"16px",top:"50%",transform:"translateY(-50%)",color:"#71717a"}} />
              <input type={showPassword?"text":"password"} value={loginPassword} onChange={(e)=>{setLoginPassword(e.target.value);setLoginError(false);}} placeholder="请输入密码" style={{width:"100%",backgroundColor:"rgba(255,255,255,0.03)",border:loginError?"1px solid #ef4444":"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"14px 48px",color:"#fff",fontSize:"16px",outline:"none"}} />
              <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{position:"absolute",right:"16px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#71717a",cursor:"pointer",padding:"4px"}}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button>
            </div>
            {loginError && <p style={{color:"#ef4444",fontSize:"14px",marginTop:"8px"}}>密码错误，请重试</p>}
          </div>
          <button type="submit" disabled={!loginPassword||loggingIn} style={{width:"100%",background:loginPassword?"linear-gradient(135deg,#8b5cf6,#9333ea)":"rgba(255,255,255,0.1)",border:"none",borderRadius:"12px",padding:"14px",color:loginPassword?"#fff":"#71717a",fontSize:"16px",fontWeight:"600",cursor:loginPassword?"pointer":"not-allowed"}}>{loggingIn?"验证中...":"登录"}</button>
        </form>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <aside style={{width:"256px",backgroundColor:"rgba(255,255,255,0.03)",backdropFilter:"blur(20px)",borderRight:"1px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",height:"100vh"}}>
      <div style={{padding:"24px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <h1 style={{fontSize:"20px",fontWeight:"bold",display:"flex",alignItems:"center",gap:"12px"}}><div style={{width:"36px",height:"36px",borderRadius:"10px",background:"linear-gradient(135deg,#8b5cf6,#9333ea)",display:"flex",alignItems:"center",justifyContent:"center"}}><Brain size={20} color="#fff" /></div><span className="text-gradient">第二大脑</span></h1>
        <p style={{fontSize:"12px",color:"#71717a",marginTop:"8px"}}>知识管理 · 记忆提取 · 任务追踪</p>
      </div>
      <nav style={{flex:1,padding:"16px"}}>
        <ul style={{listStyle:"none"}}>
          {[{key:"home",icon:Home,label:"仪表盘",tab:"home" as TabType,badge:null},{key:"memories",icon:Brain,label:"记忆库",tab:"memories" as TabType,badge:filteredMemories.length},{key:"documents",icon:FileText,label:"文档库",tab:"documents" as TabType,badge:filteredDocuments.length},{key:"tasks",icon:CheckSquare,label:"任务中心",tab:"tasks" as TabType,badge:stats.errorTasks>0?stats.errorTasks:null}].map(item => (<li key={item.key}><button onClick={()=>setActiveTab(item.tab)} style={navButtonStyle(activeTab===item.tab,item.key)} onMouseEnter={()=>setHovered(item.key)} onMouseLeave={()=>setHovered(null)}><item.icon size={20}/><span>{item.label}</span>{item.badge!==null && <span style={{marginLeft:"auto",backgroundColor:item.badge>0?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.1)",color:item.badge>0?"#ef4444":"#a1a1aa",padding:"2px 8px",borderRadius:"6px",fontSize:"12px"}}>{item.badge}</span>}</button></li>))}
        </ul>
      </nav>
      <div style={{padding:"16px",borderTop:"1px solid rgba(255,255,255,0.08)"}}><button onClick={handleLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:"8px",backgroundColor:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"10px 12px",color:"#71717a",cursor:"pointer",fontSize:"14px"}}><LogOut size={16}/>退出登录</button></div>
    </aside>
  );

  const renderHome = () => (
    <div style={{padding:"32px"}} className="animate-fadeIn">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"32px"}}><div><h2 style={{fontSize:"30px",fontWeight:"bold",marginBottom:"8px"}}><span className="text-gradient">欢迎回来</span></h2><p style={{color:"#71717a"}}>这是你的第二大脑，随时为你服务</p></div>{renderDateFilter()}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"32px"}}>
        {[{icon:Brain,label:"记忆总数",value:filteredMemories.length,gradient:"gradient-violet",key:"s1"},{icon:FileText,label:"文档总数",value:filteredDocuments.length,gradient:"gradient-blue",key:"s2"},{icon:CheckCircle,label:"运行中任务",value:stats.activeTasks,gradient:"gradient-emerald",key:"s3"},{icon:XCircle,label:"异常任务",value:stats.errorTasks,gradient:"gradient-amber",key:"s4"}].map(s => (<div key={s.key} style={cardStyle(s.key)} onMouseEnter={()=>setHovered(s.key)} onMouseLeave={()=>setHovered(null)}><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}><div style={iconBox(s.gradient)}><s.icon size={20} color="#fff"/></div><span style={{color:"#a1a1aa"}}>{s.label}</span></div><p style={{fontSize:"36px",fontWeight:"bold"}} className="text-gradient">{s.value}</p></div>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"16px",marginBottom:"32px"}}>
        {features.map((f,i) => (<div key={i} style={cardStyle("f"+i)} onMouseEnter={()=>setHovered("f"+i)} onMouseLeave={()=>setHovered(null)}><div style={iconBox(f.gradient)}><f.icon size={24} color="#fff"/></div><h3 style={{fontSize:"18px",fontWeight:"600",color:"#fff",marginTop:"16px",marginBottom:"8px"}}>{f.title}</h3><p style={{fontSize:"14px",color:"#a1a1aa"}}>{f.desc}</p></div>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(400px,1fr))",gap:"24px"}}>
        <div style={cardStyle("recent1")}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px",paddingBottom:"16px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}><h3 style={{fontWeight:"600",display:"flex",alignItems:"center",gap:"8px"}}><Brain size={20} style={{color:"#8b5cf6"}}/><span style={{color:"#fff"}}>最近记忆</span></h3><button onClick={()=>setActiveTab("memories")} style={{background:"none",border:"none",color:"#8b5cf6",cursor:"pointer",fontSize:"14px"}}>查看全部 <ChevronRight size={16}/></button></div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {filteredMemories.slice(0,3).map(m => (<div key={m.id} style={cardSmallStyle("m"+m.id)} onMouseEnter={()=>setHovered("m"+m.id)} onMouseLeave={()=>setHovered(null)} onClick={()=>{setSelectedItem(m);setActiveTab("memories");}}><div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>{getTypeIcon(m.type)}<span style={{fontSize:"14px",fontWeight:"500",color:"#fff"}}>{m.title}</span></div><p style={{fontSize:"12px",color:"#71717a"}} className="line-clamp-2">{m.content}</p></div>))}
            {filteredMemories.length===0 && <p style={{color:"#52525b",fontSize:"14px",textAlign:"center",padding:"20px"}}>暂无数据</p>}
          </div>
        </div>
        <div style={cardStyle("recent2")}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px",paddingBottom:"16px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}><h3 style={{fontWeight:"600",display:"flex",alignItems:"center",gap:"8px"}}><CheckSquare size={20} style={{color:"#10b981"}}/><span style={{color:"#fff"}}>任务状态</span></h3><button onClick={()=>setActiveTab("tasks")} style={{background:"none",border:"none",color:"#10b981",cursor:"pointer",fontSize:"14px"}}>查看全部 <ChevronRight size={16}/></button></div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{tasks.slice(0,4).map(t => (<div key={t.id} style={cardSmallStyle("t"+t.id)} onMouseEnter={()=>setHovered("t"+t.id)} onMouseLeave={()=>setHovered(null)}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:"12px"}}>{getStatusIcon(t.status)}<span style={{fontSize:"14px",fontWeight:"500",color:"#fff"}}>{t.name}</span></div><span style={{fontSize:"12px",color:"#71717a"}}>{t.schedule}</span></div></div>))}</div>
        </div>
      </div>
    </div>
  );

  const renderMemories = () => (
    <div style={{padding:"32px"}} className="animate-fadeIn">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px"}}><h2 style={{fontSize:"24px",fontWeight:"bold",display:"flex",alignItems:"center",gap:"12px"}}><div style={iconBox("gradient-violet")}><Brain size={20} color="#fff"/></div><span className="text-gradient">记忆库</span></h2>{renderDateFilter()}</div>
      <div style={{position:"relative",marginBottom:"24px"}}><Search size={20} style={{position:"absolute",left:"16px",top:"50%",transform:"translateY(-50%)",color:"#71717a"}}/><input type="text" placeholder="搜索记忆..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} style={{width:"100%",backgroundColor:"rgba(255,255,255,0.03)",border:hovered==="search"?"1px solid rgba(139,92,246,0.5)":"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"12px 16px 12px 48px",color:"#fff",fontSize:"14px"}} onMouseEnter={()=>setHovered("search")} onMouseLeave={()=>setHovered(null)}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        {filteredMemories.filter(m=>m.title.toLowerCase().includes(searchQuery.toLowerCase())||m.content?.toLowerCase().includes(searchQuery.toLowerCase())).map(m=>(<div key={m.id} onClick={()=>setSelectedItem(m)} style={cardStyle("ml"+m.id)} onMouseEnter={()=>setHovered("ml"+m.id)} onMouseLeave={()=>setHovered(null)}><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>{getTypeIcon(m.type)}<h3 style={{fontWeight:"600",color:"#fff",flex:1}}>{m.title}</h3><span style={{fontSize:"12px",color:"#71717a"}}>{m.date}</span></div><p style={{fontSize:"14px",color:"#a1a1aa"}} className="line-clamp-2">{m.content}</p></div>))}
        {filteredMemories.length===0 && <p style={{color:"#52525b",fontSize:"14px",textAlign:"center",padding:"40px"}}>暂无记忆数据</p>}
      </div>
      {selectedItem && selectedItem.content && (<div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",zIndex:50}}><div style={cardStyle("modal")}><div style={{padding:"24px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between"}}><h3 style={{fontSize:"20px",fontWeight:"bold",color:"#fff",display:"flex",alignItems:"center",gap:"8px"}}>{getTypeIcon(selectedItem.type)}{selectedItem.title}</h3><button onClick={()=>setSelectedItem(null)} style={{background:"none",border:"none",color:"#71717a",cursor:"pointer"}}><X size={20}/></button></div><div style={{padding:"24px"}}><p style={{color:"#d4d4d8",whiteSpace:"pre-wrap"}}>{selectedItem.content}</p></div></div></div>)}
    </div>
  );

  const renderDocuments = () => (
    <div style={{padding:"32px"}} className="animate-fadeIn">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px"}}><h2 style={{fontSize:"24px",fontWeight:"bold",display:"flex",alignItems:"center",gap:"12px"}}><div style={iconBox("gradient-blue")}><FileText size={20} color="#fff"/></div><span className="text-gradient">文档库</span></h2>{renderDateFilter()}</div>
      <div style={{position:"relative",marginBottom:"24px"}}><Search size={20} style={{position:"absolute",left:"16px",top:"50%",transform:"translateY(-50%)",color:"#71717a"}}/><input type="text" placeholder="搜索文档..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} style={{width:"100%",backgroundColor:"rgba(255,255,255,0.03)",border:hovered==="docsearch"?"1px solid rgba(59,130,246,0.5)":"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"12px 16px 12px 48px",color:"#fff",fontSize:"14px"}} onMouseEnter={()=>setHovered("docsearch")} onMouseLeave={()=>setHovered(null)}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        {filteredDocuments.filter(d=>d.title.toLowerCase().includes(searchQuery.toLowerCase())||d.path.toLowerCase().includes(searchQuery.toLowerCase())).map(doc=>(<div key={doc.id} onClick={()=>setSelectedItem(doc)} style={cardStyle("d"+doc.id)} onMouseEnter={()=>setHovered("d"+doc.id)} onMouseLeave={()=>setHovered(null)}><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>{getDocIcon(doc.type)}<h3 style={{fontWeight:"600",color:"#fff",flex:1}}>{doc.title}</h3><span style={{fontSize:"12px",backgroundColor:"rgba(255,255,255,0.1)",padding:"4px 8px",borderRadius:"6px",color:"#a1a1aa"}}>{doc.type}</span><span style={{fontSize:"12px",color:"#71717a"}}>{doc.date}</span></div><p style={{fontSize:"12px",color:"#71717a"}}>{doc.path}</p></div>))}
        {filteredDocuments.length===0 && <p style={{color:"#52525b",fontSize:"14px",textAlign:"center",padding:"40px"}}>暂无文档数据</p>}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div style={{padding:"32px"}} className="animate-fadeIn">
      <h2 style={{fontSize:"24px",fontWeight:"bold",marginBottom:"24px",display:"flex",alignItems:"center",gap:"12px"}}><div style={iconBox("gradient-emerald")}><CheckSquare size={20} color="#fff"/></div><span className="text-gradient">任务中心</span></h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"24px"}}>
        {[{icon:CheckCircle,label:"正常运行",value:stats.activeTasks,color:"#10b981",key:"ts1"},{icon:XCircle,label:"异常任务",value:stats.errorTasks,color:"#ef4444",key:"ts2"},{icon:Clock,label:"总任务数",value:tasks.length,color:"#3b82f6",key:"ts3"}].map(s=>(<div key={s.key} style={cardStyle(s.key)} onMouseEnter={()=>setHovered(s.key)} onMouseLeave={()=>setHovered(null)}><div style={{display:"flex",alignItems:"center",gap:"16px"}}><s.icon size={32} style={{color:s.color}}/><div><p style={{fontSize:"24px",fontWeight:"bold",color:"#fff"}}>{s.value}</p><p style={{fontSize:"12px",color:"#71717a"}}>{s.label}</p></div></div></div>))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        {tasks.filter(t=>t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(task=>(<div key={task.id} style={cardStyle("tl"+task.id,task.status==="error")} onMouseEnter={()=>setHovered("tl"+task.id)} onMouseLeave={()=>setHovered(null)}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}><div style={{display:"flex",alignItems:"center",gap:"12px"}}>{getStatusIcon(task.status)}<h3 style={{fontWeight:"600",color:"#fff"}}>{task.name}</h3>{task.error_count>0 && <span style={{backgroundColor:"rgba(239,68,68,0.2)",color:"#ef4444",padding:"4px 8px",borderRadius:"6px",fontSize:"12px"}}>{task.error_count}次错误</span>}</div><span style={{fontSize:"12px",color:"#71717a",backgroundColor:"rgba(255,255,255,0.1)",padding:"4px 8px",borderRadius:"6px"}}>{task.schedule}</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",fontSize:"14px"}}><div><p style={{color:"#71717a",fontSize:"12px"}}>上次运行</p><p style={{color:"#fff"}}>{task.last_run}</p></div><div><p style={{color:"#71717a",fontSize:"12px"}}>运行时长</p><p style={{color:"#fff"}}
