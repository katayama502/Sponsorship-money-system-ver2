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
  ChevronDown
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
  // --- 認証 & ロール状態 ---
  const [currentUser, setCurrentUser] = useState(null); // { role, id, name, studentId?, nextClassDate? }
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- UI状態 ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReport, setShowReport] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // --- データ状態 ---
  const [costs, setCosts] = useState({ '家賃': 150000, '水道光熱費': 30000, '講師費用': 200000, '教材費': 50000, '備品費': 20000 });
  const [sponsorship, setSponsorship] = useState(300000);
  const [bufferStudentTarget, setBufferStudentTarget] = useState(5);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [learningRecords, setLearningRecords] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recordMonth, setRecordMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isRecording, setIsRecording] = useState(false);

  // --- 生徒フォーム状態 ---
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', school: '', age: '', courseId: 'premium', remarks: '', nextClassDate: '' });
  const [generatedCreds, setGeneratedCreds] = useState(null);

  // --- 学習記録 & お知らせフォーム ---
  const [newLearningRecord, setNewLearningRecord] = useState({ title: '', content: '', imageUrl: '' });
  const [adminComment, setAdminComment] = useState({});
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', type: 'info' });

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
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // データ購読（ロールに関わらず基本データは購読）
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

    // 管理者ログイン (admin / admin123)
    if (loginId === 'admin' && password === 'admin123') {
      setCurrentUser({ role: 'admin', name: 'システム管理者' });
      setActiveTab('dashboard');
      return;
    }

    // 生徒・保護者ログイン情報をFirestoreから検索
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

    if (found) {
      setCurrentUser(found);
      setActiveTab('mypage');
    } else {
      setAuthError('IDまたはパスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginId('');
    setPassword('');
  };

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

  const finalNetSurplus = availableSurplus - (reductionPerStudent * totalStudents);
  const capacityPerCourse = useMemo(() => {
    const pool = finalNetSurplus + bufferAmount;
    return COURSE_BASES.map(course => ({
      ...course,
      count: Math.floor(pool / Math.max(1, course.price - reductionPerStudent))
    }));
  }, [finalNetSurplus, bufferAmount, reductionPerStudent]);

  // --- ハンドラー ---
  const handleCostChange = (key, value) => setCosts(prev => ({ ...prev, [key]: parseInt(value) || 0 }));

  const recordMonthlyStatus = async () => {
    if (!user) return;
    setIsRecording(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'monthly_records', recordMonth);
      await setDoc(docRef, {
        month: recordMonth,
        costs, sponsorship, bufferStudentTarget,
        totalCost: totalOperatingCost,
        studentCounts: studentCountsFromDb,
        totalStudents, reductionAmount: reductionPerStudent,
        coverageRate, recordedAt: serverTimestamp()
      });
      setSaveMessage(`${recordMonth}の記録を保存しました`);
    } catch (e) { setSaveMessage('保存に失敗しました'); }
    finally { setIsRecording(false); setTimeout(() => setSaveMessage(''), 3000); }
  };

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
        setSaveMessage('登録・ID発行完了');
      }
      setStudentForm({ name: '', school: '', age: '', courseId: 'premium', remarks: '', nextClassDate: '' });
      setEditingStudent(null);
    } catch (e) { setSaveMessage('エラーが発生しました'); }
    setTimeout(() => setSaveMessage(''), 4000);
  };

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
      setSaveMessage('記録を保存しました');
    } catch (e) { setSaveMessage('保存失敗'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const submitAdminComment = async (recordId) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'learning_records', recordId), {
        comment: adminComment[recordId],
        commentedAt: serverTimestamp()
      });
      setSaveMessage('コメントを送信しました');
    } catch (e) { setSaveMessage('送信失敗'); }
  };

  const postAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), {
        ...announcementForm, createdAt: serverTimestamp()
      });
      setAnnouncementForm({ title: '', content: '', type: 'info' });
      setSaveMessage('お知らせを公開しました');
    } catch (e) { setSaveMessage('公開失敗'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // --- サブコンポーネント: TrendChart ---
  const TrendChart = () => {
    if (historyRecords.length < 2) return <div className="h-32 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed text-xs text-slate-400">履歴データ不足</div>;
    const maxVal = Math.max(...historyRecords.map(r => Math.max(r.totalCost || 0, r.sponsorship || 0))) * 1.2;
    const points = (valKey) => historyRecords.map((r, i) => `${(i / (historyRecords.length - 1)) * 100},${100 - ((r[valKey] || 0) / maxVal) * 100}`).join(' ');
    return (
      <div className="w-full bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative mb-6">
        <div className="flex justify-between items-center mb-4 text-[10px] font-bold tracking-widest">
          <div className="flex items-center gap-2 text-orange-400 uppercase"><TrendingUp size={14} /> 運営推移分析</div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div>協賛</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div>運営</span>
          </div>
        </div>
        <svg viewBox="0 0 100 100" className="w-full h-32 md:h-24 overflow-visible" preserveAspectRatio="none">
          <polyline fill="none" stroke="#64748b" strokeWidth="1" points={points('totalCost')} />
          <polyline fill="none" stroke="#f97316" strokeWidth="2" points={points('sponsorship')} />
        </svg>
      </div>
    );
  };

  // --- サブコンポーネント: ReportModal ---
  const ReportModal = () => (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 print:p-0 print:bg-white print:static print:inset-auto text-left">
      <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[95vh] overflow-y-auto md:rounded-3xl shadow-2xl print:shadow-none print:max-h-full print:rounded-none">
        <div className="p-4 md:p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <FileText className="text-orange-600 w-5 h-5" />
            協賛成果報告書 プレビュー
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-700 shadow-lg transition-all">
              <Printer size={18} /> <span className="text-sm font-bold">PDFとして保存</span>
            </button>
            <button onClick={() => setShowReport(false)} className="bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-all"><X size={20} /></button>
          </div>
        </div>

        <div className="p-8 md:p-16 print:p-10 space-y-12 text-slate-800 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-2 text-left">
              <div className="bg-orange-600 text-white px-3 py-1 text-[10px] font-bold tracking-[0.3em] inline-block rounded-sm">CONFIDENTIAL</div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">協賛活動成果報告書</h2>
              <p className="text-slate-500 font-medium">教育支援を通じた社会貢献と提供インパクトの可視化</p>
            </div>
            <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-orange-500 pl-4 md:pr-4">
              <p className="text-xs font-bold text-slate-400">発行元</p>
              <p className="text-sm font-black text-slate-800">クリエット教育支援プロジェクト</p>
              <p className="text-[10px] font-bold text-orange-600 uppercase pt-1">Academic Year 2025</p>
            </div>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 bg-orange-600 text-white rounded-[2rem] shadow-xl relative overflow-hidden text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-80">運営費カバー率</p>
              <div className="relative w-32 h-32 mx-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${coverageRate} 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black leading-none">{coverageRate}<span className="text-sm">%</span></span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left">
                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Total Sponsorship</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">¥{sponsorship.toLocaleString()}</p>
                <div className="mt-4 h-1 w-12 bg-orange-500"></div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left">
                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Benefit Per Child</p>
                <p className="text-4xl font-black text-orange-600 tracking-tighter">¥{reductionPerStudent.toLocaleString()}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">全{totalStudents}名の受講料を直接軽減</p>
              </div>
            </div>
          </section>

          <section className="space-y-6 text-left">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-900 border-l-4 border-orange-500 pl-4">
              <BarChart3 className="text-orange-600" />
              資金使途の詳細
            </div>
            <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 space-y-8">
              {Object.entries(costs).map(([key, value]) => {
                const categoryWeight = totalOperatingCost > 0 ? value / totalOperatingCost : 0;
                const coveredAmount = sponsorship * categoryWeight;
                const coverRatio = Math.min(100, value > 0 ? Math.round((coveredAmount / value) * 100) : 0);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-2 font-bold text-slate-600">
                      <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> {key}</span>
                      <span>支援寄与率: {coverRatio}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${coverRatio}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  // --- ログイン画面の表示 ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6 text-left">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-orange-100 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-2">
            <div className="bg-orange-600 w-16 h-16 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg"><Calculator size={32} /></div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-800 uppercase">Clayette Portal</h1>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase">Education Management System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Login ID</label>
                <div className="relative">
                  <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" />
                  <Users className="absolute right-4 top-3.5 text-slate-300" size={16} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Password</label>
                <div className="relative">
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" />
                  <Key className="absolute right-4 top-3.5 text-slate-300" size={16} />
                </div>
              </div>
            </div>
            {authError && <p className="text-rose-500 text-[10px] font-bold text-center bg-rose-50 py-2 rounded-xl">{authError}</p>}
            <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-orange-700 flex items-center justify-center gap-2 transition-all active:scale-95"><LogIn size={18} /> ログイン</button>
          </form>
          <p className="text-center text-[10px] text-slate-300 font-bold uppercase">Authorized Access Only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left overflow-x-hidden flex flex-col">
      {/* 共通ナビゲーション */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg"><Calculator size={18} /></div>
            <span className="font-black tracking-tighter text-slate-800 hidden sm:inline uppercase">Clayette System</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {currentUser.role === 'admin' ? (
                <>
                  <button onClick={() => setActiveTab('dashboard')} className={`px-2 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>分析</button>
                  <button onClick={() => setActiveTab('students')} className={`px-2 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'students' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>生徒管理</button>
                  <button onClick={() => setActiveTab('notices')} className={`px-2 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'notices' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>お知らせ</button>
                </>
              ) : (
                <button onClick={() => setActiveTab('mypage')} className={`px-2 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-orange-600 shadow-sm`}>マイページ</button>
              )}
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-600 transition-colors"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      {/* メインコンテンツエリア */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">

        {saveMessage && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-bold">{saveMessage}</span>
          </div>
        )}

        {/* --- 共通: お知らせ通知 --- */}
        {currentUser.role !== 'admin' && announcements.length > 0 && (
          <div className="bg-orange-600 text-white p-4 rounded-[1.5rem] shadow-xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-700">
            <div className="bg-white/20 p-2 rounded-xl shrink-0"><Megaphone size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">Notification</p>
              <h4 className="font-black text-sm truncate">{announcements[0].title}</h4>
              <p className="text-xs mt-1 font-medium text-orange-50 line-clamp-2">{announcements[0].content}</p>
            </div>
            {announcements[0].type === 'emergency' && <div className="bg-rose-500 px-2 py-1 rounded-lg text-[10px] font-black animate-pulse">重要</div>}
          </div>
        )}

        {/* 1. 管理者: ダッシュボード & シミュレーター */}
        {currentUser.role === 'admin' && activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-left">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">受講料・協賛金分析</h2>
                <p className="text-slate-400 text-sm font-medium">運営コストと社会貢献インパクトの最大化</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="flex flex-1 items-center bg-white border border-slate-200 rounded-xl px-2 gap-2">
                  <input type="month" value={recordMonth} onChange={(e) => setRecordMonth(e.target.value)} className="py-2 text-xs font-bold bg-transparent outline-none flex-1 min-w-[100px]" />
                  <button onClick={recordMonthlyStatus} disabled={isRecording} className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0">月次保存</button>
                </div>
                <button onClick={() => setShowReport(true)} className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg"><FileText size={18} /> 報告書</button>
              </div>
            </header>

            <TrendChart />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="space-y-6">
                {/* 運営コスト設定 */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-widest"><Settings2 size={14} className="text-orange-500" /> 月間コスト設定</div>
                  {Object.entries(costs).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{key}</label>
                      <input type="number" value={value} onChange={(e) => handleCostChange(key, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                  ))}
                  <div className="pt-4 border-t border-dashed flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Total Cost</span><span className="text-lg font-black text-orange-600">¥{totalOperatingCost.toLocaleString()}</span></div>
                </div>

                {/* バッファ設定 */}
                <div className="bg-orange-600 text-white rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-80"><ShieldCheck size={14} /> 協賛金バッファ設定</div>
                  <p className="text-[10px] text-orange-100 font-medium">コースA({COURSE_BASES[0].price.toLocaleString()}円)の生徒何人分の資金を予備費にしますか？</p>
                  <input type="range" min="0" max="20" step="1" value={bufferStudentTarget} onChange={(e) => setBufferStudentTarget(parseInt(e.target.value))} className="w-full h-1.5 bg-orange-400 rounded-full appearance-none cursor-pointer accent-white" />
                  <div className="flex justify-between items-center font-black">
                    <span className="text-[10px]">現在: {bufferStudentTarget}名分</span>
                    <span className="text-lg">¥{bufferAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {/* 協賛金スライダー */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Coins size={120} /></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Current Total Sponsorship</p>
                  <p className="text-5xl font-black text-orange-600 tracking-tighter mb-8">¥{sponsorship.toLocaleString()}</p>
                  <input type="range" min="0" max="2000000" step="10000" value={sponsorship} onChange={(e) => setSponsorship(parseInt(e.target.value))} className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-orange-600 shadow-inner" />
                </div>

                {/* 還元インパクト */}
                <div className="bg-orange-600 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl shadow-orange-100">
                  <div>
                    <p className="text-orange-100 text-[10px] font-bold uppercase mb-4 tracking-widest">一律月額引き下げ額 (1,000円ステップ)</p>
                    <div className="flex items-center gap-4">
                      <ArrowDownCircle size={48} className="text-orange-200 animate-bounce-slow" />
                      <span className="text-6xl md:text-7xl font-black tracking-tighter">¥{reductionPerStudent.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 text-center min-w-[140px]">
                    <p className="text-[10px] font-bold mb-1 opacity-80 uppercase tracking-widest">Coverage</p>
                    <p className="text-4xl font-black">{coverageRate}%</p>
                  </div>
                </div>

                {/* 追加受入枠 */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-6 font-bold text-slate-700 text-sm">
                    <UserPlus className="text-orange-500 w-5 h-5" /> 現在の追加受入可能枠
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {capacityPerCourse.map(c => (
                      <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center transition-all hover:border-orange-200">
                        <p className="text-[10px] text-slate-400 font-bold mb-1 truncate">{c.label}</p>
                        <p className="text-2xl font-black text-slate-800">+{c.count}<span className="text-[10px] ml-0.5">名</span></p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 管理者用コメント欄（最新投稿へのフィードバック） */}
                <div className="mt-12 space-y-6 text-left">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><MessageSquare className="text-orange-500" /> 学習記録へのフィードバック</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {learningRecords.slice(0, 4).map(record => (
                      <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm group">
                        <div className="flex justify-between items-start min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{record.studentName} | {new Date(record.date).toLocaleDateString()}</p>
                            <h4 className="font-black text-slate-800 truncate">{record.title}</h4>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{record.content}</p>
                        <div className="pt-4 border-t border-slate-50 flex gap-2">
                          <input
                            type="text"
                            defaultValue={record.comment}
                            onBlur={(e) => setAdminComment({ ...adminComment, [record.id]: e.target.value })}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:bg-white"
                            placeholder="コメントを入力..."
                          />
                          <button onClick={() => submitAdminComment(record.id)} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-orange-600 transition-all"><ChevronRight size={18} /></button>
                        </div>
                      </div>
                    ))}
                    {learningRecords.length === 0 && <div className="md:col-span-2 py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-sm font-bold">まだ学習記録の投稿はありません</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. 管理者: 生徒管理 */}
        {currentUser.role === 'admin' && activeTab === 'students' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="text-left"><h2 className="text-2xl font-black text-slate-800 tracking-tight">生徒・保護者アカウント管理</h2></header>

            {generatedCreds && (
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl space-y-4 border-2 border-orange-500 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 text-orange-400 font-bold"><Key size={20} /> <span>アカウントを発行しました: {generatedCreds.name}様</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-orange-300 uppercase mb-2">生徒用ログイン情報</p>
                    <p className="text-sm font-bold tracking-widest select-all">ID: {generatedCreds.student.id} / PW: {generatedCreds.student.pw}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-orange-300 uppercase mb-2">保護者用ログイン情報</p>
                    <p className="text-sm font-bold tracking-widest select-all">ID: {generatedCreds.parent.id} / PW: {generatedCreds.parent.pw}</p>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 text-center">※この情報は一度閉じると再表示できません。必ずメモを控えてください。</p>
                <button onClick={() => setGeneratedCreds(null)} className="w-full bg-orange-600 text-xs font-black py-2 rounded-xl transition-all hover:bg-orange-700 uppercase tracking-[0.2em]">内容を確認して閉じる</button>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 h-fit sticky top-24">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{editingStudent ? '生徒情報を編集' : '新規受講生を登録'}</h3>
                <form onSubmit={saveStudent} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">氏名</label>
                    <input type="text" required value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">学校</label>
                      <input type="text" value={studentForm.school} onChange={e => setStudentForm({ ...studentForm, school: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">年齢</label>
                      <input type="number" value={studentForm.age} onChange={e => setStudentForm({ ...studentForm, age: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">次回の授業日</label>
                    <input type="date" value={studentForm.nextClassDate} onChange={e => setStudentForm({ ...studentForm, nextClassDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">受講プラン</label>
                    <select value={studentForm.courseId} onChange={e => setStudentForm({ ...studentForm, courseId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none">
                      {COURSE_BASES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                    {editingStudent ? <Edit2 size={18} /> : <UserPlus size={18} />}
                    {editingStudent ? '保存する' : 'ID発行と登録'}
                  </button>
                </form>
              </div>

              <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 group hover:border-orange-500 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingStudent(s); setStudentForm(s); window.scrollTo(0, 0); }} className="p-2 bg-slate-50 text-slate-400 hover:text-orange-600 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={async () => { if (window.confirm('削除しますか？')) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', s.id)); } }} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-800">{s.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.school} | {s.age}歳</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="bg-orange-50 px-3 py-1 rounded-full text-orange-600 text-[10px] font-black border border-orange-100 flex items-center gap-1.5"><Clock size={10} /> 次回: {s.nextClassDate || '未設定'}</div>
                        <div className="bg-slate-50 px-3 py-1 rounded-full text-slate-500 text-[10px] font-black border border-slate-100">{COURSE_BASES.find(c => c.id === s.courseId)?.label}</div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-50 grid grid-cols-2 gap-2 text-[10px] font-bold">
                      <div className="text-slate-400">生徒ID: <span className="text-slate-900 select-all">{s.studentLoginId}</span></div>
                      <div className="text-slate-400">保護者ID: <span className="text-slate-900 select-all">{s.parentLoginId}</span></div>
                    </div>
                  </div>
                ))}
                {students.length === 0 && <div className="md:col-span-2 py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center"><p className="text-slate-400 font-bold">生徒が登録されていません</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* 3. 管理者: お知らせ管理 */}
        {currentUser.role === 'admin' && activeTab === 'notices' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="text-left"><h2 className="text-2xl font-black text-slate-800 tracking-tight">お知らせ・緊急連絡</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">新規投稿</h3>
                <form onSubmit={postAnnouncement} className="space-y-4">
                  <input type="text" required value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" placeholder="タイトル" />
                  <textarea required value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-32 resize-none" placeholder="本文を入力してください..." />
                  <select value={announcementForm.type} onChange={e => setAnnouncementForm({ ...announcementForm, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
                    <option value="info">通常のお知らせ</option>
                    <option value="emergency">緊急・重要連絡</option>
                  </select>
                  <button type="submit" className="w-full bg-slate-900 text-white font-black py-3.5 rounded-xl shadow-lg hover:bg-orange-600 flex items-center justify-center gap-2 transition-all"><Plus size={18} /> 公開する</button>
                </form>
              </div>
              <div className="md:col-span-2 space-y-4">
                {announcements.map(notice => (
                  <div key={notice.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex justify-between items-start group shadow-sm text-left">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${notice.type === 'emergency' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>{notice.type}</span>
                        <span className="text-[10px] font-bold text-slate-400">{notice.createdAt?.toDate().toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-black text-slate-800 text-lg truncate">{notice.title}</h4>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{notice.content}</p>
                    </div>
                    <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'announcements', notice.id)); }} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-4"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. 受講生・保護者: マイページ */}
        {(currentUser.role === 'student' || currentUser.role === 'parent') && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="text-left">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{currentUser.name}様 <span className="text-orange-600 font-light ml-2">マイページ</span></h2>
                <p className="text-slate-400 text-sm font-medium mt-1">{currentUser.role === 'student' ? '今日学んだことを記録して成長を残しましょう。' : `${currentUser.childName}さんの学習と作品の歩みです。`}</p>
              </div>
              <div className="w-full md:w-auto grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-xl flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1.5"><Clock size={12} className="text-orange-500" /> 次回の授業日</p>
                  <p className="text-xl font-black text-slate-800">{currentUser.nextClassDate || '未設定'}</p>
                </div>
                <div className="bg-orange-600 p-5 rounded-[1.5rem] text-white shadow-xl shadow-orange-100 flex flex-col justify-center">
                  <p className="text-[10px] font-black uppercase mb-1 opacity-60">今月の支援軽減額</p>
                  <p className="text-xl font-black tracking-tighter">¥{reductionPerStudent.toLocaleString()}</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* 生徒のみ: 投稿フォーム */}
              {currentUser.role === 'student' && (
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 h-fit sticky top-24 shadow-sm text-left">
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-widest"><BookOpen size={16} className="text-orange-500" /> 学習・制作を記録</div>
                  <form onSubmit={submitLearningRecord} className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Title</label>
                      <input type="text" value={newLearningRecord.title} onChange={e => setNewLearningRecord({ ...newLearningRecord, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" placeholder="今日の課題など" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Message</label>
                      <textarea value={newLearningRecord.content} onChange={e => setNewLearningRecord({ ...newLearningRecord, content: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-32 resize-none focus:ring-2 focus:ring-orange-500 outline-none" placeholder="学んだことや感想..." required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase text-left">Portfolio URL (Option)</label>
                      <input type="text" value={newLearningRecord.imageUrl} onChange={e => setNewLearningRecord({ ...newLearningRecord, imageUrl: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs" placeholder="画像や作品のURL" />
                    </div>
                    <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2 active:scale-95"><Plus size={20} /> 記録を保存</button>
                  </form>
                </div>
              )}

              {/* タイムライン */}
              <div className={`${currentUser.role === 'student' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6 text-left`}>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <ImageIcon size={22} className="text-orange-500" /> 学習・制作のポートフォリオ
                </h3>
                {learningRecords.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No records recorded yet</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {learningRecords.sort((a, b) => b.date.localeCompare(a.date)).map(record => (
                      <div key={record.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all text-left group">
                        {record.imageUrl && (
                          <div className="md:w-72 h-56 md:h-auto bg-slate-100 flex-shrink-0 relative overflow-hidden">
                            <img src={record.imageUrl} alt="成果物" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=400'; }} />
                          </div>
                        )}
                        <div className="p-8 flex-1 space-y-5 flex flex-col">
                          <div className="flex justify-between items-start gap-4 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-1">{new Date(record.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              <h4 className="text-2xl font-black text-slate-800 truncate leading-tight">{record.title}</h4>
                            </div>
                            {currentUser.role === 'student' && (
                              <button onClick={async () => { if (window.confirm('削除しますか？')) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'learning_records', record.id)); } }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={16} /></button>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 leading-relaxed font-medium whitespace-pre-wrap flex-grow">{record.content}</p>

                          {/* 管理者コメント */}
                          {record.comment && (
                            <div className="mt-4 bg-orange-50/70 border border-orange-100 p-5 rounded-2xl relative">
                              <div className="absolute top-0 left-8 -translate-y-1/2 w-4 h-4 bg-orange-50/70 border-t border-l border-orange-100 rotate-45"></div>
                              <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest mb-2"><MessageSquare size={12} /> Administrator Feedback</div>
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
      </main>

      <footer className="shrink-0 mt-auto py-10 border-t border-slate-200 text-center text-slate-300 text-[10px] font-black tracking-[0.5em] uppercase">
        Clayette Educational Management Platform
      </footer>

      {showReport && <ReportModal />}

      <style>{`
        @media print { .print\\:hidden { display: none !important; } .print\\:bg-white { background: white !important; } .print\\:p-10 { padding: 2.5rem !important; } body { overflow: visible !important; } .rounded-[2rem], .rounded-[2.5rem] { border-radius: 1rem !important; } }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; background: white; cursor: pointer; border-radius: 50%; border: 4px solid #ea580c; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .animate-bounce-slow { animation: bounce 3s infinite ease-in-out; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

      `}</style>
    </div>
  );
};

export default App;