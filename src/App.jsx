import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Coins, 
  TrendingDown, 
  Settings2, 
  Calculator,
  Info,
  ChevronRight,
  CheckCircle2,
  ArrowDownCircle,
  Layers,
  FileText,
  Printer,
  X,
  Save,
  RotateCcw,
  ShieldCheck,
  UserPlus,
  PieChart,
  BarChart3,
  History,
  TrendingUp,
  Calendar,
  Trash2,
  Edit2,
  GraduationCap,
  Plus,
  Loader2,
  LogIn,
  LogOut,
  BookOpen,
  Image as ImageIcon,
  Key,
  Copy,
  Eye,
  MessageSquare,
  Bell,
  Clock,
  AlertTriangle,
  Megaphone
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot, query, serverTimestamp, addDoc, updateDoc, getDocs, where } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyArYfL-wE_F0OF3QNl5_jh_B7ZXr7Ev5fg",
    authDomain: "creatte-sponser-app.firebaseapp.com",
    projectId: "creatte-sponser-app",
    storageBucket: "creatte-sponser-app.firebasestorage.app",
    messagingSenderId: "753873131194",
    appId: "1:753873131194:web:496a6913a523139c7e1483",
    measurementId: "G-LVQ6WXT9L3"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'clayette-edu-system';

const COURSE_BASES = [
  { id: 'premium', label: '月4回コース', price: 12000 },
  { id: 'standard', label: '月3回コース', price: 10000 },
  { id: 'basic', label: '月2回コース', price: 8000 },
  { id: 'entry', label: '月1回コース', price: 5000 },
];

// --- ユーティリティ: ID・パスワード生成 ---
const generateCredentials = () => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const gen = (len) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return { id: gen(6), pw: gen(8) };
};

