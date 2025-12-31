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
  Megaphone,
  ChevronDown,
  Tag,
  Link as LinkIcon,
  ShieldAlert,
  Mail,
  Building
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
  const gen = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return { id: gen(6), pw: gen(8) };
};

const App = () => {
  // --- Auth & Role State ---
  const [currentUser, setCurrentUser] = useState(null); 
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- UI State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReport, setShowReport] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // --- Data State ---
  const [costs, setCosts] = useState({ '家賃': 150000, '水道光熱費': 30000, '講師費用': 200000, '教材費': 50000, '備品費': 20000 });
  const [bufferStudentTarget, setBufferStudentTarget] = useState(5);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [learningRecords, setLearningRecords] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [recordMonth, setRecordMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isRecording, setIsRecording] = useState(false);

  // --- Student Form State ---
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ 
    name: '', school: '', age: '', courseId: 'premium', remarks: '', nextClassDate: '',
    studentLoginId: '', studentPassword: '', parentLoginId: '', parentPassword: ''
  });
  const [generatedCreds, setGeneratedCreds] = useState(null);

  // --- 学習記録 & お知らせフォーム ---
  const [newLearningRecord, setNewLearningRecord] = useState({ title: '', content: '', imageUrl: '' });
  const [adminComment, setAdminComment] = useState({});
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', type: 'info' });

  // --- 教材データ状態 ---
  const [materials, setMaterials] = useState([]);
  const [materialForm, setMaterialForm] = useState({ title: '', url: '', tags: '' });
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedTag, setSelectedTag] = useState('All');

  // --- 協賛企業フォーム状態 ---
  const [sponsorForm, setSponsorForm] = useState({ name: '', repName: '', email: '', amount: '' });
  const [editingSponsor, setEditingSponsor] = useState(null);

  // --- Firebase 認証 & リアルタイムリスナー ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, setCurrentUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Firestoreの全データを同期
    const unsubRecords = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'monthly_records'), (snap) => {
      setHistoryRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.month.localeCompare(b.month)));
    });
    const unsubStudents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'students'), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAnnounce = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    });
    const unsubLearning = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'learning_records'), (snap) => {
      setLearningRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubMaterials = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'materials'), (snap) => {
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    });
    const unsubSponsors = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sponsors'), (snap) => {
      setSponsors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { 
      unsubRecords(); unsubStudents(); unsubAnnounce(); 
      unsubLearning(); unsubMaterials(); unsubSponsors(); 
    };
  }, [currentUser]);

  // --- 計算ロジック ---
  const sponsorship = useMemo(() => sponsors.reduce((acc, s) => acc + (Number(s.amount) || 0), 0), [sponsors]);

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

  const finalNetSurplus = availableSurplus - (reductionPerStudent * totalStudents);
  const capacityPerCourse = useMemo(() => {
    const pool = finalNetSurplus + bufferAmount;
    return COURSE_BASES.map(course => ({
      ...course,
      count: Math.floor(pool / Math.max(1, course.price - reductionPerStudent))
    }));
  }, [finalNetSurplus, bufferAmount, reductionPerStudent]);

  // --- 各種ハンドラー ---
  const handleCostChange = (key, value) => setCosts(prev => ({ ...prev, [key]: parseInt(value) || 0 }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (loginId === 'admin' && password === 'admin123') {
      setCurrentUser({ role: 'admin', name: 'システム管理者' });
      setActiveTab('dashboard');
      return;
    }
    const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'students'));
    let found = null;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.studentLoginId === loginId && data.studentPassword === password) {
        found = { role: 'student', name: data.name, studentId: docSnap.id, nextClassDate: data.nextClassDate };
      } else if (data.parentLoginId === loginId && data.parentPassword === password) {
        found = { role: 'parent', name: `${data.name}の保護者`, childId: docSnap.id, childName: data.name, nextClassDate: data.nextClassDate };
      }
    });
    if (found) { setCurrentUser(found); setActiveTab('mypage'); }
    else { setAuthError('IDまたはパスワードが正しくありません'); }
  };

  const handleLogout = () => { setCurrentUser(null); setLoginId(''); setPassword(''); };

  const fillCredentials = () => {
    const s = generateCredentials();
    const p = generateCredentials();
    setStudentForm(prev => ({
      ...prev, studentLoginId: s.id, studentPassword: s.pw, parentLoginId: p.id, parentPassword: p.pw
    }));
  };

  const saveStudent = async (e) => {
    e.preventDefault();
    try {
      const sId = studentForm.studentLoginId || generateCredentials().id;
      const sPw = studentForm.studentPassword || generateCredentials().pw;
      const pId = studentForm.parentLoginId || generateCredentials().id;
      const pPw = studentForm.parentPassword || generateCredentials().pw;
      const data = { ...studentForm, studentLoginId: sId, studentPassword: sPw, parentLoginId: pId, parentPassword: pPw, updatedAt: serverTimestamp() };
      if (editingStudent) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', editingStudent.id), data);
        setSaveMessage('更新完了');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { ...data, createdAt: serverTimestamp() });
        setGeneratedCreds({ student: { id: sId, pw: sPw }, parent: { id: pId, pw: pPw }, name: studentForm.name });
        setSaveMessage('登録完了');
      }
      setStudentForm({ name: '', school: '', age: '', courseId: 'premium', remarks: '', nextClassDate: '', studentLoginId: '', studentPassword: '', parentLoginId: '', parentPassword: '' });
      setEditingStudent(null);
    } catch (e) { setSaveMessage('保存エラー'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const saveSponsor = async (e) => {
    e.preventDefault();
    try {
      const data = { ...sponsorForm, amount: Number(sponsorForm.amount) || 0, updatedAt: serverTimestamp() };
      if (editingSponsor) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sponsors', editingSponsor.id), data);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sponsors'), { ...data, createdAt: serverTimestamp() });
      }
      setSponsorForm({ name: '', repName: '', email: '', amount: '' });
      setEditingSponsor(null);
      setSaveMessage('保存しました');
    } catch (e) { setSaveMessage('保存エラー'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const deleteSponsor = async (id) => {
    if (!window.confirm('この企業を削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sponsors', id));
      setSaveMessage('削除しました');
    } catch (e) { setSaveMessage('失敗'); }
  };

  const recordMonthlyStatus = async () => {
    setIsRecording(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'monthly_records', recordMonth);
      await setDoc(docRef, {
        month: recordMonth, costs, sponsorship, bufferStudentTarget,
        totalCost: totalOperatingCost, studentCounts: studentCountsFromDb,
        totalStudents, reductionAmount: reductionPerStudent, recordedAt: serverTimestamp()
      });
      setSaveMessage('月次データを保存しました');
    } catch (e) { setSaveMessage('エラー'); }
    finally { setIsRecording(false); }
  };

  const saveMaterial = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = materialForm.tags.split(',').map(t => t.trim()).filter(t => t);
      const data = { ...materialForm, tags: tagsArray, updatedAt: serverTimestamp() };
      if (editingMaterial) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'materials', editingMaterial.id), data);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'materials'), { ...data, createdAt: serverTimestamp() });
      }
      setMaterialForm({ title: '', url: '', tags: '' });
      setEditingMaterial(null);
      setSaveMessage('教材保存完了');
    } catch (e) { setSaveMessage('エラー'); }
  };

  const submitLearningRecord = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'learning_records'), {
        ...newLearningRecord, studentId: currentUser.studentId, studentName: currentUser.name, date: new Date().toISOString(), createdAt: serverTimestamp(), comment: ''
      });
      setNewLearningRecord({ title: '', content: '', imageUrl: '' });
      setSaveMessage('記録しました');
    } catch (e) { setSaveMessage('失敗'); }
  };

  const submitAdminComment = async (recordId) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'learning_records', recordId), {
        comment: adminComment[recordId], commentedAt: serverTimestamp()
      });
      setSaveMessage('送信しました');
    } catch (e) { setSaveMessage('失敗'); }
  };

  // --- サブコンポーネント: TrendChart ---
  const TrendChart = () => {
    if (historyRecords.length < 2) return <div className="h-32 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed text-xs text-slate-400">履歴データ不足</div>;
    const maxVal = Math.max(...historyRecords.map(r => Math.max(r.totalCost || 0, r.sponsorship || 0))) * 1.2;
    const points = (valKey) => historyRecords.map((r, i) => `${(i / (historyRecords.length - 1)) * 100},${100 - ((r[valKey] || 0) / maxVal) * 100}`).join(' ');
    return (
      <div className="w-full bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative mb-6">
        <div className="flex justify-between items-center mb-4 text-[10px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2 text-orange-400 tracking-[0.2em]"><TrendingUp size={14} /> ANALYTICS</div>
          <div className="flex gap-4">
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> 協賛</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> 運営</span>
          </div>
        </div>
        <svg viewBox="0 0 100 100" className="w-full h-32 md:h-24 overflow-visible" preserveAspectRatio="none">
          <polyline fill="none" stroke="#64748b" strokeWidth="1" points={points('totalCost')} />
          <polyline fill="none" stroke="#f97316" strokeWidth="2" points={points('sponsorship')} />
        </svg>
      </div>
    );
  };

  // --- 報告書PDFプレビューモーダル ---
  const ReportModal = () => (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 print:p-0 print:bg-white print:static text-left overflow-y-auto">
      <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[95vh] overflow-y-auto md:rounded-3xl shadow-2xl print:shadow-none print:max-h-full print:rounded-none text-left">
        <div className="p-4 md:p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2 font-bold text-slate-700 text-left"><FileText className="text-orange-600 w-5 h-5" /> 報告書プレビュー</div>
          <div className="flex gap-2 text-left">
            <button onClick={() => window.print()} className="bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-700 shadow-lg text-xs md:text-sm font-bold transition-all"><Printer size={18} /> PDF出力</button>
            <button onClick={() => setShowReport(false)} className="bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-all"><X size={20} /></button>
          </div>
        </div>
        <div className="p-8 md:p-16 print:p-10 space-y-12 text-slate-800 bg-white text-left">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 text-left">
            <div className="space-y-2 text-left">
              <div className="bg-orange-600 text-white px-3 py-1 text-[10px] font-bold tracking-[0.3em] inline-block rounded-sm">CONFIDENTIAL</div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-left">協賛活動成果報告書</h2>
              <p className="text-slate-500 font-medium text-left">教育支援を通じた社会貢献と提供インパクトの可視化</p>
            </div>
            <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-orange-500 pl-4 md:pr-4">
              <p className="text-xs font-bold text-slate-400 text-left md:text-right">発行元</p>
              <p className="text-sm font-black text-slate-800 text-left md:text-right uppercase">Clayette Project</p>
            </div>
          </div>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
             <div className="md:col-span-1 bg-orange-600 p-8 rounded-[2rem] text-white flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-80">Coverage Rate</p>
                <div className="relative w-32 h-32 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${coverageRate} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-3xl">{coverageRate}%</div>
                </div>
             </div>
             <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left"><p className="text-xs font-bold text-slate-400 mb-2 uppercase text-left">Total Sponsorship</p><p className="text-4xl font-black text-slate-900 tracking-tighter text-left">¥{sponsorship.toLocaleString()}</p></div>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left"><p className="text-xs font-bold text-slate-400 mb-2 uppercase text-left">Benefit per child</p><p className="text-4xl font-black text-orange-600 tracking-tighter text-left">¥{reductionPerStudent.toLocaleString()}</p></div>
             </div>
          </section>
          <section className="text-left space-y-6">
            <div className="flex items-center gap-2 font-bold text-xl border-l-4 border-orange-500 pl-4 text-left">資金使途の詳細</div>
            <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6 text-left">
              {Object.entries(costs).map(([key, value]) => {
                const categoryWeight = totalOperatingCost > 0 ? value / totalOperatingCost : 0;
                const coverRatio = Math.min(100, value > 0 ? Math.round((sponsorship * categoryWeight / value) * 100) : 0);
                return (
                  <div key={key} className="text-left">
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-2 text-left"><span>{key}</span><span>寄与率: {coverRatio}%</span></div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden text-left"><div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${coverRatio}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  // --- ログイン画面 ---
  if (!currentUser || !currentUser.role) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6 text-left">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-orange-100 animate-in zoom-in-95 duration-500 text-left">
          <div className="text-center space-y-2 text-slate-900">
            <div className="bg-orange-600 w-16 h-16 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-200"><Calculator size={32} /></div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Clayette Portal</h1>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase text-center">Educational Management System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div className="space-y-4 text-left">
              <div className="text-left"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block text-left">Login ID</label><input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none text-left" /></div>
              <div className="text-left"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block text-left">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none text-left" /></div>
            </div>
            {authError && <p className="text-rose-500 text-[10px] font-bold text-center bg-rose-50 py-2 rounded-xl border border-rose-100">{authError}</p>}
            <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-orange-700 transition-all active:scale-95 text-base">ログイン</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left overflow-x-hidden flex flex-col">
      {/* ナビゲーション */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 shrink-0 shadow-sm text-left">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 text-left">
          <div className="flex items-center gap-3 text-left">
            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg"><Calculator size={18} /></div>
            <span className="font-black tracking-tighter text-slate-800 hidden sm:inline uppercase text-left">Clayette System</span>
          </div>
          <div className="flex items-center gap-4 text-left">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-left">
              {currentUser.role === 'admin' ? (
                <>
                  <button onClick={() => setActiveTab('dashboard')} className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>分析</button>
                  <button onClick={() => setActiveTab('students')} className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'students' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>生徒管理</button>
                  <button onClick={() => setActiveTab('sponsors')} className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'sponsors' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>協賛企業</button>
                  <button onClick={() => setActiveTab('materials')} className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'materials' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>教材管理</button>
                  <button onClick={() => setActiveTab('notices')} className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'notices' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>お知らせ</button>
                </>
              ) : (
                <>
                  <button onClick={() => setActiveTab('mypage')} className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all bg-white text-orange-600 shadow-sm`}>マイページ</button>
                  <button onClick={() => setActiveTab('materials')} className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'materials' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>教材一覧</button>
                </>
              )}
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-600 transition-colors ml-2 text-left"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      {/* メインエリア */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8 text-left text-slate-900 overflow-y-auto">
        {saveMessage && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce text-left"><CheckCircle2 size={18} className="text-emerald-400" /><span className="text-sm font-bold">{saveMessage}</span></div>}

        {/* 管理者: 分析・ダッシュボード */}
        {currentUser.role === 'admin' && activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
              <div className="text-left"><h2 className="text-2xl font-black tracking-tight text-left">受講料・協賛金分析</h2><p className="text-slate-400 text-sm font-medium text-left">運営コストと支援インパクトの統合ダッシュボード</p></div>
              <div className="flex gap-2 text-left">
                 <button onClick={() => setShowReport(true)} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg shadow-orange-100 text-sm"><FileText size={18} /> 報告書作成</button>
                 <div className="bg-white border border-slate-200 rounded-xl px-2 flex items-center gap-2 text-left"><input type="month" value={recordMonth} onChange={e=>setRecordMonth(e.target.value)} className="py-2 text-xs font-bold outline-none bg-transparent" /><button onClick={recordMonthlyStatus} className="text-[10px] font-black text-orange-600 px-2 uppercase tracking-tighter">月次保存</button></div>
              </div>
            </header>

            <TrendChart />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left items-start">
               {/* 左側設定パネル */}
               <div className="space-y-6 text-left">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 text-left shadow-sm">
                     <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-widest text-left"><Settings2 size={14} className="text-orange-500" /> 月間コスト</div>
                     {Object.entries(costs).map(([key, value]) => (
                        <div key={key} className="text-left"><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest text-left">{key}</label><input type="number" value={value} onChange={e=>handleCostChange(key, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500 transition-all" /></div>
                     ))}
                     <div className="pt-4 border-t border-dashed flex justify-between font-black text-left"><span className="text-xs text-slate-400 uppercase tracking-widest text-left">Total Cost</span><span className="text-orange-600 text-right">¥{totalOperatingCost.toLocaleString()}</span></div>
                  </div>
                  <div className="bg-orange-600 text-white rounded-3xl p-6 space-y-4 shadow-xl text-left">
                     <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-80 text-left"><ShieldCheck size={14} /> 予備費バッファ設定</div>
                     <p className="text-[10px] text-orange-100 font-medium text-left leading-relaxed">月4回コース(¥12,000)の生徒何人分の資金を、還元原資から除外して予備費に回しますか？</p>
                     <input type="range" min="0" max="20" step="1" value={bufferStudentTarget} onChange={e=>setBufferStudentTarget(parseInt(e.target.value))} className="w-full h-1.5 bg-orange-400 rounded-full appearance-none accent-white cursor-pointer" />
                     <div className="flex justify-between font-black text-left"><span className="text-[10px] text-left">確保: {bufferStudentTarget}名分</span><span className="text-lg text-right">¥{bufferAmount.toLocaleString()}</span></div>
                  </div>
               </div>

               {/* 右側結果パネル */}
               <div className="lg:col-span-2 space-y-6 text-left">
                  {/* 協賛金状況（自動連動） */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden shadow-sm text-left">
                     <div className="absolute top-0 right-0 p-4 opacity-5 text-left"><Coins size={120} /></div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Total Sponsorship Sum</p>
                     <p className="text-5xl font-black text-orange-600 tracking-tighter text-left">¥{sponsorship.toLocaleString()}</p>
                     <p className="text-[10px] text-slate-400 font-bold mt-4 italic text-left">※協賛企業管理タブで登録された {sponsors.length} 社の合計金額です。</p>
                  </div>

                  {/* 還元バナー */}
                  <div className="bg-orange-600 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-orange-100 text-left">
                    <div className="text-left text-white">
                      <p className="text-orange-100 text-[10px] font-bold uppercase mb-4 tracking-[0.2em] text-left">一人当たりの月額引き下げ額</p>
                      <div className="flex items-center gap-4 text-left">
                        <ArrowDownCircle size={48} className="text-orange-200 animate-bounce-slow" />
                        <span className="text-5xl md:text-7xl font-black tracking-tighter text-left">¥{reductionPerStudent.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 text-center min-w-[140px] text-left">
                      <p className="text-[10px] font-bold mb-1 opacity-80 uppercase tracking-widest text-center text-white">Coverage</p>
                      <p className="text-4xl font-black text-center text-white">{coverageRate}%</p>
                    </div>
                  </div>

                  {/* 復活：コース別実質価格カード */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    {COURSE_BASES.map((course) => {
                      const discountedPrice = Math.max(0, course.price - reductionPerStudent);
                      const isFree = discountedPrice === 0;
                      const enrolledCount = studentCountsFromDb[course.id] || 0;
                      return (
                        <div key={course.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-orange-200 transition-all shadow-sm text-left group">
                          <div className="flex justify-between items-start mb-4 text-left">
                            <div className="text-left">
                              <h4 className="font-black text-slate-800 text-lg tracking-tight text-left">{course.label}</h4>
                              <span className="text-[10px] md:text-xs text-slate-300 font-bold line-through text-left">定価 ¥{course.price.toLocaleString()}</span>
                            </div>
                            <span className="bg-slate-50 text-slate-400 text-[9px] font-black px-2 py-1 rounded-full uppercase text-left tracking-tighter group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">{enrolledCount}名在籍</span>
                          </div>
                          <div className="text-left">
                            <div className="flex items-end gap-1 text-left">
                              <span className={`text-2xl md:text-3xl font-black text-left ${isFree ? 'text-emerald-500' : 'text-slate-900'}`}>
                                {isFree ? '受講料無料' : `¥${discountedPrice.toLocaleString()}`}
                              </span>
                              {!isFree && <span className="text-[10px] text-slate-400 font-bold mb-1.5 text-left">/ 月</span>}
                            </div>
                            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden text-left">
                              <div 
                                className="h-full bg-orange-500 transition-all duration-1000 text-left" 
                                style={{ width: `${Math.min(100, (reductionPerStudent / course.price) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* 生徒管理 */}
        {currentUser.role === 'admin' && activeTab === 'students' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 text-left">
            <header className="text-left"><h2 className="text-2xl font-black tracking-tight text-left">受講生・保護者管理</h2></header>
            {generatedCreds && (
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl space-y-4 border-2 border-orange-500 animate-in zoom-in-95 duration-300 text-left">
                <div className="flex items-center gap-3 text-orange-400 font-bold text-left"><Key size={20} /> <span className="text-left">アカウントを発行しました: {generatedCreds.name}様</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left font-mono">
                  <div className="bg-white/10 p-4 rounded-2xl text-left"><p className="text-[10px] font-bold text-orange-300 mb-2 uppercase text-left">受講生用</p><p className="text-sm text-left tracking-widest">ID: {generatedCreds.student.id} / PW: {generatedCreds.student.pw}</p></div>
                  <div className="bg-white/10 p-4 rounded-2xl text-left"><p className="text-[10px] font-bold text-orange-300 mb-2 uppercase text-left">保護者用</p><p className="text-sm text-left tracking-widest">ID: {generatedCreds.parent.id} / PW: {generatedCreds.parent.pw}</p></div>
                </div>
                <button onClick={()=>setGeneratedCreds(null)} className="w-full bg-orange-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-colors">内容を確認して閉じる</button>
              </div>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start text-left text-slate-900">
              <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left">{editingStudent ? '生徒編集' : '生徒登録'}</h3>
                <form onSubmit={saveStudent} className="space-y-5 text-left">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1 text-left">氏名</label><input type="text" required value={studentForm.name} onChange={e=>setStudentForm({...studentForm, name:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-left" /></div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-left">学校</label><input type="text" value={studentForm.school} onChange={e=>setStudentForm({...studentForm, school:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-left" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-left">年齢</label><input type="number" value={studentForm.age} onChange={e=>setStudentForm({...studentForm, age:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-left" /></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-left">次回の授業日</label><input type="date" value={studentForm.nextClassDate} onChange={e=>setStudentForm({...studentForm, nextClassDate:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-left" /></div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-left">
                    <div className="flex justify-between items-center text-left"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Credentials</span><button type="button" onClick={fillCredentials} className="text-[9px] bg-slate-200 px-2 py-1 rounded font-black text-slate-500 uppercase tracking-widest hover:bg-slate-300">Auto</button></div>
                    <div className="grid grid-cols-1 gap-2 text-left"><input type="text" placeholder="生徒ID" value={studentForm.studentLoginId} onChange={e=>setStudentForm({...studentForm, studentLoginId:e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-left" /><input type="text" placeholder="生徒PW" value={studentForm.studentPassword} onChange={e=>setStudentForm({...studentForm, studentPassword:e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-left" /><input type="text" placeholder="保護者ID" value={studentForm.parentLoginId} onChange={e=>setStudentForm({...studentForm, parentLoginId:e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-left" /><input type="text" placeholder="保護者PW" value={studentForm.parentPassword} onChange={e=>setStudentForm({...studentForm, parentPassword:e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-left" /></div>
                  </div>
                  <div className="text-left"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-left">プラン</label><select value={studentForm.courseId} onChange={e=>setStudentForm({...studentForm, courseId:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-left outline-none appearance-none">{COURSE_BASES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm uppercase tracking-widest">{editingStudent ? 'UPDATE' : 'ID発行と登録'}</button>
                </form>
              </div>
              <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {students.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm relative group hover:border-orange-300 transition-all text-left">
                    <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all text-left"><button onClick={()=>{setEditingStudent(s); setStudentForm(s); window.scrollTo(0,0);}} className="p-2 bg-slate-50 text-slate-400 hover:text-orange-600 rounded-lg"><Edit2 size={14}/></button><button onClick={async()=>{if(window.confirm('削除？')){await deleteDoc(doc(db,'artifacts',appId,'public', 'data', 'students',s.id));}}} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 size={14}/></button></div>
                    <div className="text-left"><h4 className="font-black text-xl text-slate-800 text-left">{s.name}</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">{s.school || '学校未登録'} | {s.age || '?'}歳</p></div>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-left"><span>生徒ID: {s.studentLoginId}</span><span>保護者ID: {s.parentLoginId}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 協賛企業管理 */}
        {currentUser.role === 'admin' && activeTab === 'sponsors' && (
          <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <header className="text-left"><h2 className="text-2xl font-black tracking-tight text-left text-slate-800">協賛企業・支援管理</h2></header>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 text-left items-start">
              <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left">{editingSponsor ? '企業情報を編集' : '新規企業を登録'}</h3>
                <form onSubmit={saveSponsor} className="space-y-4 text-left">
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">会社名</label><input type="text" required value={sponsorForm.name} onChange={e=>setSponsorForm({...sponsorForm, name:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none" /></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">担当者</label><input type="text" value={sponsorForm.repName} onChange={e=>setSponsorForm({...sponsorForm, repName:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none" /></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">月額支援額</label><input type="number" required value={sponsorForm.amount} onChange={e=>setSponsorForm({...sponsorForm, amount:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-orange-600 text-left outline-none" /></div>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 transition-all uppercase tracking-widest text-sm active:scale-95">REGISTER</button>
                  {editingSponsor && <button type="button" onClick={()=>{setEditingSponsor(null); setSponsorForm({name:'', repName:'', email:'', amount:''})}} className="w-full text-slate-400 font-bold py-2 text-[10px] uppercase tracking-widest">CANCEL</button>}
                </form>
              </div>
              <div className="xl:col-span-3 space-y-4 text-left">
                <div className="flex justify-between items-end mb-2 px-2 text-slate-800 text-left"><p className="text-xs font-bold uppercase tracking-widest opacity-40 text-left">Partner List ({sponsors.length} Companies)</p><p className="font-black text-xl text-right">Total Monthly: ¥{sponsorship.toLocaleString()}</p></div>
                {sponsors.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-orange-300 transition-all text-left shadow-sm">
                    <div className="text-left w-full"><div className="flex items-center gap-2 mb-1 text-left"><Building className="text-orange-500" size={16} /><h4 className="font-black text-lg text-slate-800 text-left">{s.name}</h4></div><p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-left">{s.repName || '担当者名未登録'}</p></div>
                    <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0 text-left"><p className="text-xl font-black text-orange-600 text-left tracking-tighter">¥{Number(s.amount).toLocaleString()}</p><div className="flex gap-2 text-left"><button onClick={()=>{setEditingSponsor(s); setSponsorForm(s); window.scrollTo(0,0);}} className="p-2 bg-slate-50 text-slate-400 hover:text-orange-600 rounded-lg transition-colors"><Edit2 size={16}/></button><button onClick={()=>deleteSponsor(s.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={16}/></button></div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* お知らせ/教材管理 */}
        {currentUser.role === 'admin' && activeTab === 'materials' && (
          <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <header className="text-left"><h2 className="text-2xl font-black tracking-tight text-slate-800 text-left">教材・リソース管理</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-left">
               <div className="md:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 h-fit sticky top-24 shadow-sm text-left">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left">新規追加</h3>
                  <form onSubmit={saveMaterial} className="space-y-4 text-left">
                     <input type="text" placeholder="タイトル" value={materialForm.title} onChange={e=>setMaterialForm({...materialForm, title:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" />
                     <input type="url" placeholder="URL" value={materialForm.url} onChange={e=>setMaterialForm({...materialForm, url:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" />
                     <input type="text" placeholder="タグ (コンマ区切り)" value={materialForm.tags} onChange={e=>setMaterialForm({...materialForm, tags:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" />
                     <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-all uppercase tracking-widest text-sm">SAVE</button>
                  </form>
               </div>
               <div className="md:col-span-2 space-y-4 text-left">
                  {materials.map(m => (
                    <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex justify-between items-start group shadow-sm text-left hover:border-orange-200 transition-all"><div className="text-left"><h4 className="font-black text-slate-800 text-lg text-left">{m.title}</h4><div className="flex flex-wrap gap-2 mt-2 text-left">{m.tags.map(t=>(<span key={t} className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter text-left">{t}</span>))}</div><a href={m.url} target="_blank" className="text-orange-600 text-xs font-black flex items-center gap-1 mt-4 hover:underline text-left uppercase">Open <LinkIcon size={12}/></a></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all text-left"><button onClick={()=>{setEditingMaterial(m); setMaterialForm({...m, tags:m.tags.join(',')});}} className="p-2 bg-slate-50 text-slate-400 hover:text-orange-600 transition-colors"><Edit2 size={14}/></button><button onClick={()=>deleteMaterial(m.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button></div></div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* お知らせ管理 */}
        {currentUser.role === 'admin' && activeTab === 'notices' && (
          <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <header className="text-left font-black text-2xl text-left text-slate-800">全体連絡管理</header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
               <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 h-fit shadow-sm text-left"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left">新規投稿</h3><form onSubmit={postAnnouncement} className="space-y-4 text-left"><input type="text" required placeholder="タイトル" value={announcementForm.title} onChange={e=>setAnnouncementForm({...announcementForm, title:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" /><textarea required placeholder="本文" value={announcementForm.content} onChange={e=>setAnnouncementForm({...announcementForm, content:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-32 resize-none text-left focus:ring-2 focus:ring-orange-500 outline-none" /><select value={announcementForm.type} onChange={e=>setAnnouncementForm({...announcementForm, type:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none text-left"><option value="info">通常のお知らせ</option><option value="emergency">緊急・重要連絡</option></select><button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-all uppercase tracking-[0.2em] text-sm">POST</button></form></div>
               <div className="md:col-span-2 space-y-4 text-left">{announcements.map(notice=>(<div key={notice.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex justify-between items-start group shadow-sm text-left transition-all hover:border-orange-200"><div><div className="flex items-center gap-3 mb-2 text-left"><span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest text-left ${notice.type==='emergency'?'bg-rose-100 text-rose-600':'bg-orange-100 text-orange-600'}`}>{notice.type}</span><span className="text-[10px] font-bold text-slate-400 text-left">{notice.createdAt?.toDate().toLocaleDateString()}</span></div><h4 className="font-black text-lg text-left text-slate-800">{notice.title}</h4><p className="text-sm text-slate-500 mt-2 leading-relaxed text-left">{notice.content}</p></div><button onClick={async()=>await deleteDoc(doc(db,'artifacts',appId,'public','data','announcements',notice.id))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 text-left"><Trash2 size={18}/></button></div>))}</div>
            </div>
          </div>
        )}

        {/* 受講生・保護者向け: マイページ */}
        {(currentUser.role === 'student' || currentUser.role === 'parent') && activeTab === 'mypage' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 text-left text-slate-900">
            <header className="flex flex-col md:flex-row justify-between items-start gap-6 text-left">
              <div className="text-left"><h2 className="text-3xl font-black tracking-tight text-left text-slate-800">{currentUser.name}様 <span className="text-orange-600 font-light ml-2 uppercase">My Portal</span></h2><p className="text-slate-400 text-sm font-medium mt-1 text-left">今日学んだことや作品を記録して成長をポートフォリオに残しましょう。</p></div>
              <div className="w-full md:w-auto grid grid-cols-2 gap-4 shrink-0 text-left">
                 <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-center text-left"><p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1.5 text-left tracking-widest"><Clock size={12} className="text-orange-500" /> Next Lesson</p><p className="text-xl font-black text-slate-800 whitespace-nowrap text-left">{currentUser.nextClassDate || '未設定'}</p></div>
                 <div className="bg-orange-600 p-5 rounded-3xl text-white shadow-xl flex flex-col justify-center text-left"><p className="text-[10px] font-black uppercase mb-1 opacity-60 tracking-widest text-left">Reduction</p><p className="text-xl font-black tracking-tighter text-left">¥{reductionPerStudent.toLocaleString()}</p></div>
              </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start text-left">
              {currentUser.role === 'student' && (
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 h-fit sticky top-24 shadow-sm text-left">
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-widest text-left"><BookOpen size={16} className="text-orange-500" /> 学習を記録する</div>
                  <form onSubmit={submitLearningRecord} className="space-y-4 text-left"><input type="text" value={newLearningRecord.title} onChange={e => setNewLearningRecord({ ...newLearningRecord, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" placeholder="タイトル" required /><textarea value={newLearningRecord.content} onChange={e => setNewLearningRecord({ ...newLearningRecord, content: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-32 resize-none text-left focus:ring-2 focus:ring-orange-500 outline-none" placeholder="今日学んだことや感想" required /><input type="text" placeholder="画像URL (任意)" value={newLearningRecord.imageUrl} onChange={e=>setNewLearningRecord({...newLearningRecord, imageUrl:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-left" /><button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm">記録を保存</button></form>
                </div>
              )}
              <div className={`${currentUser.role === 'student' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6 text-left`}>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 text-left"><ImageIcon size={22} className="text-orange-500" /> 成長の軌跡</h3>
                <div className="grid grid-cols-1 gap-6 text-left">
                  {learningRecords.length === 0 ? <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest text-center">記録が見つかりません</div> : 
                    learningRecords.sort((a,b)=>b.date.localeCompare(a.date)).map(record => (
                      <div key={record.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all text-left group">
                        {record.imageUrl && (
                          <div className="md:w-72 h-56 md:h-auto bg-slate-100 flex-shrink-0 relative overflow-hidden"><img src={record.imageUrl} alt="成果物" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=400';}} /></div>
                        )}
                        <div className="p-8 flex-1 space-y-5 text-left">
                          <div className="text-left"><p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-1 text-left">{new Date(record.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p><h4 className="text-2xl font-black text-slate-800 text-left tracking-tight">{record.title}</h4></div>
                          <p className="text-sm text-slate-500 leading-relaxed font-medium whitespace-pre-wrap text-left">{record.content}</p>
                          {record.comment && <div className="mt-4 bg-orange-50/70 border border-orange-100 p-5 rounded-2xl relative text-left"><div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest mb-2 text-left font-sans"><MessageSquare size={12} /> Feedback</div><p className="text-sm text-slate-700 font-bold italic text-left leading-relaxed">"{record.comment}"</p></div>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 教材一覧 (受講生・保護者用) */}
        {(currentUser.role === 'student' || currentUser.role === 'parent') && activeTab === 'materials' && (
          <div className="space-y-8 text-left animate-in fade-in duration-500">
            <header className="text-left"><h2 className="text-2xl font-black text-slate-800 tracking-tight text-left">教材・リソースライブラリ</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {materials.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center group shadow-sm hover:shadow-md transition-all text-left"><div className="text-left"><h4 className="font-black text-slate-800 text-lg text-left">{m.title}</h4><div className="flex flex-wrap gap-2 mt-2 text-left">{m.tags.map(t=>(<span key={t} className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase text-left tracking-widest">{t}</span>))}</div><a href={m.url} target="_blank" className="text-orange-600 text-xs font-black flex items-center gap-1 mt-4 text-left hover:underline uppercase tracking-tighter">View Material <LinkIcon size={12}/></a></div></div>
              ))}
              {materials.length === 0 && <div className="md:col-span-2 py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 font-bold uppercase tracking-widest text-xs text-center">現在、公開されている教材はありません</div>}
            </div>
          </div>
        )}
      </main>

      <footer className="shrink-0 mt-auto py-10 border-t border-slate-200 text-center text-slate-300 text-[10px] font-black tracking-[0.5em] uppercase text-center bg-white/50">
        Clayette Educational Management Platform
      </footer>

      {showReport && <ReportModal />}

      <style>{`
        @media print { .print\\:hidden { display: none !important; } .print\\:bg-white { background: white !important; } .print\\:p-10 { padding: 2.5rem !important; } body { overflow: visible !important; } .rounded-[2rem], .rounded-[2.5rem] { border-radius: 1.5rem !important; } }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; background: white; cursor: pointer; border-radius: 50%; border: 4px solid #ea580c; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .animate-bounce-slow { animation: bounce 3s infinite ease-in-out; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes bounce { 0%, 100% { transform: translateY(-5%) translateX(-50%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); } 50% { transform: translateY(0) translateX(-50%); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); } }
      `}</style>
    </div>
  );
};

export default App;