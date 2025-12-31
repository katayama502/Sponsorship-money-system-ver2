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
  Loader2
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp, addDoc, updateDoc } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyArYfL-wE_F0OF3QNl5_jh_B7ZXr7Ev5fg",
  authDomain: "creatte-sponser-app.firebaseapp.com",
  projectId: "creatte-sponser-app",
  storageBucket: "creatte-sponser-app.firebasestorage.app",
  messagingSenderId: "753873131194",
  appId: "1:753873131194:web:2843504ba7e2972a7e1483",
  measurementId: "G-MB7S0GVVQ5"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'clayette-tuition-optimizer';

const COURSE_BASES = [
  { id: 'premium', label: '月4回コース', price: 12000 },
  { id: 'standard', label: '月3回コース', price: 10000 },
  { id: 'basic', label: '月2回コース', price: 8000 },
  { id: 'entry', label: '月1回コース', price: 5000 },
];

const App = () => {
  // --- 初期状態設定 ---
  const initialCosts = {
    '家賃': 150000,
    '水道光熱費': 30000,
    '講師費用': 200000,
    '教材費': 50000,
    '備品費': 20000,
  };

  const initialStudentCounts = {
    premium: 0,
    standard: 0,
    basic: 0,
    entry: 0
  };

  // --- 状態管理 ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [costs, setCosts] = useState(initialCosts);
  const [sponsorship, setSponsorship] = useState(300000);
  const [bufferStudentTarget, setBufferStudentTarget] = useState(5); 
  const [showReport, setShowReport] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Firebase用
  const [user, setUser] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [recordMonth, setRecordMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isRecording, setIsRecording] = useState(false);

  // 生徒フォーム用
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    school: '',
    age: '',
    courseId: 'premium',
    remarks: ''
  });

  // --- 認証とリアルタイムリスナー ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const recordsCol = collection(db, 'artifacts', appId, 'public', 'data', 'monthly_records');
    const unsubscribeRecords = onSnapshot(recordsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoryRecords(data.sort((a, b) => a.month.localeCompare(b.month)));
    }, (error) => console.error(error));

    const studentsCol = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubscribeStudents = onSnapshot(studentsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    }, (error) => console.error(error));

    return () => {
      unsubscribeRecords();
      unsubscribeStudents();
    };
  }, [user]);

  // --- 計算ロジック ---
  const studentCountsFromDb = useMemo(() => {
    const counts = { premium: 0, standard: 0, basic: 0, entry: 0 };
    students.forEach(s => {
      if (counts[s.courseId] !== undefined) counts[s.courseId]++;
    });
    return counts;
  }, [students]);

  const totalOperatingCost = useMemo(() => Object.values(costs).reduce((acc, curr) => acc + curr, 0), [costs]);
  const totalStudents = useMemo(() => students.length, [students]);
  const totalBaseRevenue = useMemo(() => 
    COURSE_BASES.reduce((acc, c) => acc + (c.price * (studentCountsFromDb[c.id] || 0)), 0), [studentCountsFromDb]);

  const bufferAmount = useMemo(() => bufferStudentTarget * COURSE_BASES[0].price, [bufferStudentTarget]);

  const availableSurplus = useMemo(() => {
    return (totalBaseRevenue + sponsorship) - (totalOperatingCost + bufferAmount);
  }, [totalBaseRevenue, sponsorship, totalOperatingCost, bufferAmount]);

  const reductionPerStudent = useMemo(() => {
    if (totalStudents === 0) return 0;
    return Math.max(0, Math.floor(availableSurplus / totalStudents / 1000) * 1000);
  }, [availableSurplus, totalStudents]);

  const finalNetSurplus = useMemo(() => {
    return availableSurplus - (reductionPerStudent * totalStudents);
  }, [availableSurplus, reductionPerStudent, totalStudents]);

  const coverageRate = Math.min(100, totalOperatingCost > 0 ? Math.round((sponsorship / totalOperatingCost) * 100) : 0);

  const capacityPerCourse = useMemo(() => {
    const pool = finalNetSurplus + bufferAmount;
    return COURSE_BASES.map(course => ({
      ...course,
      count: Math.floor(pool / Math.max(1, course.price - reductionPerStudent))
    }));
  }, [finalNetSurplus, bufferAmount, reductionPerStudent]);

  // --- ハンドラー ---
  const handleCostChange = (key, value) => setCosts(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  
  const resetData = () => {
    setCosts(initialCosts);
    setSponsorship(300000);
    setBufferStudentTarget(5);
    setSaveMessage('初期化しました');
    setTimeout(() => setSaveMessage(''), 3000);
  };

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
    finally { 
      setIsRecording(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const deleteMonthlyRecord = async (id) => {
    if (!window.confirm(`${id} のデータを削除してもよろしいですか？`)) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'monthly_records', id));
      setSaveMessage('削除しました');
    } catch (e) { setSaveMessage('削除に失敗しました'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const loadRecordForEdit = (record) => {
    if (record.costs) setCosts(record.costs);
    setSponsorship(record.sponsorship || 0);
    setBufferStudentTarget(record.bufferStudentTarget || 0);
    setRecordMonth(record.month);
    setSaveMessage(`${record.month}のデータを反映しました`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const saveStudent = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingStudent) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', editingStudent.id);
        await updateDoc(docRef, { ...studentForm, updatedAt: serverTimestamp() });
        setSaveMessage('更新しました');
      } else {
        const studentsCol = collection(db, 'artifacts', appId, 'public', 'data', 'students');
        await addDoc(studentsCol, { ...studentForm, createdAt: serverTimestamp() });
        setSaveMessage('登録しました');
      }
      setStudentForm({ name: '', school: '', age: '', courseId: 'premium', remarks: '' });
      setEditingStudent(null);
    } catch (e) { setSaveMessage('エラーが発生しました'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('この生徒を削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id));
      setSaveMessage('削除しました');
    } catch (e) { setSaveMessage('失敗しました'); }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // --- サブコンポーネント: TrendChart ---
  const TrendChart = () => {
    if (historyRecords.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-400 font-bold">推移を表示するには2ヶ月分以上の記録が必要です</p>
        </div>
      );
    }

    const maxVal = Math.max(...historyRecords.map(r => Math.max(r.totalCost, r.sponsorship))) * 1.2;
    const width = 600;
    const height = 150;
    const padding = 20;

    const getX = (idx) => (idx / (historyRecords.length - 1)) * (width - padding * 2) + padding;
    const getY = (val) => height - ((val / maxVal) * (height - padding * 2) + padding);

    const costPoints = historyRecords.map((r, i) => `${getX(i)},${getY(r.totalCost || 0)}`).join(' ');
    const sponsorPoints = historyRecords.map((r, i) => `${getX(i)},${getY(r.sponsorship || 0)}`).join(' ');

    return (
      <div className="w-full bg-slate-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-400" />
            <span className="text-xs font-bold tracking-widest uppercase">年間推移分析</span>
          </div>
          <div className="flex gap-4 text-[10px]">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div>協賛金</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div>運営費</div>
          </div>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <line x1={padding} y1={getY(0)} x2={width - padding} y2={getY(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <polyline fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={costPoints} />
          <polyline fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={sponsorPoints} />
          {historyRecords.map((r, i) => (
            <text key={i} x={getX(i)} y={height - 2} fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="bold">
              {r.month.slice(5)}月
            </text>
          ))}
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
            <button onClick={() => window.print()} className="bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all">
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
              <p className="text-slate-500 font-medium">教育機会の創出と持続可能な運営に関するインパクト報告</p>
            </div>
            <div className="text-left md:text-right space-y-1 border-l-2 md:border-l-0 md:border-r-2 border-orange-500 pl-4 md:pr-4">
              <p className="text-xs font-bold text-slate-400 text-left md:text-right">作成日</p>
              <p className="text-sm font-black">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs font-bold text-orange-600 pt-2 tracking-widest uppercase">Clayette Project</p>
            </div>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 bg-orange-600 text-white rounded-[2rem] shadow-xl shadow-orange-100 relative overflow-hidden text-center">
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
                <p className="text-xs font-bold text-slate-400 mb-2">総協賛金額</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">¥{sponsorship.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left">
                <p className="text-xs font-bold text-slate-400 mb-2">一人あたりの還元額</p>
                <p className="text-4xl font-black text-orange-600 tracking-tighter">¥{reductionPerStudent.toLocaleString()}</p>
              </div>
            </div>
          </section>

          <section className="space-y-6 text-left">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-900 border-l-4 border-orange-500 pl-4">
              <BarChart3 className="text-orange-600" />
              資金使途の詳細内訳
            </div>
            <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 space-y-8">
                {Object.entries(costs).map(([key, value]) => {
                  const categoryWeight = totalOperatingCost > 0 ? value / totalOperatingCost : 0;
                  const coveredAmount = sponsorship * categoryWeight;
                  const coverRatio = Math.min(100, value > 0 ? Math.round((coveredAmount / value) * 100) : 0);
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1 font-bold text-slate-600">
                        <span>{key}</span>
                        <span>寄与率: {coverRatio}%</span>
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left overflow-x-hidden">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg shadow-orange-100">
              <Calculator size={20} />
            </div>
            <span className="font-black tracking-tighter text-slate-800 hidden sm:inline">CLAYETTE OPTIMIZER</span>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              <BarChart3 size={14} /> ダッシュボード
            </button>
            <button 
              onClick={() => setActiveTab('students')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'students' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Users size={14} /> 生徒名簿 ({students.length})
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {saveMessage && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-bold">{saveMessage}</span>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <header className="text-left">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight text-left">月次協賛金最適化</h2>
                <p className="text-slate-400 text-sm font-medium text-left">協賛金バッファと名簿連動による高精度算出</p>
              </header>
              <div className="flex gap-2">
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 gap-2">
                  <input type="month" value={recordMonth} onChange={(e) => setRecordMonth(e.target.value)} className="py-2 text-xs font-bold bg-transparent outline-none" />
                  <button onClick={recordMonthlyStatus} disabled={isRecording || !user} className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">
                    月次保存
                  </button>
                </div>
                <button onClick={() => setShowReport(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-orange-100 flex items-center gap-2 text-sm hover:scale-105 transition-transform">
                  <FileText size={16} /> 報告書作成
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendChart />
              <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col h-[230px]">
                <div className="flex items-center gap-2 mb-4">
                  <History size={18} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">保存済み記録</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {historyRecords.length === 0 ? <p className="text-[10px] text-slate-300 italic text-center py-10">記録なし</p> : 
                    historyRecords.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-orange-200 transition-all">
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-700">{r.month}</p>
                        <p className="text-[10px] text-slate-400">協賛金: ¥{r.sponsorship.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => loadRecordForEdit(r)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-white rounded-lg"><Edit2 size={12} /></button>
                        <button onClick={() => deleteMonthlyRecord(r.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6 text-left">
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-widest text-left">
                    <Settings2 size={14} className="text-orange-500" /> 月間運営コスト設定
                  </div>
                  <div className="space-y-4 text-left">
                    {Object.entries(costs).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-[10px] font-bold text-slate-400 mb-1 block text-left uppercase tracking-wider">{key}</label>
                        <div className="relative">
                          <input type="number" value={value} onChange={(e) => handleCostChange(key, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-left" />
                          <span className="absolute right-3 top-2 text-slate-300 text-[10px]">円</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-orange-600 text-white rounded-3xl shadow-sm p-6 space-y-4 text-left">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-80 text-left">
                    <ShieldCheck size={14} /> 協賛金バッファ設定
                  </div>
                  <input type="range" min="0" max="20" step="1" value={bufferStudentTarget} onChange={(e) => setBufferStudentTarget(parseInt(e.target.value))} className="w-full h-1.5 bg-orange-400 rounded-full appearance-none cursor-pointer accent-white" />
                  <div className="flex justify-between items-center font-black">
                    <span className="text-[10px]">確保: {bufferStudentTarget}名分</span>
                    <span className="text-lg">¥{bufferAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6 text-left">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Coins size={120} /></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-left">企業協賛金 総額</p>
                  <p className="text-5xl font-black text-orange-600 tracking-tighter mb-8 text-left">¥{sponsorship.toLocaleString()}</p>
                  <input type="range" min="0" max="2000000" step="10000" value={sponsorship} onChange={(e) => setSponsorship(parseInt(e.target.value))} className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-orange-600" />
                </div>

                <div className="bg-orange-600 rounded-[2.5rem] shadow-2xl shadow-orange-100 p-8 md:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
                  <div className="text-left">
                    <p className="text-orange-100 text-[10px] font-bold uppercase mb-3 text-left">一人当たりの引き下げ額</p>
                    <div className="flex items-center gap-4 text-left">
                      <ArrowDownCircle size={40} className="text-orange-200" />
                      <span className="text-6xl font-black tracking-tighter text-left">¥{reductionPerStudent.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-center min-w-[140px]">
                    <p className="text-[10px] font-bold mb-1 opacity-80 uppercase">補填率</p>
                    <p className="text-3xl font-black">{coverageRate}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {COURSE_BASES.map((course) => {
                    const discounted = Math.max(0, course.price - reductionPerStudent);
                    const enrolledCount = studentCountsFromDb[course.id] || 0;
                    return (
                      <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all text-left">
                        <div className="flex justify-between items-start mb-4 text-left">
                          <h4 className="font-black text-slate-800 text-left">{course.label}</h4>
                          <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold text-left">{enrolledCount}名</span>
                        </div>
                        <div className="flex items-baseline gap-2 text-left">
                          <span className={`text-2xl font-black ${discounted === 0 ? 'text-emerald-500' : 'text-slate-900'} text-left`}>
                            {discounted === 0 ? '無料' : `¥${discounted.toLocaleString()}`}
                          </span>
                          <span className="text-[10px] text-slate-300 line-through text-left">¥{course.price.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4 text-left">
              <div className="text-left">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight text-left">生徒名簿管理</h2>
                <p className="text-slate-400 text-sm font-medium text-left">全 {students.length} 名の登録生徒</p>
              </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start text-left">
              <div className="xl:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sticky top-24 text-left">
                <div className="flex items-center gap-2 mb-6 font-bold text-slate-700 text-xs text-left">
                  <UserPlus size={16} className="text-orange-500" /> {editingStudent ? '生徒情報を編集' : '生徒を登録'}
                </div>
                <form onSubmit={saveStudent} className="space-y-4 text-left">
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block text-left">生徒名</label>
                    <input type="text" required value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-left" placeholder="例: 山田 太郎" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block text-left">学校</label>
                      <input type="text" value={studentForm.school} onChange={e => setStudentForm({...studentForm, school: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-left" placeholder="〇〇校" />
                    </div>
                    <div className="text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block text-left">年齢</label>
                      <input type="number" value={studentForm.age} onChange={e => setStudentForm({...studentForm, age: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-left" placeholder="10" />
                    </div>
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block text-left">選択コース</label>
                    <select value={studentForm.courseId} onChange={e => setStudentForm({...studentForm, courseId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold appearance-none outline-none">
                      {COURSE_BASES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block text-left">備考</label>
                    <textarea value={studentForm.remarks} onChange={e => setStudentForm({...studentForm, remarks: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm h-20 resize-none text-left" />
                  </div>
                  <button type="submit" className="w-full bg-orange-600 text-white font-black py-3 rounded-xl shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
                    {editingStudent ? '更新' : '登録'}
                  </button>
                  {editingStudent && (
                    <button type="button" onClick={() => { setEditingStudent(null); setStudentForm({name:'', school:'', age:'', courseId:'premium', remarks:''}); }} className="w-full text-[10px] font-bold text-slate-400 uppercase py-2">キャンセル</button>
                  )}
                </form>
              </div>

              <div className="xl:col-span-3 text-left">
                {students.length === 0 ? <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-20 text-center"><p className="text-slate-400 font-bold">生徒未登録</p></div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    {students.map(s => {
                      const course = COURSE_BASES.find(c => c.id === s.courseId);
                      const finalPrice = Math.max(0, (course?.price || 0) - reductionPerStudent);
                      return (
                        <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 group hover:border-orange-500 transition-all shadow-sm text-left">
                          <div className="flex justify-between items-start mb-4 text-left">
                            <div className="text-left">
                              <h4 className="text-lg font-black text-slate-800 text-left">{s.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 text-left">{s.school} | {s.age}歳</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-left">
                              <button onClick={() => { setEditingStudent(s); setStudentForm(s); }} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"><Edit2 size={14} /></button>
                              <button onClick={() => deleteStudent(s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 text-left">
                            <p className="text-[10px] font-bold text-slate-400 text-left mb-1">{course?.label}</p>
                            <div className="flex items-baseline gap-2 text-left">
                              <span className="text-xl font-black text-slate-800">¥{finalPrice.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-300 line-through">¥{course?.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 py-10 border-t border-slate-200 text-center text-slate-300 text-[10px] font-black tracking-[0.5em] uppercase">
        Clayette Educational Management
      </footer>

      {showReport && <ReportModal />}
    </div>
  );
};

export default App;