const App = () => {
  // --- Auth & Role State ---
  const [currentUser, setCurrentUser] = useState(null); // { role, id, name, studentId? }
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- UI State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReport, setShowReport] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // --- Data State ---
  const [costs, setCosts] = useState({ '家賃': 150000, '水道光熱費': 30000, '講師費用': 200000, '教材費': 50000, '備品費': 20000 });
  const [sponsorship, setSponsorship] = useState(300000);
  const [bufferStudentTarget, setBufferStudentTarget] = useState(5); 
  const [historyRecords, setHistoryRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [learningRecords, setLearningRecords] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recordMonth, setRecordMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isRecording, setIsRecording] = useState(false);

  // --- Student Form State ---
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', school: '', age: '', courseId: 'premium', remarks: '', nextClassDate: '' });
  const [generatedCreds, setGeneratedCreds] = useState(null);

  // --- Learning Record Form ---
  const [newLearningRecord, setNewLearningRecord] = useState({ title: '', content: '', imageUrl: '' });
  const [adminComment, setAdminComment] = useState({}); // recordId -> comment text

  // --- Announcement Form ---
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', type: 'info' });

  // --- Firebase Auth & Listeners ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    // データ購読
    const unsubRecords = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'monthly_records'), (snap) => {
      setHistoryRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.month.localeCompare(b.month)));
    });
    const unsubStudents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'students'), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAnnounce = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    });
    const unsubLearning = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'learning_records'), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (currentUser.role === 'student') {
        setLearningRecords(all.filter(r => r.studentId === currentUser.studentId));
      } else if (currentUser.role === 'parent') {
        setLearningRecords(all.filter(r => r.studentId === currentUser.childId));
      } else {
        setLearningRecords(all);
      }
    });

    return () => { unsubRecords(); unsubStudents(); unsubAnnounce(); unsubLearning(); };
  }, [currentUser]);

  // --- ログイン処理 ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (loginId === 'admin' && password === 'admin123') {
      setCurrentUser({ role: 'admin', name: 'システム管理者' });
      return;
    }
    const studentsCol = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const q = query(studentsCol);
    const querySnapshot = await getDocs(q);
    let found = null;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.studentLoginId === loginId && data.studentPassword === password) {
        found = { role: 'student', name: data.name, studentId: docSnap.id, nextClassDate: data.nextClassDate };
      } else if (data.parentLoginId === loginId && data.parentPassword === password) {
        found = { role: 'parent', name: `${data.name}の保護者`, childId: docSnap.id, childName: data.name, nextClassDate: data.nextClassDate };
      }
    });
    if (found) { setCurrentUser(found); setActiveTab(found.role === 'admin' ? 'dashboard' : 'mypage'); }
    else { setAuthError('IDまたはパスワードが正しくありません'); }
  };

  const handleLogout = () => { setCurrentUser(null); setLoginId(''); setPassword(''); };

  // --- 計算ロジック ---
  const studentCountsFromDb = useMemo(() => {
    const counts = { premium: 0, standard: 0, basic: 0, entry: 0 };
    students.forEach(s => { if (counts[s.courseId] !== undefined) counts[s.courseId]++; });
    return counts;
  }, [students]);

  const totalOperatingCost = useMemo(() => Object.values(costs).reduce((acc, curr) => acc + curr, 0), [costs]);
  const totalStudents = students.length;
  const totalBaseRevenue = COURSE_BASES.reduce((acc, c) => acc + (c.price * (studentCountsFromDb[c.id] || 0)), 0);
  const bufferAmount = bufferStudentTarget * COURSE_BASES[0].price;
  const availableSurplus = (totalBaseRevenue + sponsorship) - (totalOperatingCost + bufferAmount);
  const reductionPerStudent = totalStudents === 0 ? 0 : Math.max(0, Math.floor(availableSurplus / totalStudents / 1000) * 1000);
  const coverageRate = Math.min(100, totalOperatingCost > 0 ? Math.round((sponsorship / totalOperatingCost) * 100) : 0);

  // --- 生徒登録・ID発行 ---
  const saveStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', editingStudent.id), {
          ...studentForm, updatedAt: serverTimestamp()
        });
        setSaveMessage('更新しました');
      } else {
        const studentCreds = generateCredentials();
        const parentCreds = generateCredentials();
        const data = {
          ...studentForm,
          studentLoginId: studentCreds.id, studentPassword: studentCreds.pw,
          parentLoginId: parentCreds.id, parentPassword: parentCreds.pw,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), data);
        setGeneratedCreds({ student: studentCreds, parent: parentCreds, name: studentForm.name });
        setSaveMessage('登録・ID発行が完了しました');
      }
      setStudentForm({ name: '', school: '', age: '', courseId: 'premium', remarks: '', nextClassDate: '' });
      setEditingStudent(null);
    } catch (e) { setSaveMessage('エラーが発生しました'); }
    setTimeout(() => setSaveMessage(''), 4000);
  };

  // --- お知らせ投稿 ---
  const postAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), {
        ...announcementForm, createdAt: serverTimestamp()
      });
      setAnnouncementForm({ title: '', content: '', type: 'info' });
      setSaveMessage('お知らせを公開しました');
    } catch (e) { setSaveMessage('失敗しました'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // --- 学習記録投稿 ---
  const submitLearningRecord = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'learning_records'), {
        ...newLearningRecord,
        studentId: currentUser.studentId, studentName: currentUser.name,
        date: new Date().toISOString(), createdAt: serverTimestamp(),
        comment: ''
      });
      setNewLearningRecord({ title: '', content: '', imageUrl: '' });
      setSaveMessage('保存しました');
    } catch (e) { setSaveMessage('保存に失敗しました'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // --- 管理者コメント追加 ---
  const submitAdminComment = async (recordId) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'learning_records', recordId), {
        comment: adminComment[recordId],
        commentedAt: serverTimestamp()
      });
      setSaveMessage('コメントを送信しました');
    } catch (e) { setSaveMessage('送信失敗'); }
  };

  // --- サブコンポーネント: TrendChart ---
  const TrendChart = () => {
    if (historyRecords.length < 2) return <div className="h-32 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed text-xs text-slate-400">履歴データ不足</div>;
    const maxVal = Math.max(...historyRecords.map(r => Math.max(r.totalCost || 0, r.sponsorship || 0))) * 1.2;
    const points = (valKey) => historyRecords.map((r, i) => `${(i/(historyRecords.length-1))*100},${100 - ((r[valKey]||0)/maxVal)*100}`).join(' ');
    return (
      <div className="w-full bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative mb-6">
        <div className="flex justify-between items-center mb-4 text-[10px] font-bold tracking-widest">
           <div className="flex items-center gap-2 text-orange-400 uppercase"><TrendingUp size={14} /> 年間推移</div>
           <div className="flex gap-4">
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div>協賛</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div>運営</span>
           </div>
        </div>
        <svg viewBox="0 0 100 100" className="w-full h-24 overflow-visible" preserveAspectRatio="none">
          <polyline fill="none" stroke="#64748b" strokeWidth="1" points={points('totalCost')} />
          <polyline fill="none" stroke="#f97316" strokeWidth="2" points={points('sponsorship')} />
        </svg>
      </div>
    );
  };

  // --- ログイン画面 ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6 text-left">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-orange-100 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-2">
            <div className="bg-orange-600 w-16 h-16 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-200">
              <Calculator size={32} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-800 uppercase">Clayette Portal</h1>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase">Education & Support System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Login ID</label>
                <div className="relative">
                  <input type="text" value={loginId} onChange={e=>setLoginId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" />
                  <Users className="absolute right-4 top-3.5 text-slate-300" size={16} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Password</label>
                <div className="relative">
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" />
                  <Key className="absolute right-4 top-3.5 text-slate-300" size={16} />
                </div>
              </div>
            </div>
            {authError && <p className="text-rose-500 text-[10px] font-bold text-center bg-rose-50 py-2 rounded-xl">{authError}</p>}
            <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2"><LogIn size={18} /> ログイン</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left overflow-x-hidden">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg shadow-orange-100"><Calculator size={20} /></div>
            <span className="font-black tracking-tighter text-slate-800 hidden sm:inline uppercase">Clayette System</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {currentUser.role === 'admin' ? (
                <>
                  <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>分析</button>
                  <button onClick={() => setActiveTab('students')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'students' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>生徒管理</button>
                  <button onClick={() => setActiveTab('notices')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'notices' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>お知らせ</button>
                </>
              ) : (
                <button onClick={() => setActiveTab('mypage')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-orange-600 shadow-sm`}>マイページ</button>
              )}
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-600"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        
        {saveMessage && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce"><CheckCircle2 size={18} className="text-emerald-400" /><span className="text-sm font-bold">{saveMessage}</span></div>}

        {/* --- 共通: お知らせ表示（受講生・保護者向け） --- */}
        {currentUser.role !== 'admin' && announcements.length > 0 && (
          <div className="mb-8 space-y-3">
             {announcements.slice(0, 1).map(notice => (
               <div key={notice.id} className="bg-orange-600 text-white p-4 rounded-2xl shadow-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                 <div className="bg-white/20 p-2 rounded-xl"><Megaphone size={20} /></div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">重要なお知らせ</p>
                    <h4 className="font-black text-sm">{notice.title}</h4>
                    <p className="text-xs mt-1 font-medium text-orange-50">{notice.content}</p>
                 </div>
               </div>
             ))}
          </div>
        )}

        {/* --- 管理者：お知らせ管理 --- */}
        {currentUser.role === 'admin' && activeTab === 'notices' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="text-left"><h2 className="text-2xl font-black text-slate-800 tracking-tight">お知らせ・緊急連絡管理</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 h-fit">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">新規投稿</h3>
                <form onSubmit={postAnnouncement} className="space-y-4">
                  <input type="text" required value={announcementForm.title} onChange={e=>setAnnouncementForm({...announcementForm, title:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" placeholder="タイトル" />
                  <textarea required value={announcementForm.content} onChange={e=>setAnnouncementForm({...announcementForm, content:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-32 resize-none" placeholder="本文" />
                  <select value={announcementForm.type} onChange={e=>setAnnouncementForm({...announcementForm, type:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
                    <option value="info">通常のお知らせ</option>
                    <option value="emergency">緊急・重要連絡</option>
                  </select>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-3.5 rounded-xl shadow-lg hover:bg-orange-700 flex items-center justify-center gap-2"><Plus size={18} /> 公開する</button>
                </form>
              </div>
              <div className="md:col-span-2 space-y-4">
                {announcements.map(notice => (
                  <div key={notice.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-start group">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                         <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${notice.type === 'emergency' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>{notice.type}</span>
                         <span className="text-[10px] font-bold text-slate-400">{notice.createdAt?.toDate().toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-black text-slate-800">{notice.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{notice.content}</p>
                    </div>
                    <button onClick={async()=>{await deleteDoc(doc(db,'artifacts',appId,'public','data','announcements',notice.id));}} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- 管理者：ダッシュボード --- */}
        {currentUser.role === 'admin' && activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-left">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">受講料・協賛金シミュレーター</h2>
                <p className="text-slate-400 text-sm font-medium">運営の透明性と教育格差の解消に向けた分析</p>
              </div>
            </header>
            <TrendChart />
            {/* シミュレーター本体 (前バージョン継承) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 text-left h-fit">
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-widest"><Settings2 size={14} className="text-orange-500" /> 運営コスト設定</div>
                  {Object.entries(costs).map(([key, value]) => (
                    <div key={key}><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{key}</label><input type="number" value={value} onChange={(e) => handleCostChange(key, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" /></div>
                  ))}
               </div>
               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-orange-600 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-orange-100">
                    <div>
                      <p className="text-orange-100 text-[10px] font-bold uppercase mb-3">一律還元額</p>
                      <div className="flex items-center gap-4"><ArrowDownCircle size={40} className="text-orange-200" /><span className="text-6xl font-black tracking-tighter">¥{reductionPerStudent.toLocaleString()}</span></div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-center min-w-[140px]"><p className="text-[10px] font-bold mb-1 opacity-80 uppercase">補填率</p><p className="text-3xl font-black">{coverageRate}%</p></div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 relative overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">企業協賛金 総額</p>
                    <p className="text-5xl font-black text-orange-600 tracking-tighter mb-8">¥{sponsorship.toLocaleString()}</p>
                    <input type="range" min="0" max="2000000" step="10000" value={sponsorship} onChange={(e) => setSponsorship(parseInt(e.target.value))} className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-orange-600" />
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- 管理者：生徒管理 --- */}
        {currentUser.role === 'admin' && activeTab === 'students' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="text-left"><h2 className="text-2xl font-black text-slate-800 tracking-tight">生徒・保護者アカウント管理</h2></header>
            
            {generatedCreds && (
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl space-y-4 border-2 border-orange-500 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 text-orange-400 font-bold"><Key size={20} /> <span>アカウントを発行しました: {generatedCreds.name}様</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10"><p className="text-[10px] font-bold text-orange-300 mb-1 uppercase">生徒用</p><p className="text-sm font-bold">ID: {generatedCreds.student.id} / PW: {generatedCreds.student.pw}</p></div>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10"><p className="text-[10px] font-bold text-orange-300 mb-1 uppercase">保護者用</p><p className="text-sm font-bold">ID: {generatedCreds.parent.id} / PW: {generatedCreds.parent.pw}</p></div>
                </div>
                <button onClick={()=>setGeneratedCreds(null)} className="w-full bg-white/10 hover:bg-white/20 text-[10px] font-black py-2 rounded-xl uppercase tracking-widest">閉じる（この情報は再度表示されません）</button>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 h-fit sticky top-24">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{editingStudent ? '生徒編集' : '生徒登録'}</h3>
                <form onSubmit={saveStudent} className="space-y-4">
                  <input type="text" required value={studentForm.name} onChange={e=>setStudentForm({...studentForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" placeholder="生徒名" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={studentForm.school} onChange={e=>setStudentForm({...studentForm, school: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" placeholder="学校名" />
                    <input type="number" value={studentForm.age} onChange={e=>setStudentForm({...studentForm, age: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" placeholder="年齢" />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">次回の授業日</label>
                     <input type="date" value={studentForm.nextClassDate} onChange={e=>setStudentForm({...studentForm, nextClassDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                  </div>
                  <select value={studentForm.courseId} onChange={e=>setStudentForm({...studentForm, courseId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
                    {COURSE_BASES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 flex items-center justify-center gap-2"><UserPlus size={18} /> {editingStudent ? '保存する' : 'ID発行と登録'}</button>
                  {editingStudent && <button onClick={()=>{setEditingStudent(null); setStudentForm({name:'',school:'',age:'',courseId:'premium',remarks:'',nextClassDate:''})}} className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-2">キャンセル</button>}
                </form>
              </div>

              <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-200 group hover:border-orange-500 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={()=>{setEditingStudent(s); setStudentForm(s); window.scrollTo(0,0);}} className="p-2 bg-slate-50 text-slate-400 hover:text-orange-600 rounded-lg"><Edit2 size={14} /></button>
                       <button onClick={()=>deleteStudent(s.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-800">{s.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.school} | {s.age}歳</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                         <div className="bg-orange-50 px-3 py-1 rounded-full text-orange-600 text-[10px] font-black border border-orange-100 flex items-center gap-1.5"><Clock size={10} /> 次回: {s.nextClassDate || '未設定'}</div>
                         <div className="bg-slate-50 px-3 py-1 rounded-full text-slate-500 text-[10px] font-black border border-slate-100">{COURSE_BASES.find(c=>c.id===s.courseId)?.label}</div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-50 grid grid-cols-2 gap-2 text-[10px] font-bold">
                       <div className="text-slate-400">生徒ID: <span className="text-slate-900">{s.studentLoginId}</span></div>
                       <div className="text-slate-400">保護者ID: <span className="text-slate-900">{s.parentLoginId}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- 受講生・保護者：マイページ --- */}
        {(currentUser.role === 'student' || currentUser.role === 'parent') && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="text-left">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{currentUser.name}様 ログイン中</h2>
                <p className="text-slate-400 text-sm font-medium">{currentUser.role === 'student' ? '今日学んだことを記録しましょう' : `${currentUser.childName}さんのポートフォリオを閲覧中`}</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl flex flex-wrap gap-8 items-center">
                 <div className="text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1.5"><Clock size={12} className="text-orange-500" /> 次回の授業日</p>
                   <p className="text-2xl font-black text-slate-800">{currentUser.nextClassDate || '未設定'}</p>
                 </div>
                 <div className="w-px h-10 bg-slate-100 hidden sm:block"></div>
                 <div className="text-left text-orange-600">
                   <p className="text-[10px] font-black uppercase mb-1 opacity-60">今月の支援軽減額</p>
                   <p className="text-2xl font-black tracking-tighter">¥{reductionPerStudent.toLocaleString()}</p>
                 </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* 生徒のみ：投稿フォーム */}
              {currentUser.role === 'student' && (
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 h-fit sticky top-24">
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-widest text-left"><BookOpen size={16} className="text-orange-500" /> 学習記録を作成</div>
                  <form onSubmit={submitLearningRecord} className="space-y-4">
                    <input type="text" value={newLearningRecord.title} onChange={e=>setNewLearningRecord({...newLearningRecord, title:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" placeholder="タイトル" required />
                    <textarea value={newLearningRecord.content} onChange={e=>setNewLearningRecord({...newLearningRecord, content:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-32 resize-none" placeholder="今日の学習内容や作品の説明" required />
                    <input type="text" value={newLearningRecord.imageUrl} onChange={e=>setNewLearningRecord({...newLearningRecord, imageUrl:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" placeholder="作品の画像URL (任意)" />
                    <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2"><Plus size={20} /> 記録を保存</button>
                  </form>
                </div>
              )}

              {/* タイムライン表示 */}
              <div className={`${currentUser.role === 'student' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6`}>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                   <ImageIcon size={22} className="text-orange-500" /> 学習・制作のあゆみ
                </h3>
                {learningRecords.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</div>
                ) : (
                  <div className="space-y-6">
                    {learningRecords.sort((a,b) => b.date.localeCompare(a.date)).map(record => (
                      <div key={record.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all text-left">
                        {record.imageUrl && (
                          <div className="md:w-64 h-48 md:h-auto bg-slate-100 flex-shrink-0">
                            <img src={record.imageUrl} alt="成果物" className="w-full h-full object-cover" onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=400';}} />
                          </div>
                        )}
                        <div className="p-8 flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">{new Date(record.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              <h4 className="text-xl font-black text-slate-800">{record.title}</h4>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">{record.content}</p>
                          
                          {/* 管理者コメント（存在する場合） */}
                          {record.comment && (
                             <div className="mt-6 bg-orange-50/50 border border-orange-100 p-5 rounded-2xl space-y-2">
                                <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest"><MessageSquare size={14} /> Administrator Feedback</div>
                                <p className="text-sm text-slate-700 font-bold italic leading-relaxed">"{record.comment}"</p>
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- 管理者：学習記録へのコメント（全体監視用） --- */}
        {currentUser.role === 'admin' && activeTab === 'dashboard' && (
           <div className="mt-12 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><MessageSquare className="text-orange-500" /> 全受講生の最新投稿とフィードバック</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {learningRecords.slice(0, 10).map(record => (
                  <div key={record.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-4 shadow-sm text-left">
                     <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{record.studentName} | {new Date(record.date).toLocaleDateString()}</p>
                          <h4 className="font-black text-slate-800">{record.title}</h4>
                        </div>
                     </div>
                     <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{record.content}</p>
                     <div className="pt-4 border-t border-slate-50 space-y-3">
                        <label className="text-[10px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2"><Plus size={12}/> コメントを残す</label>
                        <div className="flex gap-2">
                           <input 
                             type="text" 
                             defaultValue={record.comment}
                             onBlur={(e)=>setAdminComment({...adminComment, [record.id]: e.target.value})}
                             className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white transition-all outline-none" 
                             placeholder="フィードバックを入力..." 
                           />
                           <button onClick={()=>submitAdminComment(record.id)} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-orange-600 transition-colors"><ChevronRight size={18} /></button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        )}
      </div>

      <footer className="mt-20 py-10 border-t border-slate-200 text-center text-slate-300 text-[10px] font-black tracking-[0.5em] uppercase">
        Clayette Educational Management Platform
      </footer>

      {showReport && <ReportModal />}

      <style>{`
        @media print { .print\\:hidden { display: none !important; } .print\\:bg-white { background: white !important; } .print\\:p-10 { padding: 2.5rem !important; } body { overflow: visible !important; } }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: white; cursor: pointer; border-radius: 50%; border: 4px solid #ea580c; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .animate-bounce-slow { animation: bounce 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;