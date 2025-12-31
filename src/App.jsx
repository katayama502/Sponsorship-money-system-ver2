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
  Building,
  Maximize2,
  Minimize2,
  ExternalLink,
  ClipboardCheck,
  Download
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot, query, serverTimestamp, addDoc, updateDoc, getDocs, where } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
    apiKey: "AIzaSyArYfL-wE_F0OF3QNl5_jh_B7ZXr7Ev5fg",
    authDomain: "creatte-sponser-app.firebaseapp.com",
    projectId: "creatte-sponser-app",
    storageBucket: "creatte-sponser-app.firebasestorage.app",
    messagingSenderId: "753873131194",
    appId: "1:753873131194:web:496a6913a523139c7e1483"
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
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReport, setShowReport] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

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

  // --- フォーム状態 ---
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: '', school: '', age: '', courseId: 'premium', remarks: '', nextClassDate: '',
    studentLoginId: '', studentPassword: '', parentLoginId: '', parentPassword: ''
  });
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [newLearningRecord, setNewLearningRecord] = useState({ title: '', content: '', imageUrl: '' });
  const [adminComment, setAdminComment] = useState({});
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', type: 'info' });
  const [materials, setMaterials] = useState([]);
  const [materialForm, setMaterialForm] = useState({ title: '', url: '', tags: '', type: 'standard' });
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedTag, setSelectedTag] = useState('All');
  const [sponsorForm, setSponsorForm] = useState({ name: '', repName: '', email: '', amount: '' });
  const [editingSponsor, setEditingSponsor] = useState(null);

  // --- Firebase 認証処理 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Firebase Auth Error:", e.code);
        await signInAnonymously(auth);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  // --- Firestore リアルタイム監視 ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
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
      return () => { unsubRecords(); unsubStudents(); unsubAnnounce(); unsubLearning(); unsubMaterials(); unsubSponsors(); };
    });
    return () => unsubscribeAuth();
  }, []);

  // --- 計算ロジック ---
  const sponsorshipTotal = useMemo(() => sponsors.reduce((acc, s) => acc + (Number(s.amount) || 0), 0), [sponsors]);
  const studentCountsFromDb = useMemo(() => {
    const counts = { premium: 0, standard: 0, basic: 0, entry: 0 };
    students.forEach(s => { if (counts[s.courseId] !== undefined) counts[s.courseId]++; });
    return counts;
  }, [students]);
  const totalOperatingCost = useMemo(() => Object.values(costs).reduce((acc, curr) => acc + curr, 0), [costs]);
  const totalStudentsCount = students.length;
  const totalBaseRevenue = COURSE_BASES.reduce((acc, c) => acc + (c.price * (studentCountsFromDb[c.id] || 0)), 0);
  const bufferAmountValue = bufferStudentTarget * COURSE_BASES[0].price;
  const availableSurplusTotal = (totalBaseRevenue + sponsorshipTotal) - (totalOperatingCost + bufferAmountValue);
  const reductionPerStudentVal = totalStudentsCount === 0 ? 0 : Math.max(0, Math.floor(availableSurplusTotal / totalStudentsCount / 1000) * 1000);
  const coverageRatePercentage = Math.min(100, totalOperatingCost > 0 ? Math.round((sponsorshipTotal / totalOperatingCost) * 100) : 0);

  const finalNetSurplusVal = availableSurplusTotal - (reductionPerStudentVal * totalStudentsCount);
  const capacityPerCourseList = useMemo(() => {
    const pool = finalNetSurplusVal + bufferAmountValue;
    return COURSE_BASES.map(course => ({
      ...course,
      count: Math.floor(pool / Math.max(1, course.price - reductionPerStudentVal))
    }));
  }, [finalNetSurplusVal, bufferAmountValue, reductionPerStudentVal]);

  // --- ハンドラー ---
  const handleCostChange = (key, value) => setCosts(prev => ({ ...prev, [key]: parseInt(value) || 0 }));

  const handleLoginSubmit = async (e) => {
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
        found = { role: 'student', name: data.name, studentId: docSnap.id, nextClassDate: data.nextClassDate, loginId: data.studentLoginId, password: data.studentPassword };
      } else if (data.parentLoginId === loginId && data.parentPassword === password) {
        found = { role: 'parent', name: `${data.name}の保護者`, childId: docSnap.id, childName: data.name, nextClassDate: data.nextClassDate, loginId: data.parentLoginId, password: data.parentPassword };
      }
    });
    if (found) { setCurrentUser(found); setActiveTab('mypage'); }
    else { setAuthError('IDまたはパスワードが正しくありません'); }
  };

  const handleLogoutAction = () => { setCurrentUser(null); setLoginId(''); setPassword(''); setSelectedMaterial(null); };

  const fillCredentialsFields = () => {
    const s = generateCredentials();
    const p = generateCredentials();
    setStudentForm(prev => ({ ...prev, studentLoginId: s.id, studentPassword: s.pw, parentLoginId: p.id, parentPassword: p.pw }));
  };

  const copyToClipboard = (text) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const saveStudentEntry = async (e) => {
    e.preventDefault();
    try {
      const sId = studentForm.studentLoginId || generateCredentials().id;
      const sPw = studentForm.studentPassword || generateCredentials().pw;
      const pId = studentForm.parentLoginId || generateCredentials().id;
      const pPw = studentForm.parentPassword || generateCredentials().pw;
      const data = { ...studentForm, studentLoginId: sId, studentPassword: sPw, parentLoginId: pId, parentPassword: pPw, updatedAt: serverTimestamp() };
      if (editingStudent) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', editingStudent.id), data);
        setSaveMessage('更新しました');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { ...data, createdAt: serverTimestamp() });
        setGeneratedCreds({ student: { id: sId, pw: sPw }, parent: { id: pId, pw: pPw }, name: studentForm.name });
        setSaveMessage('登録完了・ID発行');
      }
      setStudentForm({ name: '', school: '', age: '', courseId: 'premium', remarks: '', nextClassDate: '', studentLoginId: '', studentPassword: '', parentLoginId: '', parentPassword: '' });
      setEditingStudent(null);
    } catch (e) { setSaveMessage('エラーが発生しました'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const saveSponsorEntry = async (e) => {
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
      setSaveMessage('協賛データを更新しました');
    } catch (e) { setSaveMessage('エラー'); }
  };

  const saveMaterialEntry = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = materialForm.tags.split(',').map(t => t.trim()).filter(t => t);
      const isScratch = tagsArray.some(t => t.toLowerCase() === 'scratch');
      const data = { ...materialForm, tags: tagsArray, type: isScratch ? 'scratch' : 'standard', updatedAt: serverTimestamp() };
      if (editingMaterial) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'materials', editingMaterial.id), data);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'materials'), { ...data, createdAt: serverTimestamp() });
      }
      setMaterialForm({ title: '', url: '', tags: '', type: 'standard' });
      setEditingMaterial(null);
      setSaveMessage('教材を保存しました');
    } catch (e) { setSaveMessage('エラー'); }
  };

  const recordMonthlyStatusToDb = async () => {
    setIsRecording(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'monthly_records', recordMonth);
      await setDoc(docRef, {
        month: recordMonth, costs, sponsorship: sponsorshipTotal, bufferStudentTarget,
        totalCost: totalOperatingCost, studentCounts: studentCountsFromDb,
        totalStudents: totalStudentsCount, reductionAmount: reductionPerStudentVal, recordedAt: serverTimestamp()
      });
      setSaveMessage('月次データを保存しました');
    } catch (e) { setSaveMessage('エラー'); }
    finally { setIsRecording(false); }
  };

  const submitLearningRecordPost = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'learning_records'), {
        ...newLearningRecord, studentId: currentUser.studentId, studentName: currentUser.name, date: new Date().toISOString(), createdAt: serverTimestamp(), comment: ''
      });
      setNewLearningRecord({ title: '', content: '', imageUrl: '' });
      setSaveMessage('記録しました');
    } catch (e) { setSaveMessage('失敗'); }
  };

  const submitAdminFeedbackComment = async (recordId) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'learning_records', recordId), {
        comment: adminComment[recordId], commentedAt: serverTimestamp()
      });
      setSaveMessage('送信完了');
    } catch (e) { setSaveMessage('失敗'); }
  };

  const postAnnouncementToPortal = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), { ...announcementForm, createdAt: serverTimestamp() });
      setAnnouncementForm({ title: '', content: '', type: 'info' });
      setSaveMessage('お知らせを公開しました');
    } catch (e) { setSaveMessage('失敗'); }
  };

  // --- サブコンポーネント: TrendChart ---
  const TrendChart = () => {
    if (historyRecords.length < 2) return <div className="h-32 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed text-xs text-slate-400 font-sans">履歴データ不足</div>;
    const maxVal = Math.max(...historyRecords.map(r => Math.max(r.totalCost || 0, r.sponsorship || 0))) * 1.2;
    const points = (valKey) => historyRecords.map((r, i) => `${(i / (historyRecords.length - 1)) * 100},${100 - ((r[valKey] || 0) / maxVal) * 100}`).join(' ');
    return (
      <div className="w-full bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative mb-6">
        <div className="flex justify-between items-center mb-4 text-[10px] font-bold tracking-widest uppercase font-sans">
          <div className="flex items-center gap-2 text-orange-400 tracking-[0.2em] font-sans"><TrendingUp size={14} /> Performance Trend</div>
          <div className="flex gap-4"><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> 協賛</div><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> 運営</div></div>
        </div>
        <svg viewBox="0 0 100 100" className="w-full h-32 md:h-24 overflow-visible" preserveAspectRatio="none">
          <polyline fill="none" stroke="#64748b" strokeWidth="1" points={points('totalCost')} />
          <polyline fill="none" stroke="#f97316" strokeWidth="2" points={points('sponsorship')} />
        </svg>
      </div>
    );
  };

  // --- 教材詳細（Scratchスプリットビュー：左資料・右Scratch） ---
  const MaterialDetailView = () => {
    if (!selectedMaterial) return null;
    const isScratch = selectedMaterial.type === 'scratch';

    return (
      <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col text-left animate-in slide-in-from-bottom duration-500">
        {/* スプリットビュー・ヘッダー */}
        <div className="bg-slate-800 p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-700 gap-4 text-left">
          <div className="flex items-center gap-3 text-left">
            <button onClick={() => setSelectedMaterial(null)} className="p-2 bg-slate-700 text-white rounded-xl hover:bg-rose-600 transition-all text-left"><X size={20} /></button>
            <h3 className="font-black text-white text-sm md:text-lg truncate max-w-[300px] text-left">{selectedMaterial.title}</h3>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-700 text-left">
            <div className="flex flex-col text-left">
              <p className="text-[8px] md:text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1 font-sans text-left">Scratch/App Login Sync</p>
              <div className="flex gap-4 text-[10px] md:text-xs font-bold text-white font-sans text-left">
                <span>ID: <span className="text-orange-200 select-all">{currentUser?.loginId}</span></span>
                <span>PW: <span className="text-orange-200 select-all">{currentUser?.password}</span></span>
              </div>
            </div>
            <button onClick={() => copyToClipboard(`ID: ${currentUser?.loginId}\nPW: ${currentUser?.password}`)} className={`p-2 rounded-lg transition-all ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>{isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}</button>
          </div>
        </div>

        {/* スプリットビュー・メインレイアウト */}
        <div className={`flex flex-1 ${isScratch ? 'flex-col lg:flex-row' : 'flex-col'} overflow-hidden text-left`}>
          {isScratch ? (
            <>
              {/* 左側: 教材資料 */}
              <div className="w-full lg:w-[450px] bg-slate-50 border-r border-slate-700 flex flex-col overflow-hidden text-left">
                <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 text-left">
                  <div className="text-left"><p className="text-[10px] font-bold text-orange-600 mb-0.5 uppercase font-sans text-left tracking-widest">Guide</p><h4 className="font-black text-slate-800 text-left">教材ドキュメント</h4></div>
                  <a href={selectedMaterial.url} target="_blank" className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-orange-600 hover:text-white transition-all text-left"><ExternalLink size={16} /></a>
                </div>
                <div className="flex-1 overflow-y-auto bg-white text-left">
                  <iframe src={selectedMaterial.url} className="w-full h-full border-none text-left" title="Material View" />
                </div>
                <div className="p-4 bg-orange-600 text-white text-[10px] font-bold text-center uppercase tracking-[0.2em] shrink-0">
                  保存は必ず「ファイル」→「コンピューターに保存」を選択してください
                </div>
              </div>
              {/* 右側: Scratchエディタ */}
              <div className="flex-1 bg-white relative text-left">
                <iframe src="https://turbowarp.org/editor" className="w-full h-full border-none text-left" title="Scratch Editor" allowTransparency="true" allowFullScreen="true" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
              </div>
            </>
          ) : (
            <div className="flex-1 bg-white text-left">
              <iframe src={selectedMaterial.url} className="w-full h-full border-none shadow-inner text-left" title="Full Material" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- 報告書PDFプレビューモーダル ---
  const ReportModal = () => (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 print:p-0 print:bg-white print:static text-left overflow-y-auto">
      <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[95vh] overflow-y-auto md:rounded-3xl shadow-2xl print:shadow-none print:max-h-full print:rounded-none text-left">
        <div className="p-4 md:p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-20 print:hidden text-left">
          <div className="flex items-center gap-2 font-bold text-slate-700 text-left font-sans"><FileText className="text-orange-600 w-5 h-5" /> 報告書プレビュー</div>
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
              <p className="text-xs font-bold text-slate-400 text-left md:text-right font-sans">Issued Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm font-black text-slate-800 text-left md:text-right uppercase">Clayette Project</p>
            </div>
          </div>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            <div className="md:col-span-1 bg-orange-600 p-8 rounded-[2rem] text-white flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-80 font-sans">Coverage Rate</p>
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${coverageRatePercentage} 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-3xl">{coverageRatePercentage}%</div>
              </div>
            </div>
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left"><p className="text-xs font-bold text-slate-400 mb-2 uppercase text-left font-sans">Total Sponsorship</p><p className="text-4xl font-black text-slate-900 tracking-tighter text-left font-sans">¥{sponsorshipTotal.toLocaleString()}</p></div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left"><p className="text-xs font-bold text-slate-400 mb-2 uppercase text-left font-sans">Benefit per child</p><p className="text-4xl font-black text-orange-600 tracking-tighter text-left font-sans">¥{reductionPerStudentVal.toLocaleString()}</p></div>
            </div>
          </section>
          <section className="text-left space-y-6">
            <div className="flex items-center gap-2 font-bold text-xl border-l-4 border-orange-500 pl-4 text-left">資金使途の詳細</div>
            <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6 text-left">
              {Object.entries(costs).map(([key, value]) => {
                const categoryWeight = totalOperatingCost > 0 ? value / totalOperatingCost : 0;
                const coverRatio = Math.min(100, value > 0 ? Math.round((sponsorshipTotal * categoryWeight / value) * 100) : 0);
                return (
                  <div key={key} className="text-left space-y-2">
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

  // --- ローディング画面 ---
  if (isAuthLoading) {
    return <div className="min-h-screen bg-orange-50 flex items-center justify-center"><Loader2 className="w-10 h-10 text-orange-600 animate-spin" /></div>;
  }

  // --- ログイン画面 ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6 text-left overflow-y-auto font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-orange-100 animate-in zoom-in-95 duration-500 text-left">
          <div className="text-center space-y-2 text-slate-900">
            <div className="bg-orange-600 w-16 h-16 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg"><Calculator size={32} /></div>
            <h1 className="text-2xl font-black tracking-tighter uppercase font-sans">Clayette Portal</h1>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase text-center">Education Hub</p>
          </div>
          <form onSubmit={handleLoginSubmit} className="space-y-6 text-left">
            <div className="space-y-4 text-left">
              <div className="text-left"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block text-left">Login ID</label><div className="relative"><input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none text-left font-sans" /><Users className="absolute right-4 top-3.5 text-slate-300" size={16} /></div></div>
              <div className="text-left"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block text-left">Password</label><div className="relative"><input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none text-left font-sans" /><Key className="absolute right-4 top-3.5 text-slate-300" size={16} /></div></div>
            </div>
            {authError && <p className="text-rose-500 text-[10px] font-bold text-center bg-rose-50 py-2 rounded-xl border border-rose-100 font-sans">{authError}</p>}
            <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-orange-700 transition-all active:scale-95 text-base uppercase font-sans tracking-widest">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left overflow-x-hidden flex flex-col relative font-sans">
      <MaterialDetailView />
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 shrink-0 shadow-sm text-left">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 text-left">
          <div className="flex items-center gap-3 text-left">
            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg"><Calculator size={18} /></div>
            <span className="font-black tracking-tighter text-slate-800 hidden sm:inline uppercase text-left font-sans">Clayette System</span>
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
                  <button onClick={() => setActiveTab('mypage')} className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'mypage' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>マイページ</button>
                  <button onClick={() => setActiveTab('materials')} className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'materials' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>教材一覧</button>
                </>
              )}
            </div>
            <button onClick={handleLogoutAction} className="text-slate-400 hover:text-rose-600 transition-colors ml-2 text-left outline-none"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8 text-left text-slate-900 overflow-y-auto">
        {saveMessage && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce text-left"><CheckCircle2 size={18} className="text-emerald-400" /><span className="text-sm font-bold font-sans tracking-tight">{saveMessage}</span></div>}

        {/* 管理者: 分析 & シミュレーター */}
        {currentUser.role === 'admin' && activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
              <div className="text-left"><h2 className="text-2xl font-black tracking-tight text-left">受講料・協賛金分析</h2><p className="text-slate-400 text-sm font-medium text-left">運営コストと支援インパクトの統合ダッシュボード</p></div>
              <div className="flex gap-2 text-left">
                <button onClick={() => setShowReport(true)} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg shadow-orange-100 text-sm uppercase tracking-tighter font-sans"><FileText size={18} /> REPORT</button>
                <div className="bg-white border border-slate-200 rounded-xl px-2 flex items-center gap-2 text-left shadow-sm"><input type="month" value={recordMonth} onChange={e => setRecordMonth(e.target.value)} className="py-2 text-xs font-bold outline-none bg-transparent font-sans" /><button onClick={recordMonthlyStatusToDb} className="text-[10px] font-black text-orange-600 px-2 uppercase font-sans">SAVE</button></div>
              </div>
            </header>
            <TrendChart />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left items-start">
              <div className="space-y-6 text-left">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 text-left shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-widest text-left font-sans"><Settings2 size={14} className="text-orange-500" /> Operational Costs</div>
                  {Object.entries(costs).map(([key, value]) => (
                    <div key={key} className="text-left"><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest text-left font-sans">{key}</label><input type="number" value={value} onChange={e => handleCostChange(key, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500 transition-all font-sans" /></div>
                  ))}
                  <div className="pt-4 border-t border-dashed flex justify-between font-black text-left"><span className="text-xs text-slate-400 uppercase tracking-widest text-left font-sans">Total Cost</span><span className="text-orange-600 text-right font-sans">¥{totalOperatingCost.toLocaleString()}</span></div>
                </div>
                <div className="bg-orange-600 text-white rounded-3xl p-6 space-y-4 shadow-xl text-left">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-80 text-left font-sans"><ShieldCheck size={14} /> Buffer Margin</div>
                  <input type="range" min="0" max="20" step="1" value={bufferStudentTarget} onChange={e => setBufferStudentTarget(parseInt(e.target.value))} className="w-full h-1.5 bg-orange-400 rounded-full appearance-none accent-white cursor-pointer" />
                  <div className="flex justify-between font-black text-left font-sans"><span className="text-[10px] text-left uppercase">Margin: {bufferStudentTarget} Pax</span><span className="text-lg text-right tracking-tight font-sans">¥{bufferAmountValue.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6 text-left">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden shadow-sm text-left">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-left"><Coins size={120} /></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left font-sans tracking-widest">Total Monthly Sponsorship Sum</p>
                  <p className="text-5xl font-black text-orange-600 tracking-tighter text-left font-sans">¥{sponsorshipTotal.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-4 italic text-left">※協賛企業管理タブで登録された {sponsors.length} 社の合計金額です。</p>
                </div>
                <div className="bg-orange-600 rounded-[2.5rem] p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl shadow-orange-100 text-left text-white">
                  <div className="text-left text-white space-y-4">
                    <p className="text-orange-100 text-[10px] font-bold uppercase mb-2 tracking-[0.2em] text-left font-sans">Reduction per child</p>
                    <div className="flex items-center gap-4 text-left">
                      <ArrowDownCircle size={48} className="text-orange-200 animate-bounce-slow" />
                      <span className="text-5xl md:text-7xl font-black tracking-tighter text-left font-sans">¥{reductionPerStudentVal.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 text-center min-w-[140px] text-left flex flex-col justify-center">
                    <p className="text-[10px] font-bold mb-1 opacity-80 uppercase tracking-widest text-center text-white font-sans">Coverage</p>
                    <p className="text-4xl font-black text-center text-white font-sans">{coverageRatePercentage}%</p>
                  </div>
                </div>

                {/* コース別価格カード（管理者ダッシュボード） */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {COURSE_BASES.map((course) => {
                    const discountedPrice = Math.max(0, course.price - reductionPerStudentVal);
                    const isFree = discountedPrice === 0;
                    const enrolledCount = studentCountsFromDb[course.id] || 0;
                    return (
                      <div key={course.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-orange-200 transition-all shadow-sm text-left group">
                        <div className="flex justify-between items-start mb-4 text-left">
                          <div className="text-left">
                            <h4 className="font-black text-slate-800 text-lg tracking-tight text-left">{course.label}</h4>
                            <span className="text-[10px] text-slate-300 font-bold line-through text-left font-sans tracking-widest">¥{course.price.toLocaleString()}</span>
                          </div>
                          <span className="bg-slate-50 text-slate-400 text-[9px] font-black px-2 py-1 rounded-full uppercase text-left tracking-tighter group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors font-sans">{enrolledCount} pax</span>
                        </div>
                        <div className="text-left space-y-2">
                          <div className="flex items-end gap-1 text-left"><span className={`text-2xl md:text-3xl font-black text-left font-sans ${isFree ? 'text-emerald-500' : 'text-slate-900'}`}>{isFree ? 'FREE' : `¥${discountedPrice.toLocaleString()}`}</span>{!isFree && <span className="text-[10px] text-slate-400 font-bold mb-1.5 text-left font-sans">/ mo</span>}</div>
                          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden text-left"><div className="h-full bg-orange-500 transition-all duration-1000 text-left" style={{ width: `${Math.min(100, (reductionPerStudentVal / course.price) * 100)}%` }} /></div>
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
            <header className="text-left"><h2 className="text-2xl font-black tracking-tight text-left text-slate-800">生徒・保護者管理システム</h2></header>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start text-left text-slate-900">
              <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left font-sans">Enrollment</h3>
                <form onSubmit={saveStudentEntry} className="space-y-5 text-left">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1 text-left font-sans">Student Name</label><input type="text" required value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-left outline-none" /></div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-left font-sans">School</label><input type="text" value={studentForm.school} onChange={e => setStudentForm({ ...studentForm, school: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-left" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-left font-sans">Age</label><input type="number" value={studentForm.age} onChange={e => setStudentForm({ ...studentForm, age: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-left" /></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 text-left font-sans">Next Class</label><input type="date" value={studentForm.nextClassDate} onChange={e => setStudentForm({ ...studentForm, nextClassDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-left" /></div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-left">
                    <div className="flex justify-between items-center text-left"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-sans">Auth Setup</span><button type="button" onClick={fillCredentialsFields} className="text-[9px] bg-slate-200 px-2 py-1 rounded font-black text-slate-500 tracking-widest hover:bg-slate-300 font-sans">AUTO FILL</button></div>
                    <div className="grid grid-cols-1 gap-2 text-left font-sans"><input type="text" placeholder="ID" value={studentForm.studentLoginId} onChange={e => setStudentForm({ ...studentForm, studentLoginId: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-left" /><input type="text" placeholder="PW" value={studentForm.studentPassword} onChange={e => setStudentForm({ ...studentForm, studentPassword: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-left" /></div>
                  </div>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 transition-all uppercase tracking-widest text-sm font-sans">{editingStudent ? 'UPDATE' : 'REGISTER'}</button>
                </form>
              </div>
              <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {students.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm relative group hover:border-orange-300 transition-all text-left">
                    <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all text-left"><button onClick={() => { setEditingStudent(s); setStudentForm(s); window.scrollTo(0, 0); }} className="p-2 bg-slate-50 text-slate-400 hover:text-orange-600 rounded-lg transition-colors"><Edit2 size={14} /></button><button onClick={async () => { if (window.confirm('削除？')) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', s.id)); } }} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={14} /></button></div>
                    <div className="text-left"><h4 className="font-black text-xl text-slate-800 text-left tracking-tight">{s.name}</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left font-sans">{s.school} | {s.age}歳</p></div>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between text-[10px] font-bold text-slate-400 font-sans uppercase"><span>ID: {s.studentLoginId}</span><span>P-ID: {s.parentLoginId}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 協賛管理 (リアルタイム同期済み) */}
        {currentUser.role === 'admin' && activeTab === 'sponsors' && (
          <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
            <header className="text-left"><h2 className="text-2xl font-black tracking-tight text-left text-slate-800">協賛企業・支援管理</h2></header>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 text-left items-start">
              <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left font-sans">協賛企業登録</h3>
                <form onSubmit={saveSponsorEntry} className="space-y-4 text-left font-sans">
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">会社名</label><input type="text" required value={sponsorForm.name} onChange={e => setSponsorForm({ ...sponsorForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" /></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">代表者名</label><input type="text" value={sponsorForm.repName} onChange={e => setSponsorForm({ ...sponsorForm, repName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" /></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">メールアドレス</label><input type="email" value={sponsorForm.email} onChange={e => setSponsorForm({ ...sponsorForm, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" /></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">月額協賛金</label><input type="number" required value={sponsorForm.amount} onChange={e => setSponsorForm({ ...sponsorForm, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-orange-600 text-left outline-none focus:ring-2 focus:ring-orange-500" /></div>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 transition-all uppercase tracking-widest text-sm active:scale-95">協賛企業を保存</button>
                </form>
              </div>
              <div className="xl:col-span-3 space-y-4 text-left font-sans">
                <div className="flex justify-between items-end mb-2 px-2 text-slate-800 text-left"><p className="text-xs font-bold uppercase tracking-widest opacity-40 text-left">契約中の協賛企業</p><p className="font-black text-xl text-right">合計: ¥{sponsorshipTotal.toLocaleString()}</p></div>
                {sponsors.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-orange-300 transition-all text-left shadow-sm">
                    <div className="text-left w-full flex items-center gap-4"><div className="bg-orange-50 p-3 rounded-2xl"><Building className="text-orange-500" size={24} /></div><div className="text-left"><h4 className="font-black text-lg text-slate-800 text-left">{s.name}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">{s.repName || 'Official Partner'} {s.email && <span className="normal-case tracking-normal ml-2 text-slate-300">| {s.email}</span>}</p></div></div>
                    <div className="flex items-center gap-6 shrink-0 mt-4 md:mt-0 text-left"><p className="text-xl font-black text-orange-600 text-left tracking-tighter">¥{Number(s.amount).toLocaleString()}</p><div className="flex gap-2 text-left"><button onClick={() => { setEditingSponsor(s); setSponsorForm(s); window.scrollTo(0, 0); }} className="p-2 bg-slate-50 text-slate-400 hover:text-orange-600 transition-all"><Edit2 size={16} /></button><button onClick={() => deleteSponsorEntry(s.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={16} /></button></div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 教材管理 (管理者) - 復旧 */}
        {currentUser.role === 'admin' && activeTab === 'materials' && (
          <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
            <header className="text-left"><h2 className="text-2xl font-black tracking-tight text-left text-slate-800">教材管理システム</h2></header>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 text-left items-start">
              <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left font-sans">教材登録</h3>
                <form onSubmit={saveMaterialEntry} className="space-y-4 text-left font-sans">
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">教材タイトル</label><input type="text" required value={materialForm.title} onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" /></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">教材URL</label><input type="url" required value={materialForm.url} onChange={e => setMaterialForm({ ...materialForm, url: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" /></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">タグ (カンマ区切り)</label><input type="text" value={materialForm.tags} onChange={e => setMaterialForm({ ...materialForm, tags: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" placeholder="例: 算数, 理科" /></div>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 transition-all uppercase tracking-widest text-sm active:scale-95">{editingMaterial ? '教材を更新' : '教材を登録'}</button>
                </form>
              </div>
              <div className="xl:col-span-3 space-y-4 text-left font-sans">
                {materials.map(m => (
                  <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-orange-300 transition-all text-left shadow-sm">
                    <div className="text-left w-full"><h4 className="font-black text-lg text-slate-800 text-left">{m.title}</h4><div className="flex flex-wrap gap-2 mt-2 text-left">{m.tags.map(t => (<span key={t} className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase text-left tracking-widest font-sans">{t}</span>))}</div><a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 font-bold mt-2 inline-block hover:underline truncate max-w-md">{m.url}</a></div>
                    <div className="flex gap-2 text-left shrink-0 mt-4 md:mt-0"><button onClick={() => { setEditingMaterial(m); setMaterialForm({ title: m.title, url: m.url, tags: m.tags.join(', '), type: m.type }); window.scrollTo(0, 0); }} className="p-2 bg-slate-50 text-slate-400 hover:text-orange-600 transition-all rounded-lg"><Edit2 size={16} /></button><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'materials', m.id))} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 transition-all rounded-lg"><Trash2 size={16} /></button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* お知らせ管理 (管理者) - 復旧 */}
        {currentUser.role === 'admin' && activeTab === 'notices' && (
          <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
            <header className="text-left"><h2 className="text-2xl font-black tracking-tight text-left text-slate-800">お知らせ配信</h2></header>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 text-left items-start">
              <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left font-sans">新規お知らせ作成</h3>
                <form onSubmit={postAnnouncementToPortal} className="space-y-4 text-left font-sans">
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">タイトル</label><input type="text" required value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500" /></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">種類</label><select value={announcementForm.type} onChange={e => setAnnouncementForm({ ...announcementForm, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500"><option value="info">お知らせ</option><option value="alert">重要</option><option value="event">イベント</option></select></div>
                  <div className="space-y-1 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-left">本文</label><textarea required value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500 h-32 resize-none" /></div>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 transition-all uppercase tracking-widest text-sm active:scale-95">公開する</button>
                </form>
              </div>
              <div className="xl:col-span-3 space-y-4 text-left font-sans">
                {announcements.map(a => (
                  <div key={a.id} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 relative group hover:border-orange-300 transition-all text-left shadow-sm">
                    <div className="flex justify-between items-start text-left">
                      <div className="text-left"><span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest text-left font-sans ${a.type === 'alert' ? 'bg-rose-100 text-rose-600' : a.type === 'event' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{a.type === 'alert' ? '重要' : a.type === 'event' ? 'イベント' : 'お知らせ'}</span><span className="text-[10px] text-slate-400 font-bold ml-2 uppercase tracking-widest text-left font-sans">{a.createdAt ? new Date(a.createdAt.toMillis()).toLocaleDateString() : '---'}</span></div>
                      <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'announcements', a.id))} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 transition-all rounded-lg"><Trash2 size={16} /></button>
                    </div>
                    <h4 className="font-black text-lg text-slate-800 text-left">{a.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed text-left">{a.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 教材ライブラリ (受講生・保護者向け) */}
        {(currentUser.role === 'student' || currentUser.role === 'parent') && activeTab === 'materials' && (
          <div className="space-y-8 text-left animate-in fade-in duration-500 text-slate-900">
            <header className="text-left"><h2 className="text-2xl font-black text-slate-800 tracking-tight text-left uppercase font-sans">Material Library</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {materials.map(m => (
                <div key={m.id} onClick={() => setSelectedMaterial(m)} className="bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all text-left cursor-pointer hover:border-orange-500">
                  <div className="text-left">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-slate-800 text-xl text-left tracking-tight">{m.title}</h4>
                      {m.type === 'scratch' && <div className="bg-orange-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase font-sans tracking-widest animate-pulse">Scratch Mode</div>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-left">{m.tags.map(t => (<span key={t} className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase text-left tracking-widest font-sans">{t}</span>))}</div>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-orange-600 text-sm font-black uppercase tracking-widest font-sans group-hover:gap-3 transition-all">VIEW CONTENT <ChevronRight size={16} /></div>
                </div>
              ))}
              {materials.length === 0 && <div className="md:col-span-2 py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 font-bold uppercase tracking-widest text-xs font-sans">No materials currently published.</div>}
            </div>
          </div>
        )}

        {/* 受講生: マイページ & 学習記録 */}
        {(currentUser.role === 'student' || currentUser.role === 'parent') && activeTab === 'mypage' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 text-left text-slate-900">
            <header className="flex flex-col md:flex-row justify-between items-start gap-6 text-left">
              <div className="text-left"><h2 className="text-3xl font-black tracking-tight text-left text-slate-800 uppercase font-sans">{currentUser.name}様 <span className="text-orange-600 font-light ml-2">My Portal</span></h2><p className="text-slate-400 text-sm font-medium mt-1 text-left">日々の成果を記録し、世界にひとつのポートフォリオを構築しましょう。</p></div>
              <div className="w-full md:w-auto grid grid-cols-2 gap-4 shrink-0 text-left font-sans">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-center text-left"><p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1.5 text-left tracking-widest"><Clock size={12} className="text-orange-500" /> NEXT CLASS</p><p className="text-xl font-black text-slate-800 whitespace-nowrap text-left">{currentUser.nextClassDate || '---'}</p></div>
                <div className="bg-orange-600 p-5 rounded-3xl text-white shadow-xl flex flex-col justify-center text-left"><p className="text-[10px] font-black uppercase mb-1 opacity-60 tracking-widest text-left font-sans">MONTHLY SAVING</p><p className="text-xl font-black tracking-tighter text-left">¥{reductionPerStudentVal.toLocaleString()}</p></div>
              </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start text-left">
              {currentUser.role === 'student' && (
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 h-fit sticky top-24 shadow-sm text-left">
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-widest text-left font-sans"><BookOpen size={16} className="text-orange-500" /> New Portfolio Log</div>
                  <form onSubmit={submitLearningRecordPost} className="space-y-4 text-left"><input type="text" value={newLearningRecord.title} onChange={e => setNewLearningRecord({ ...newLearningRecord, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-left outline-none focus:ring-2 focus:ring-orange-500 font-sans" placeholder="タイトルを入力" required /><textarea value={newLearningRecord.content} onChange={e => setNewLearningRecord({ ...newLearningRecord, content: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-32 resize-none text-left focus:ring-2 focus:ring-orange-500 font-sans" placeholder="今日学んだことや感想" required /><button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-sans">Save Log</button></form>
                </div>
              )}
              <div className={`${currentUser.role === 'student' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6 text-left`}>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 text-left"><ImageIcon size={22} className="text-orange-500" /> 成長のポートフォリオ</h3>
                <div className="grid grid-cols-1 gap-6 text-left">
                  {learningRecords.length === 0 ? <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest font-sans">No data recorded.</div> :
                    learningRecords.sort((a, b) => b.date.localeCompare(a.date)).map(record => (
                      <div key={record.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all text-left">
                        <div className="p-8 flex-1 space-y-5 text-left">
                          <div className="text-left font-sans"><p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-1 text-left">{new Date(record.date).toLocaleDateString()}</p><h4 className="text-2xl font-black text-slate-800 text-left tracking-tight">{record.title}</h4></div>
                          <p className="text-sm text-slate-500 leading-relaxed font-medium whitespace-pre-wrap text-left">{record.content}</p>
                          {record.comment && <div className="mt-4 bg-orange-50/70 border border-orange-100 p-5 rounded-2xl relative text-left"><div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest mb-2 text-left font-sans"><MessageSquare size={12} /> Instructor feedback</div><p className="text-sm text-slate-700 font-bold italic text-left">"{record.comment}"</p></div>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="shrink-0 mt-auto py-10 border-t border-slate-200 text-center text-slate-300 text-[10px] font-black tracking-[0.5em] uppercase text-center bg-white/50 font-sans">Clayette Educational Management Platform</footer>
      {showReport && <ReportModal />}
      <style>{`
        @media print { .print\\:hidden { display: none !important; } .print\\:bg-white { background: white !important; } .print\\:p-10 { padding: 2.5rem !important; } body { overflow: visible !important; } .rounded-[2rem], .rounded-[2.5rem] { border-radius: 1.5rem !important; } }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; background: white; cursor: pointer; border-radius: 50%; border: 4px solid #ea580c; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .animate-bounce-slow { animation: bounce 3s infinite ease-in-out; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes bounce { 0%, 100% { transform: translateY(-5%) translateX(-50%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); } 50% { transform: translateY(0) translateX(-50%); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); } }
      `}</style>
    </div>
  );
};

export default App;