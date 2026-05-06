import { useState, useEffect, useRef } from "react";

// ─── Stiller ──────────────────────────────────────────────────────────────────
const S = {
  page:      {minHeight:'100vh',width:'100%',background:'#07090f',color:'#e2e8f0',fontFamily:'"DM Sans",system-ui,sans-serif',paddingBottom:60,margin:0,padding:0,boxSizing:'border-box',overflowX:'hidden'},
  header:    {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',paddingTop:'calc(env(safe-area-inset-top, 0px) + 14px)',borderBottom:'1px solid #0f1525',background:'#090d17',position:'sticky',top:0,zIndex:10},
  headerLeft:{display:'flex',alignItems:'center',gap:8},
  headerRight:{display:'flex',alignItems:'center',gap:10},
  smallBtn:  {background:'#111827',color:'#94a3b8',border:'1px solid #1a2035',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:12,fontWeight:600},
  input:     {width:'100%',padding:'10px 14px',background:'#07090f',color:'#e2e8f0',border:'1px solid #1a2035',borderRadius:10,fontSize:14,marginBottom:10,boxSizing:'border-box',outline:'none'},
  loginBtn:  {width:'100%',padding:'13px',background:'linear-gradient(135deg,#b47cff,#7c3aff)',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:8},
  errBox:    {background:'#1f0f0f',border:'1px solid #7f1d1d',borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:16},
  loginCard: {width:'100%',maxWidth:420,background:'#0d1120',border:'1px solid #1a2035',borderRadius:20,padding:'36px 32px'},
};

// ─── Küçük bileşenler ─────────────────────────────────────────────────────────
function HostAnswerCard({answer}) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setRevealed(false); }, [answer]);
  return (
    <div style={{borderRadius:14,overflow:'hidden',border:'1px solid',borderColor:revealed?'#22c55e66':'#1a2035',transition:'border-color 0.3s'}}>
      <button onClick={() => setRevealed(r => !r)}
        style={{width:'100%',padding:'16px 20px',background:revealed?'#0a1a0a':'#0d1120',border:'none',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,transition:'background 0.3s'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:14,fontWeight:800,color:revealed?'#22c55e':'#475569'}}>{revealed?'✓ Cevap':'🔒 Cevabı Göster'}</span>
        </div>
        <span style={{fontSize:18,color:revealed?'#22c55e':'#374151',transition:'transform 0.3s',display:'inline-block',transform:revealed?'rotate(90deg)':'none'}}>›</span>
      </button>
      {revealed && (
        <div style={{padding:'16px 20px',background:'#071a07',borderTop:'1px solid #22c55e33'}}>
          <span style={{fontSize:16,fontWeight:800,color:'#4ade80',lineHeight:1.5}}>{answer||'—'}</span>
        </div>
      )}
    </div>
  );
}

// ─── Ana Uygulama ─────────────────────────────────────────────────────────────
export default function App() {
  if (typeof document !== 'undefined') {
    document.body.style.background = '#07090f';
    document.body.style.margin = '0';
    if (!document.getElementById('__quiz_no_focus')) {
      const style = document.createElement('style');
      style.id = '__quiz_no_focus';
      style.textContent = 'button:focus{outline:none!important;box-shadow:none!important;}';
      document.head.appendChild(style);
    }
  }

  // ─── PIN Ekranı ───────────────────────────────────────────────────────────────
  const QUIZ_PIN = '0000';
  const [pinInput, setPinInput]     = useState('');
  const [pinError, setPinError]     = useState(false);
  const [loggedIn, setLoggedIn]     = useState(false);

  // ─── Quiz State ───────────────────────────────────────────────────────────────
  const [quizData, setQuizData]                 = useState(null);
  const [quizLoaded, setQuizLoaded]             = useState(false);
  const [quizRole, setQuizRole]                 = useState(null);
  const [quizStep, setQuizStep]                 = useState('groups');
  const [quizEventType, setQuizEventType]       = useState('genelkultur');
  const [quizGroups, setQuizGroups]             = useState([]);
  const [quizMyGroups, setQuizMyGroups]         = useState([]);
  const [quizCurrentQ, setQuizCurrentQ]         = useState(1);
  const [quizScores, setQuizScores]             = useState({});
  const quizScoresRef                           = useRef({});
  const [quizSaving, setQuizSaving]             = useState(false);
  const [quizDeleteConfirm, setQuizDeleteConfirm]     = useState(false);
  const [quizDeletePassword, setQuizDeletePassword]   = useState('');
  const [quizDeletePasswordError, setQuizDeletePasswordError] = useState(false);
  const [quizAnswers, setQuizAnswers]           = useState({});
  const [quizAnswerFile, setQuizAnswerFile]     = useState(null);
  const [quizAnswerLoading, setQuizAnswerLoading] = useState(false);
  const [quizAnswerError, setQuizAnswerError]   = useState('');
  const [quizQuestions, setQuizQuestions]       = useState({});
  const [quizQFile, setQuizQFile]               = useState(null);
  const [quizQLoading, setQuizQLoading]         = useState(false);
  const [quizQError, setQuizQError]             = useState('');
  const [quizHostQ, setQuizHostQ]               = useState(1);
  const [quizResultsLoading, setQuizResultsLoading] = useState(false);
  const [quizCombinedLoading, setQuizCombinedLoading] = useState(false);
  const [quizCombinedError, setQuizCombinedError]     = useState('');
  const [quizCombinedFile, setQuizCombinedFile]       = useState(null);
  const [quizShowQuestion, setQuizShowQuestion] = useState(false);
  const [quizPickerOpen, setQuizPickerOpen]     = useState(false);
  const [quizSortMode, setQuizSortMode]         = useState('score');
  const [quizSlots, setQuizSlots]               = useState({});
  const [quizLockError, setQuizLockError]       = useState(''); // kilit başarısız mesajı
  const [quizClientId]                          = useState(() => 'client_' + Math.random().toString(36).slice(2));
  const [quizSessionId, setQuizSessionId]         = useState(() => 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2));
  const [quizGroupCount, setQuizGroupCount]     = useState('');
  const [quizGroupCountSet, setQuizGroupCountSet] = useState(false);
  const quizPollRef                             = useRef(null);
  const [quizLiveScores, setQuizLiveScores]     = useState({});
  const [quizLiveGroups, setQuizLiveGroups]     = useState([]);
  const [quizExpandedGroup, setQuizExpandedGroup] = useState(null);

  const QUIZ_EVENTS = {
    genelkultur: { label:'Genel Kültür', totalQ:55, pointPerQ:10, icon:'🧠', altTotalQ:50 },
    diziyfilm:   { label:'Dizi & Film',  totalQ:40, pointPerQ:null, icon:'🎬',
      getPoints:(qNo) => { if(qNo<=10) return 10; if(qNo<=20) return 20; if(qNo<=30) return 30; return 40; }
    }
  };

  // Dinamik puanlama:
  // Soru sayısı > 45 ise her soru 10 puan
  // Soru sayısı <= 45 ise her 10 soruda değer 10 artar (1-10→10, 11-20→20, 21-30→30, 31-40→40, 41-45→50)
  const getQuizPoint = (totalQuestions, qNo) => {
    if (totalQuestions > 45) return 10;
    return Math.ceil(qNo / 10) * 10;
  };

  const calcGroupScore = (groupNo, eventType, scores, overrideTotalQ) => {
    const ev = QUIZ_EVENTS[eventType] || QUIZ_EVENTS['genelkultur'];
    if (!ev) return 0;
    const gs = scores[groupNo] || {};
    let total = 0;
    const qCount = overrideTotalQ || ev.totalQ;
    for (let q = 1; q <= qCount; q++) {
      if (gs[q]) total += getQuizPoint(qCount, q);
    }
    return total;
  };

  // Sonuçlar yüklenince sunucudan veri çek
  useEffect(() => {
    if (quizStep !== 'results') return;
    setQuizResultsLoading(true);
    fetch('/api/quiz').then(r=>r.json()).then(d => {
      if (d.quizData) {
        setQuizLiveScores(d.quizData.scores||{});
        setQuizLiveGroups(d.quizData.groups||[]);
        setQuizScores(d.quizData.scores||{});
        setQuizGroups(d.quizData.groups||[]);
      } else {
        setQuizLiveScores(quizScores);
        setQuizLiveGroups(quizGroups);
      }
    }).catch(()=>{ setQuizLiveScores(quizScores); setQuizLiveGroups(quizGroups); })
    .finally(()=>setQuizResultsLoading(false));
  }, [quizStep]);

  // İlk yükleme — sunucudan mevcut quiz verisini al
  useEffect(() => {
    fetch('/api/quiz').then(r=>r.json()).then(d => {
      if (d.quizData) {
        setQuizData(d.quizData);
        setQuizEventType(d.quizData.eventType || 'genelkultur');
        setQuizGroups(d.quizData.groups||[]);
        setQuizScores(d.quizData.scores||{});
        quizScoresRef.current = d.quizData.scores||{};
        if (d.quizData.sessionId) setQuizSessionId(d.quizData.sessionId);
        if (d.quizData.currentQ) setQuizCurrentQ(d.quizData.currentQ);
        if (d.quizData.groups && d.quizData.groups.length > 0) {
          setQuizGroupCountSet(true);
          setQuizGroupCount(String(d.quizData.groups.length));
          setQuizStep('groups');
        }
        if (d.quizData.answers && Object.keys(d.quizData.answers).length > 0) {
          setQuizAnswers(d.quizData.answers);
          setQuizAnswerFile((d.quizData.answersFile||'Sunucudan yüklendi') + ' (' + Object.keys(d.quizData.answers).length + ' cevap)');
        }
        if (d.quizData.questions && Object.keys(d.quizData.questions).length > 0) {
          setQuizQuestions(d.quizData.questions);
          setQuizQFile((d.quizData.questionsFile||'Sunucudan yüklendi') + ' (' + Object.keys(d.quizData.questions).length + ' soru)');
        }
        if (d.quizData.questionsFile) setQuizCombinedFile(d.quizData.questionsFile);
      }
      setQuizLoaded(true);
    }).catch(()=>setQuizLoaded(true));
  }, []);

  // Real-time polling — 1.5 saniyede bir
  const quizGroupEditingRef   = useRef(false);
  const quizUserWentBackRef   = useRef(false);
  const quizLocalGroupsRef    = useRef(null);
  useEffect(() => {
    if (!loggedIn) return;
    const poll = setInterval(() => {
      fetch('/api/quiz').then(r=>r.json()).then(d => {
        if (!d.quizData) {
          // Etkinlik silindi — local state'i de temizle
          setQuizGroups([]);
          setQuizGroupCountSet(false);
          setQuizGroupCount('');
          setQuizAnswers({});
          setQuizAnswerFile(null);
          setQuizQuestions({});
          setQuizQFile(null);
          setQuizScores({});
          quizScoresRef.current = {};
          return;
        }
        const srv = d.quizData;
        if (d.slotLocks) setQuizSlots(d.slotLocks);
        if (srv.groups) {
          setQuizGroups(prev => {
            if (quizGroupEditingRef.current) return prev;
            const localJson = quizLocalGroupsRef.current !== null ? JSON.stringify(quizLocalGroupsRef.current) : null;
            const srvJson = JSON.stringify(srv.groups);
            if (localJson !== null && localJson !== srvJson) return prev;
            if (JSON.stringify(prev) !== srvJson) return srv.groups;
            return prev;
          });
          setQuizGroupCountSet(true);
          setQuizGroupCount(prev => prev || String(srv.groups.length));
        }
        if (srv.eventType) setQuizEventType(srv.eventType);
        setQuizScores(prev => {
          const merged = {...(srv.scores||{})};
          Object.keys(prev).forEach(gno => { merged[gno] = {...(merged[gno]||{}),...prev[gno]}; });
          if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
          return merged;
        });
        if (srv.answers && Object.keys(srv.answers).length > 0) {
          setQuizAnswers(prev => Object.keys(prev).length > 0 ? prev : srv.answers);
        }
        if (srv.questions && Object.keys(srv.questions).length > 0) {
          setQuizQuestions(prev => Object.keys(prev).length > 0 ? prev : srv.questions);
          setQuizQFile(prev => prev || ((srv.questionsFile||'Sunucudan yüklendi') + ' (' + Object.keys(srv.questions).length + ' soru)'));
        }
      }).catch(()=>{});
    }, 1500);
    quizPollRef.current = poll;
    return () => clearInterval(poll);
  }, [loggedIn]);

  // Heartbeat — seçilen grupların kilidini canlı tut (15 saniyede bir)
  useEffect(() => {
    if (!loggedIn || quizMyGroups.length === 0) return;

    const sendHeartbeat = () => {
      fetch('/api/quiz/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: quizClientId, groups: quizMyGroups })
      })
        .then(r => r.json())
        .then(data => {
          // Başkası tarafından alınmış grupları seçimden çıkar
          if (data.failed && data.failed.length > 0) {
            setQuizMyGroups(prev => prev.filter(n => !data.failed.includes(String(n))));
          }
        })
        .catch(() => {});
    };

    const hb = setInterval(sendHeartbeat, 15000);

    // Telefon/sekme uyandığında hemen heartbeat gönder
    const onVisible = () => { if (document.visibilityState === 'visible') sendHeartbeat(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(hb);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loggedIn, quizMyGroups]);

  const saveGroupsFast = (groups) => {
    quizLocalGroupsRef.current = groups;
    const data = { sessionId:quizSessionId, eventType:quizEventType, groups, scores:quizScoresRef.current, myGroups:quizMyGroups, questions:quizQuestions, questionsFile:quizQFile||null, answers:quizAnswers, answersFile:quizAnswerFile||null };
    fetch('/api/quiz', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({quizData:data}) })
      .then(()=>{ quizLocalGroupsRef.current = null; }).catch(()=>{ quizLocalGroupsRef.current = null; });
  };

  const saveQuizData = async (newData, includeCurrentQ = false) => {
    setQuizSaving(true);
    try {
      const merged = { sessionId:quizSessionId, ...newData, questions:Object.keys(quizQuestions).length>0?quizQuestions:(newData.questions||{}), questionsFile:quizQFile||newData.questionsFile||null, answers:Object.keys(quizAnswers).length>0?quizAnswers:(newData.answers||{}), answersFile:quizAnswerFile||newData.answersFile||null };
      const dataToSend = includeCurrentQ ? {...merged, currentQ:quizCurrentQ} : merged;
      const res = await fetch('/api/quiz', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({quizData:dataToSend}) });
      const json = await res.json();
      if (json.mergedScores) {
        setQuizScores(json.mergedScores);
        setQuizData(prev => prev ? {...prev, scores:json.mergedScores} : prev);
      }
    } catch {}
    setQuizSaving(false);
  };

  const safeJsonParse = async (res) => {
    const text = await res.text();
    if (!text || !text.trim()) throw new Error(`Sunucu boş yanıt döndürdü (HTTP ${res.status})`);
    try { return JSON.parse(text); } catch { throw new Error(`Sunucu geçersiz yanıt döndürdü (HTTP ${res.status}): ${text.slice(0, 120)}`); }
  };

  const handleCombinedFileUpload = async (file) => {
    if (!file) return;
    const allowedExts = ['txt', 'docx', 'pdf'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(fileExt)) {
      setQuizCombinedError('Sadece .txt, .docx veya .pdf dosyası desteklenir');
      return;
    }
    setQuizCombinedLoading(true); setQuizCombinedError('');
    try {
      const formData = new FormData(); formData.append('file', file);
      const qRes = await fetch('/api/quiz/parse-questions', { method:'POST', body:formData });
      const qJson = await safeJsonParse(qRes);
      if (qJson.error) throw new Error(qJson.error);
      setQuizQuestions(qJson.questions||{}); setQuizQFile(file.name+' ('+qJson.count+' soru)'); setQuizHostQ(1);
      const answersFromQuestions = {};
      Object.entries(qJson.questions||{}).forEach(([no, q]) => { if (q.answer && q.answer.trim()) answersFromQuestions[parseInt(no)] = q.answer.trim(); });
      const answersCount = Object.keys(answersFromQuestions).length;
      if (answersCount > 0) {
        setQuizAnswers(answersFromQuestions); setQuizAnswerFile(file.name+' ('+answersCount+' cevap)');
        const cur = await fetch('/api/quiz').then(r=>r.json()).catch(()=>({quizData:null}));
        const base = cur.quizData||{eventType:quizEventType, groups:quizGroups, scores:quizScores, myGroups:quizMyGroups};
        await fetch('/api/quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quizData:{...base,sessionId:quizSessionId,answers:answersFromQuestions,answersFile:file.name,questions:qJson.questions,questionsFile:file.name}})}).catch(()=>{});
        setQuizCombinedFile(file.name+' ('+qJson.count+' soru, '+answersCount+' cevap)');
      } else {
        const formData2 = new FormData(); formData2.append('file', file);
        const aRes = await fetch('/api/quiz/parse-answers',{method:'POST',body:formData2});
        const aJson = await safeJsonParse(aRes);
        const answers = (!aJson.error && aJson.count > 0) ? aJson.answers : {};
        const cnt = Object.keys(answers).length;
        if (cnt > 0) { setQuizAnswers(answers); setQuizAnswerFile(file.name+' ('+cnt+' cevap)'); }
        const cur2 = await fetch('/api/quiz').then(r=>r.json()).catch(()=>({quizData:null}));
        const base2 = cur2.quizData||{eventType:quizEventType,groups:quizGroups,scores:quizScores,myGroups:quizMyGroups};
        await fetch('/api/quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quizData:{...base2,sessionId:quizSessionId,answers,answersFile:file.name,questions:qJson.questions,questionsFile:file.name}})}).catch(()=>{});
        setQuizCombinedFile(file.name+' ('+qJson.count+' soru, '+cnt+' cevap)');
      }
    } catch(e) { setQuizCombinedError('Dosya okunamadı: '+e.message); }
    setQuizCombinedLoading(false);
  };

  const handleQuestionFileUpload = async (file) => {
    if (!file) return;
    const allowedExts = ['txt', 'docx', 'pdf'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(fileExt)) {
      setQuizQError('Sadece .txt, .docx veya .pdf dosyası desteklenir');
      return;
    }
    setQuizQLoading(true); setQuizQError('');
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await fetch('/api/quiz/parse-questions',{method:'POST',body:formData});
      const json = await safeJsonParse(res);
      if (json.error) throw new Error(json.error);
      setQuizQuestions(json.questions); setQuizQFile(file.name+' ('+json.count+' soru)'); setQuizHostQ(1);
    } catch(e) { setQuizQError('Dosya okunamadı: '+e.message); }
    setQuizQLoading(false);
  };

  const deleteQuizData = () => {
    setQuizData(null); setQuizStep('groups'); setQuizEventType('genelkultur'); setQuizGroups([]); setQuizMyGroups([]);
    setQuizCurrentQ(1); setQuizScores({}); setQuizDeleteConfirm(false); setQuizDeletePassword('');
    setQuizDeletePasswordError(false); setQuizGroupCount(''); setQuizGroupCountSet(false);
    setQuizCombinedFile(null); setQuizAnswers({}); setQuizAnswerFile(null); setQuizQuestions({}); setQuizQFile(null);
    setQuizLiveScores({}); setQuizLiveGroups([]);
    quizScoresRef.current = {};
    quizUserWentBackRef.current = false;
    // Yeni oturum ID'si oluştur — sunucu eski veriyle merge etmesin
    setQuizSessionId('sess_' + Date.now() + '_' + Math.random().toString(36).slice(2));
    fetch('/api/quiz',{method:'DELETE'}).catch(()=>{});
  };

  // ─── PIN Ekranı ───────────────────────────────────────────────────────────────
  if (!loggedIn) {
    const NUMPAD = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];
    const numpadPress = (digit) => {
      if (pinInput.length >= 4) return;
      const next = pinInput + digit;
      setPinInput(next); setPinError(false);
      if (next.length === 4) {
        setTimeout(() => {
          if (next === QUIZ_PIN) { setLoggedIn(true); setPinInput(''); }
          else { setPinError(true); setPinInput(''); }
        }, 120);
      }
    };
    return (
      <div style={S.page}>
        <div style={{display:'flex',justifyContent:'center',padding:'0 24px',marginTop:'22vh'}}>
          <div style={{...S.loginCard, maxWidth:320, textAlign:'center', width:'100%', border:'none'}}>
            <div style={{fontSize:36, marginBottom:12}}>🏆</div>
            <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:4}}>Quiz Night Girişi</div>
            <div style={{fontSize:12,color:'#475569',marginBottom:20}}>Şifrenizi girin</div>
            {pinError && <div style={{...S.errBox,marginBottom:14}}>❌ Yanlış şifre, tekrar deneyin</div>}
            <div style={{display:'flex',justifyContent:'center',gap:14,marginBottom:28}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:16,height:16,borderRadius:'50%',background:pinInput.length>i?'#fbbf24':'#1a2035',border:'2px solid '+(pinInput.length>i?'#fbbf24':'#374151'),transition:'background 0.15s'}}/>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
              {NUMPAD.flat().map((k,i)=>(
                k==='' ? <div key={i}/> :
                k==='⌫' ? <button key={i} onClick={()=>{setPinInput(p=>p.slice(0,-1));setPinError(false);}}
                  style={{padding:'16px 0',background:'#111827',color:'#94a3b8',border:'1px solid #1a2035',borderRadius:12,fontSize:20,cursor:'pointer',fontWeight:600}}>⌫</button> :
                <button key={i} onClick={()=>numpadPress(k)}
                  style={{padding:'16px 0',background:'#0d1120',color:'#e2e8f0',border:'1px solid #1a2035',borderRadius:12,fontSize:22,cursor:'pointer',fontWeight:700}}>{k}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── ROL SEÇİM EKRANI ─────────────────────────────────────────────────────────
  if (!quizRole) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={{fontSize:13,fontWeight:800,letterSpacing:2,color:'#fff'}}>🏆 QUIZ NIGHT</span>
          </div>
        </div>
        <div style={{maxWidth:480,margin:'0 auto',padding:'24px 18px'}}>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{fontSize:13,color:'#475569'}}>Rolünüzü seçin</div>
          </div>
          {/* Dosya yükleme */}
          <div style={{background:'#0d1120',border:'1px solid #1a2035',borderRadius:16,padding:'18px 20px',marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:'#4fc9ff',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>📁 Soru &amp; Cevap Dosyası</div>
            <div style={{fontSize:11,color:'#475569',marginBottom:12,lineHeight:1.6}}>Hem soruları hem cevapları içeren dosyayı yükleyin.</div>
            <label style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:12,border:'2px dashed '+(quizCombinedFile?'#22c55e':'#1a2035'),cursor:'pointer',background:'#0a0e1a',transition:'all 0.2s'}}
              onMouseOver={e=>{e.currentTarget.style.borderColor=quizCombinedFile?'#22c55e':'#4fc9ff';}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=quizCombinedFile?'#22c55e':'#1a2035';}}>
              <span style={{fontSize:24}}>{quizCombinedFile?'✅':'📂'}</span>
              <div style={{flex:1}}>
                {quizCombinedLoading ? <span style={{fontSize:13,color:'#4fc9ff',fontWeight:700}}>⟳ Dosya işleniyor…</span>
                  : quizCombinedFile ? <span style={{fontSize:12,color:'#22c55e',fontWeight:700}}>{quizCombinedFile}</span>
                  : <span style={{fontSize:12,color:'#475569'}}>Dosya seç (.docx, .txt veya .pdf)</span>}
              </div>
              <input type="file" accept=".txt,.docx,.pdf" style={{display:'none'}} onChange={e=>{if(e.target.files[0]) handleCombinedFileUpload(e.target.files[0]);}} />
            </label>
            {quizCombinedError && <div style={{fontSize:11,color:'#f87171',marginTop:8}}>❌ {quizCombinedError}</div>}
            {quizCombinedFile && (
              <button onClick={()=>{setQuizCombinedFile(null);setQuizAnswers({});setQuizAnswerFile(null);setQuizQuestions({});setQuizQFile(null);setQuizCombinedError('');}}
                style={{marginTop:8,padding:'5px 14px',borderRadius:8,border:'1px solid #1a2035',background:'transparent',color:'#64748b',fontSize:11,cursor:'pointer'}}>× Dosyayı kaldır</button>
            )}
          </div>
          {/* Sunucu kartı */}
          <button onClick={()=>setQuizRole('host')}
            style={{width:'100%',display:'flex',alignItems:'center',gap:18,padding:'24px 22px',borderRadius:18,border:'1px solid #1a2035',cursor:'pointer',textAlign:'left',background:'#0d1120',marginBottom:14,transition:'all 0.2s',outline:'none'}}
            onMouseOver={e=>{e.currentTarget.style.borderColor='#b47cff';e.currentTarget.style.background='#0e0a1a';}}
            onMouseOut={e=>{e.currentTarget.style.borderColor='#1a2035';e.currentTarget.style.background='#0d1120';}}>
            <div style={{width:56,height:56,borderRadius:14,background:'linear-gradient(135deg,#b47cff22,#7c3aff22)',border:'1px solid #b47cff44',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontSize:28}}>🎤</span>
            </div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:'#b47cff',marginBottom:4}}>Sunucu</div>
              <div style={{fontSize:12,color:'#64748b',lineHeight:1.5}}>
                Soruları ekranda göster.<br/>
                {quizQuestions && Object.keys(quizQuestions).length > 0
                  ? <span style={{color:'#22c55e',fontWeight:700}}>✓ {Object.keys(quizQuestions).length} soru yüklendi</span>
                  : 'Dosya yüklendikten sonra sorular görünür.'}
              </div>
            </div>
          </button>
          {/* Puantör kartı */}
          <button onClick={()=>setQuizRole('scorer')}
            style={{width:'100%',display:'flex',alignItems:'center',gap:18,padding:'24px 22px',borderRadius:18,border:'1px solid #1a2035',cursor:'pointer',textAlign:'left',background:'#0d1120',marginBottom:14,transition:'all 0.2s',outline:'none'}}
            onMouseOver={e=>{e.currentTarget.style.borderColor='#fbbf24';e.currentTarget.style.background='#12100a';}}
            onMouseOut={e=>{e.currentTarget.style.borderColor='#1a2035';e.currentTarget.style.background='#0d1120';}}>
            <div style={{width:56,height:56,borderRadius:14,background:'linear-gradient(135deg,#fbbf2422,#f59e0b22)',border:'1px solid #fbbf2444',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontSize:28}}>📊</span>
            </div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:'#fbbf24',marginBottom:4}}>Puantör</div>
              <div style={{fontSize:12,color:'#64748b',lineHeight:1.5}}>Grupların cevaplarını işaretle ve<br/>anlık puan tablosunu takip et.</div>
            </div>
          </button>

          {/* Etkinliği Sıfırla */}
          {quizData && (
            <div>
              <button
                onClick={()=>{setQuizDeleteConfirm(true);setQuizDeletePassword('');setQuizDeletePasswordError(false);}}
                style={{width:'100%',padding:'9px',borderRadius:10,border:'1px solid #7f1d1d',cursor:'pointer',background:'transparent',color:'#f87171',fontWeight:600,fontSize:12,marginBottom:8}}>
                🗑 Etkinliği Sıfırla
              </button>
              {quizDeleteConfirm && (
                <div style={{background:'#150a0a',border:'1px solid #7f1d1d',borderRadius:10,padding:'12px 14px',marginBottom:8}}>
                  <div style={{fontSize:12,color:'#fca5a5',fontWeight:700,marginBottom:8}}>🔐 Silmek için şifreyi girin</div>
                  <input type="password" value={quizDeletePassword} onChange={e=>{setQuizDeletePassword(e.target.value);setQuizDeletePasswordError(false);}}
                    onKeyDown={e=>{if(e.key==='Enter'){if(quizDeletePassword==='qq')deleteQuizData();else setQuizDeletePasswordError(true);}}}
                    placeholder="Şifre" style={{...S.input,marginBottom:6,fontSize:16,letterSpacing:4,textAlign:'center'}}/>
                  {quizDeletePasswordError && <div style={{fontSize:11,color:'#f87171',marginBottom:6,textAlign:'center'}}>❌ Yanlış şifre</div>}
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>{setQuizDeleteConfirm(false);setQuizDeletePassword('');setQuizDeletePasswordError(false);}}
                      style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid #1a2035',cursor:'pointer',background:'#0d1120',color:'#94a3b8',fontWeight:600,fontSize:12}}>İptal</button>
                    <button onClick={()=>{if(quizDeletePassword==='qq')deleteQuizData();else setQuizDeletePasswordError(true);}}
                      style={{flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',background:'#7f1d1d',color:'#fca5a5',fontWeight:700,fontSize:12}}>Sil</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── SUNUCU MODU ──────────────────────────────────────────────────────────────
  if (quizRole === 'host') {
    if (quizStep === 'results') {
      const ev = QUIZ_EVENTS[quizEventType];
      const displayScores = Object.keys(quizLiveScores).length > 0 ? quizLiveScores : quizScores;
      const displayGroups = quizLiveGroups.length > 0 ? quizLiveGroups : quizGroups;
      const allGroupScores = displayGroups.map(g=>({...g,score:calcGroupScore(g.no,quizEventType,displayScores,totalQ)})).sort((a,b)=>b.score-a.score);
      const maxScore = allGroupScores.length > 0 ? allGroupScores[0].score : 0;
      const medals = ['🥇','🥈','🥉'];
      const sortedByScore = [...allGroupScores].sort((a,b)=>b.score-a.score);
      const rankMap = {};
      sortedByScore.forEach((g,i)=>{ if(i===0){rankMap[g.no]=1;} else if(g.score===sortedByScore[i-1].score){rankMap[g.no]=rankMap[sortedByScore[i-1].no];} else{const d=new Set(sortedByScore.slice(0,i).map(x=>x.score)).size; rankMap[g.no]=d+1;} });
      return (
        <div style={S.page}>
          <div style={S.header}>
            <div style={S.headerLeft}>
              <button style={{...S.smallBtn,marginRight:4}} onClick={()=>setQuizStep('scoring')}>← Geri</button>
              <span style={{fontSize:13,fontWeight:800,letterSpacing:2,color:'#fff'}}>📊 PUAN DURUMU</span>
            </div>
          </div>
          <div style={{maxWidth:480,margin:'0 auto',padding:'16px 18px'}}>
            <div style={{fontSize:11,color:'#475569',textTransform:'uppercase',letterSpacing:1,marginBottom:12,textAlign:'center'}}>{ev?.label} · {displayGroups.length} Grup</div>
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              <button onClick={()=>setQuizSortMode('score')} style={{flex:1,padding:'9px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',background:quizSortMode==='score'?'#12100a':'#0d1120',color:quizSortMode==='score'?'#fbbf24':'#475569',border:'1px solid '+(quizSortMode==='score'?'#fbbf2444':'#1a2035')}}>🏆 Puana Göre</button>
              <button onClick={()=>setQuizSortMode('groupno')} style={{flex:1,padding:'9px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',background:quizSortMode==='groupno'?'#0a1a2e':'#0d1120',color:quizSortMode==='groupno'?'#4fc9ff':'#475569',border:'1px solid '+(quizSortMode==='groupno'?'#4fc9ff44':'#1a2035')}}>🔢 Grup No'ya Göre</button>
            </div>
            {(() => {
              const sorted = quizSortMode==='groupno' ? [...allGroupScores].sort((a,b)=>(parseInt(a.no)||0)-(parseInt(b.no)||0)) : allGroupScores;
              return sorted.map(g=>{
                const rank=rankMap[g.no]; const isTop=rank<=3&&g.score>0; const medal=medals[rank-1]; const barWidth=maxScore>0?Math.round((g.score/maxScore)*100):0;
                return (<div key={g.no} style={{background:isTop&&rank===1&&g.score>0?'#12100a':'#0d1120',border:'1px solid '+(isTop&&rank===1&&g.score>0?'#fbbf2444':'#0f1525'),borderRadius:12,padding:'14px 16px',marginBottom:8,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',left:0,top:0,bottom:0,width:barWidth+'%',background:isTop&&rank===1&&g.score>0?'#fbbf2408':'#ffffff04',transition:'width 0.5s'}}/>
                  <div style={{position:'relative',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{fontSize:20,minWidth:28,textAlign:'center',flexShrink:0}}>{quizSortMode==='score'?(isTop&&medal?medal:<span style={{fontSize:13,color:'#374151',fontWeight:700}}>#{rank}</span>):<span style={{fontSize:13,color:'#374151',fontWeight:700}}>G{g.no}</span>}</div>
                    <div style={{flex:1}}><span style={{fontSize:14,fontWeight:800,color:isTop&&rank===1&&g.score>0?'#fbbf24':'#e2e8f0'}}>{g.no} No{g.name?' · '+g.name:''}</span></div>
                    <div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:22,fontWeight:900,color:rank===1&&g.score>0?'#fbbf24':g.score>0?'#e2e8f0':'#374151',lineHeight:1}}>{g.score.toLocaleString('tr')}</div><div style={{fontSize:10,color:'#475569'}}>puan</div></div>
                  </div>
                </div>);
              });
            })()}
            {allGroupScores.length===0 && <div style={{textAlign:'center',color:'#374151',padding:'40px 0'}}>Henüz skor yok</div>}
          </div>
        </div>
      );
    }

    const totalQCount = Object.keys(quizQuestions).length;
    const currentQ    = quizQuestions[quizHostQ];
    const hasQuestions = totalQCount > 0;

    if (!hasQuestions) {
      return (
        <div style={S.page}>
          <div style={S.header}>
            <div style={S.headerLeft}>
              <button style={{...S.smallBtn,marginRight:4}} onClick={()=>setQuizRole(null)}>← Geri</button>
              <span style={{fontSize:13,fontWeight:800,letterSpacing:2,color:'#fff'}}>🎤 SUNUCU</span>
            </div>
          </div>
          <div style={{maxWidth:480,margin:'0 auto',padding:'32px 18px'}}>
            <div style={{textAlign:'center',marginBottom:32}}>
              <div style={{fontSize:44,marginBottom:10}}>📄</div>
              <div style={{fontSize:18,fontWeight:800,color:'#fff',marginBottom:6}}>Soru Dosyası Yükle</div>
              <div style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>.docx, .txt veya .pdf formatında soru dosyası yükleyin.</div>
            </div>
            <label style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,padding:'32px 24px',borderRadius:16,border:'2px dashed #1a2035',cursor:'pointer',background:'#0a0e1a',transition:'all 0.2s',marginBottom:16}}
              onMouseOver={e=>{e.currentTarget.style.borderColor='#b47cff';}} onMouseOut={e=>{e.currentTarget.style.borderColor='#1a2035';}}>
              <span style={{fontSize:36}}>📂</span>
              {quizQLoading ? <span style={{fontSize:14,color:'#b47cff',fontWeight:700}}>⟳ Okunuyor…</span> : <span style={{fontSize:14,color:'#475569'}}>Dosya seç (.docx, .txt veya .pdf)</span>}
              <input type="file" accept=".txt,.docx,.pdf" style={{display:'none'}} onChange={e=>{if(e.target.files[0]) handleQuestionFileUpload(e.target.files[0]);}} />
            </label>
            {quizQError && <div style={{background:'#1f0f0f',border:'1px solid #7f1d1d',borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:12}}>❌ {quizQError}</div>}
          </div>
        </div>
      );
    }

    const sectionName = currentQ?.section || '';
    const progressPct = Math.round((quizHostQ / totalQCount) * 100);
    return (
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerLeft}>
            <button style={{...S.smallBtn,marginRight:4}} onClick={()=>setQuizRole(null)}>← Geri</button>
            <span style={{fontSize:13,fontWeight:800,letterSpacing:2,color:'#fff'}}>🎤 SUNUCU</span>
          </div>
          <div style={S.headerRight}>
            <button onClick={()=>setQuizStep('results')} style={{...S.smallBtn,color:'#fbbf24',borderColor:'#fbbf2444'}}>📊 Puan Durumu</button>
            <button onClick={()=>{setQuizQFile(null);setQuizQuestions({});setQuizHostQ(1);}} style={{...S.smallBtn,color:'#f87171',borderColor:'#7f1d1d22'}}>🗑 Dosyayı Değiştir</button>
          </div>
        </div>
        <div style={{maxWidth:560,margin:'0 auto',padding:'16px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:11,color:'#475569'}}>{quizQFile}</span>
            <span style={{fontSize:11,color:'#475569'}}>{quizHostQ} / {totalQCount}</span>
          </div>
          <div style={{background:'#1a2035',borderRadius:6,height:5,marginBottom:20,overflow:'hidden'}}>
            <div style={{height:'100%',background:'linear-gradient(90deg,#b47cff,#7c3aff)',width:progressPct+'%',borderRadius:6,transition:'width 0.3s'}}/>
          </div>
          {sectionName && (
            <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#1a0a2a',border:'1px solid #b47cff44',borderRadius:8,padding:'4px 12px',marginBottom:14}}>
              <span style={{fontSize:11,fontWeight:700,color:'#b47cff',textTransform:'uppercase',letterSpacing:1}}>📌 {sectionName}</span>
            </div>
          )}
          <div style={{background:'#0d1120',border:'1px solid #1a2035',borderRadius:18,padding:'24px 22px',marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div style={{background:'#b47cff22',border:'1px solid #b47cff44',borderRadius:10,padding:'5px 14px'}}>
                <span style={{fontSize:13,fontWeight:800,color:'#b47cff'}}>Soru {quizHostQ}</span>
              </div>
            </div>
            <div style={{fontSize:16,fontWeight:700,color:'#e2e8f0',lineHeight:1.65}}>{currentQ?.question||'—'}</div>
          </div>
          <HostAnswerCard answer={currentQ?.answer} />
          <div style={{display:'flex',gap:10,marginTop:16}}>
            <button onClick={()=>setQuizHostQ(q=>Math.max(1,q-1))} disabled={quizHostQ<=1}
              style={{flex:1,padding:'14px',borderRadius:12,border:'1px solid #1a2035',cursor:'pointer',background:'#0d1120',color:quizHostQ<=1?'#1a2035':'#94a3b8',fontWeight:700,fontSize:14}}>← Önceki</button>
            <button onClick={()=>setQuizHostQ(q=>Math.min(totalQCount,q+1))} disabled={quizHostQ>=totalQCount}
              style={{flex:2,padding:'14px',borderRadius:12,border:'none',cursor:'pointer',fontWeight:800,fontSize:14,background:quizHostQ>=totalQCount?'#111827':'linear-gradient(135deg,#b47cff,#7c3aff)',color:quizHostQ>=totalQCount?'#374151':'#fff'}}>
              {quizHostQ>=totalQCount?'✅ Son Soru':'Sonraki →'}
            </button>
          </div>
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,color:'#374151',fontWeight:700,letterSpacing:1,textTransform:'uppercase',marginBottom:8}}>Tüm Sorular</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {Object.keys(quizQuestions).map(n=>{
                const no=parseInt(n); const isActive=no===quizHostQ;
                return (<button key={no} onClick={()=>setQuizHostQ(no)} style={{width:36,height:36,borderRadius:8,border:'1px solid',fontSize:12,fontWeight:800,cursor:'pointer',flexShrink:0,background:isActive?'#b47cff':'#0d1120',color:isActive?'#fff':'#475569',borderColor:isActive?'#b47cff':'#1a2035',transition:'all 0.15s'}}>{no}</button>);
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PUANTÖR MODU ─────────────────────────────────────────────────────────────
  const ev = QUIZ_EVENTS[quizEventType] || QUIZ_EVENTS['genelkultur'];
  const loadedQCount = Object.keys(quizQuestions).length;
  const totalQ = loadedQCount > 0 ? loadedQCount : (ev ? ev.totalQ : 55);

  // Grup ayarlama
  if (quizStep === 'groups') {
    const updateGroup = (idx,field,val) => { const updated=quizGroups.map((g,i)=>i===idx?{...g,[field]:val}:g); setQuizGroups(updated); };
    const saveGroups  = (updated) => { saveGroupsFast(updated); };
    const toggleMyGroup = async (no) => {
      const isMine = quizMyGroups.includes(no);
      if (isMine) {
        // Kilidi bırak
        fetch('/api/quiz/unlock', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupNo: no, clientId: quizClientId })
        }).catch(() => {});
        setQuizMyGroups(prev => prev.filter(n => n !== no));
      } else {
        // Kilit almayı dene
        try {
          const res = await fetch('/api/quiz/lock', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupNo: no, clientId: quizClientId })
          });
          const data = await res.json();
          if (data.success) {
            setQuizMyGroups(prev => [...prev, no]);
            setQuizLockError('');
          } else {
            setQuizLockError(`Grup ${no} zaten başka bir puantör tarafından seçildi!`);
            setTimeout(() => setQuizLockError(''), 3000);
          }
        } catch {
          setQuizLockError('Bağlantı hatası, tekrar deneyin.');
          setTimeout(() => setQuizLockError(''), 3000);
        }
      }
    };
    const handleStart = () => {
      const newScores={...quizScores}; quizGroups.forEach(g=>{if(!newScores[g.no])newScores[g.no]={};});
      setQuizScores(newScores); const data={eventType:quizEventType,groups:quizGroups,scores:newScores,myGroups:quizMyGroups};
      setQuizData(data); saveQuizData(data); setQuizCurrentQ(1); setQuizStep('scoring');
    };
    // Grup sayısı sorusu kaldırıldı — doğrudan grup listesi ekranı
    return (
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerLeft}><button style={{...S.smallBtn,marginRight:4}} onClick={()=>{
            // Kilitleri bırak
            quizMyGroups.forEach(no => {
              fetch('/api/quiz/unlock', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({groupNo:no, clientId:quizClientId}) }).catch(()=>{});
            });
            setQuizRole(null);
          }}>← Geri</button><span style={{fontSize:13,fontWeight:800,letterSpacing:2,color:'#fff'}}>🏆 QUIZ NIGHT</span></div>
          <div style={S.headerRight}>
            <button onClick={()=>setQuizStep('results')} style={{...S.smallBtn,color:'#fbbf24',borderColor:'#fbbf2444'}}>📊 Sonuçlar</button>
            <span style={{fontSize:10,color:'#22c55e'}}>🔄 Canlı</span>
          </div>
        </div>
        {quizLockError && (
          <div style={{position:'fixed',top:70,left:'50%',transform:'translateX(-50%)',zIndex:100,background:'#1f0f0f',border:'1px solid #7f1d1d',borderRadius:10,padding:'10px 18px',color:'#fca5a5',fontSize:13,fontWeight:700,maxWidth:320,textAlign:'center',boxShadow:'0 4px 24px #00000088'}}>
            🔒 {quizLockError}
          </div>
        )}
        <div style={{maxWidth:480,margin:'0 auto',padding:'20px 18px'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#94a3b8',marginBottom:4,textTransform:'uppercase',letterSpacing:1}}>Gruplar · {quizGroups.length} grup</div>
          <div style={{fontSize:11,color:'#475569',marginBottom:16}}>Bir gruba tıklayarak o gruba bakacağınızı belirtin.</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
            {quizGroups.map((g,idx)=>{
              const isMine=quizMyGroups.includes(g.no);
              const lockInfo = quizSlots[g.no];
              const isLockedByOther = lockInfo && lockInfo.clientId !== quizClientId;
              return (<div key={idx} style={{background:isMine?'#12100a':isLockedByOther?'#0d0d0d':'#0d1120',border:'2px solid '+(isMine?'#fbbf24':isLockedByOther?'#374151':'#1a2035'),borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,transition:'all 0.2s',opacity:isLockedByOther?0.55:1}}>
                <button onClick={()=>!isLockedByOther&&toggleMyGroup(g.no)} style={{width:42,height:42,borderRadius:10,border:'2px solid',flexShrink:0,cursor:isLockedByOther?'not-allowed':'pointer',fontSize:isLockedByOther?18:16,fontWeight:800,background:isMine?'#fbbf24':isLockedByOther?'#1a1a1a':'#111827',color:isMine?'#000':isLockedByOther?'#374151':'#475569',borderColor:isMine?'#fbbf24':isLockedByOther?'#374151':'#374151',transition:'all 0.15s'}}>{isMine?'✓':isLockedByOther?'🔒':g.no}</button>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:isMine?'#fbbf24':isLockedByOther?'#374151':'#475569',fontWeight:700,marginBottom:3}}>{isMine?'✓ Seçildi':isLockedByOther?'🔒 Başkası seçti':`Grup ${g.no}`}</div>
                  <input value={g.name} onChange={e=>!isLockedByOther&&updateGroup(idx,'name',e.target.value)}
                    onFocus={()=>{quizGroupEditingRef.current=true;}}
                    onBlur={e=>{quizGroupEditingRef.current=false;saveGroups(quizGroups.map((gr,i)=>i===idx?{...gr,name:e.target.value}:gr));}}
                    placeholder={`Grup ${g.no} adı (opsiyonel)`}
                    disabled={isLockedByOther}
                    style={{...S.input,marginBottom:0,padding:'6px 10px',fontSize:13,background:isMine?'#1a1000':isLockedByOther?'#0a0a0a':'#07090f',border:'1px solid '+(isMine?'#fbbf2444':isLockedByOther?'#1a2035':'#1a2035'),color:isLockedByOther?'#374151':'inherit',cursor:isLockedByOther?'not-allowed':'text'}}/>
                </div>
                {idx===quizGroups.length-1&&quizGroups.length>1&&!isLockedByOther&&(
                  <button onClick={()=>{quizGroupEditingRef.current=true;const updated=quizGroups.slice(0,-1);setQuizGroups(updated);setQuizMyGroups(prev=>prev.filter(n=>n!==g.no));saveGroups(updated);quizGroupEditingRef.current=false;}}
                    style={{width:36,height:36,borderRadius:8,border:'1px solid #374151',cursor:'pointer',background:'#1f0f0f',color:'#f87171',fontSize:16,fontWeight:700,flexShrink:0}}>×</button>
                )}
              </div>);
            })}
          </div>
          <button onClick={()=>{quizGroupEditingRef.current=true;const nextNo=String(quizGroups.length+1);const updated=[...quizGroups,{no:nextNo,name:''}];setQuizGroups(updated);saveGroups(updated);quizGroupEditingRef.current=false;}}
            style={{width:'100%',padding:'11px',borderRadius:10,border:'1px dashed #374151',cursor:'pointer',background:'transparent',color:'#475569',fontSize:13,fontWeight:600,marginBottom:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>＋ Ekstra Grup Ekle</button>
          <div style={{background:'#0a1a0a',border:'1px solid #22c55e22',borderRadius:10,padding:'10px 14px',marginBottom:16}}>
            <div style={{fontSize:11,color:'#22c55e',fontWeight:700,marginBottom:4}}>✓ Seçili Gruplarınız</div>
            <div style={{fontSize:12,color:'#64748b'}}>{quizMyGroups.length===0?'Henüz grup seçmediniz. Yukarıdan bir grup numarasına tıklayın.':quizMyGroups.map(no=>{const g=quizGroups.find(x=>x.no===no);return `Grup ${no}${g?.name?' · '+g.name:''}`;}).join(' / ')}</div>
          </div>
          <button onClick={handleStart} disabled={quizGroups.length===0||quizMyGroups.length===0}
            style={{width:'100%',padding:'15px',borderRadius:12,border:'none',cursor:'pointer',fontWeight:800,fontSize:15,background:(quizGroups.length>0&&quizMyGroups.length>0)?'linear-gradient(135deg,#fbbf24,#f59e0b)':'#111827',color:(quizGroups.length>0&&quizMyGroups.length>0)?'#000':'#374151',marginBottom:10}}>Puanlamayı Başlat →</button>
        </div>
      </div>
    );
  }

  // Puanlama
  if (quizStep === 'scoring') {
    const myGroupObjs = quizGroups.filter(g=>quizMyGroups.includes(g.no));
    const qPoint = getQuizPoint(totalQ, quizCurrentQ);
    const toggleAnswer = async (groupNo) => {
      const gs=quizScoresRef.current[groupNo]||{}; const newGs={...gs,[quizCurrentQ]:!gs[quizCurrentQ]};
      const newScores={...quizScoresRef.current,[groupNo]:newGs}; quizScoresRef.current=newScores; setQuizScores(newScores);
      try {
        let serverBase={};
        try{const cur=await fetch('/api/quiz').then(r=>r.json());if(cur.quizData)serverBase=cur.quizData;}catch{}
        const data={...serverBase,eventType:quizEventType,groups:quizGroups,scores:newScores,myGroups:quizMyGroups,currentQ:quizCurrentQ,questions:Object.keys(quizQuestions).length>0?quizQuestions:(serverBase.questions||{}),questionsFile:quizQFile||serverBase.questionsFile||null,answers:Object.keys(quizAnswers).length>0?quizAnswers:(serverBase.answers||{}),answersFile:quizAnswerFile||serverBase.answersFile||null};
        await fetch('/api/quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quizData:data})});
      }catch{}
    };
    const goNext = () => {
      const latestScores=quizScoresRef.current; const nextQ=quizCurrentQ<totalQ?quizCurrentQ+1:quizCurrentQ;
      const data={eventType:quizEventType,groups:quizGroups,scores:latestScores,myGroups:quizMyGroups,currentQ:nextQ};
      setQuizData(data); saveQuizData(data);
      if(quizCurrentQ<totalQ)setQuizCurrentQ(q=>q+1); else setQuizStep('results');
    };
    const goPrev = () => { if(quizCurrentQ>1)setQuizCurrentQ(q=>q-1); };
    const progressPct = Math.round((quizCurrentQ/totalQ)*100);
    const currentQuestion = quizQuestions[quizCurrentQ];
    return (
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerLeft}><button style={{...S.smallBtn,marginRight:4}} onClick={()=>setQuizStep('groups')}>← Geri</button><span style={{fontSize:13,fontWeight:800,letterSpacing:2,color:'#fff'}}>🎯 PUANLAMA</span></div>
          <div style={S.headerRight}>{quizSaving&&<span style={{fontSize:10,color:'#22c55e'}}>⟳ Kaydediliyor</span>}<button onClick={()=>setQuizStep('results')} style={{...S.smallBtn,color:'#fbbf24',borderColor:'#fbbf2444'}}>📊 Sonuçlar</button></div>
        </div>
        <div style={{maxWidth:480,margin:'0 auto',padding:'16px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:11,color:'#475569'}}>{ev?.label}</span>
            <span style={{fontSize:11,color:'#475569'}}>{quizCurrentQ} / {totalQ}</span>
          </div>
          <div style={{background:'#1a2035',borderRadius:6,height:6,marginBottom:10,overflow:'hidden'}}>
            <div style={{height:'100%',background:'linear-gradient(90deg,#fbbf24,#f59e0b)',width:progressPct+'%',borderRadius:6,transition:'width 0.3s'}}/>
          </div>
          <div style={{background: totalQ > 45 ? '#0a1a0a' : '#0a0e1a', border:'1px solid '+(totalQ > 45 ? '#22c55e33' : '#b47cff33'), borderRadius:8, padding:'5px 12px', marginBottom:14, display:'flex', alignItems:'center', gap:6}}>
            <span style={{fontSize:10, color: totalQ > 45 ? '#4ade80' : '#b47cff', fontWeight:700}}>
              {totalQ > 45
                ? `📊 ${totalQ} soru · Sabit puanlama: Her soru 10 puan`
                : `📊 ${totalQ} soru · Kademeli puanlama: ${Array.from({length:Math.ceil(totalQ/10)},(_,i)=>`${i*10+1}-${Math.min((i+1)*10,totalQ)}→${(i+1)*10}p`).join(' / ')}`
              }
            </span>
          </div>
          <div style={{background:'#0d1120',border:'1px solid #1a2035',borderRadius:16,padding:'16px 18px 14px',marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <button onClick={()=>setQuizPickerOpen(true)} style={{background:'#fbbf2422',border:'1px solid #fbbf2444',borderRadius:8,padding:'4px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:12,fontWeight:800,color:'#fbbf24'}}>Soru {quizCurrentQ}</span>
                <span style={{fontSize:10,color:'#f59e0b'}}>▼</span>
              </button>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {currentQuestion&&(<button onClick={()=>setQuizShowQuestion(q=>!q)} style={{background:'#1a0a2e',border:'1px solid #b47cff44',borderRadius:8,padding:'4px 10px',color:'#b47cff',fontSize:11,fontWeight:700,cursor:'pointer'}}>{quizShowQuestion?'🙈 Soruyu Gizle':'👁 Soruyu Göster'}</button>)}
                <div style={{background:'#b47cff22',border:'1px solid #b47cff44',borderRadius:8,padding:'4px 12px'}}><span style={{fontSize:12,fontWeight:800,color:'#b47cff'}}>{qPoint} puan</span></div>
              </div>
            </div>
            {quizShowQuestion&&currentQuestion&&(
              <div style={{background:'#0a0e1a',border:'1px solid #b47cff33',borderRadius:10,padding:'12px 14px',marginBottom:12}}>
                <div style={{fontSize:11,color:'#b47cff',fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:1}}>Soru</div>
                <div style={{fontSize:14,color:'#e2e8f0',lineHeight:1.6,fontWeight:600}}>{currentQuestion.question}</div>
              </div>
            )}
            {quizAnswers[quizCurrentQ]&&(
              <div style={{background:'#0a1a2e',border:'1px solid #0ea5e933',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:13,color:'#4fc9ff',fontWeight:800,flexShrink:0}}>Cevap:</span>
                <span style={{fontSize:14,color:'#e2e8f0',fontWeight:700}}>{quizAnswers[quizCurrentQ]}</span>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {myGroupObjs.map(g=>{
                const correct=!!(quizScores[g.no]?.[quizCurrentQ]);
                return (<button key={g.no} onClick={()=>toggleAnswer(g.no)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderRadius:12,border:'2px solid',cursor:'pointer',background:correct?'#0a1a0a':'#0a0e1a',borderColor:correct?'#22c55e':'#1a2035',transition:'all 0.15s'}}>
                  <span style={{fontSize:14,fontWeight:700,color:correct?'#22c55e':'#64748b'}}>{g.no} No'lu Grup{g.name?` · ${g.name}`:''}</span>
                  <div style={{width:28,height:28,borderRadius:6,border:'2px solid',display:'flex',alignItems:'center',justifyContent:'center',background:correct?'#22c55e':'transparent',borderColor:correct?'#22c55e':'#374151',transition:'all 0.15s',flexShrink:0}}>{correct&&<span style={{fontSize:16,color:'#fff',fontWeight:900}}>✓</span>}</div>
                </button>);
              })}
            </div>
          </div>
          {quizSaving&&<div style={{textAlign:'center',marginBottom:8}}><span style={{fontSize:11,color:'#22c55e',fontWeight:600}}>⟳ Kaydediliyor…</span></div>}
          <div style={{display:'flex',gap:10}}>
            <button onClick={goPrev} disabled={quizCurrentQ===1} style={{flex:1,padding:'13px',borderRadius:12,border:'1px solid #1a2035',cursor:'pointer',background:'#0d1120',color:quizCurrentQ===1?'#1a2035':'#94a3b8',fontWeight:700,fontSize:14}}>← Önceki</button>
            <button onClick={goNext} style={{flex:2,padding:'13px',borderRadius:12,border:'none',cursor:'pointer',fontWeight:800,fontSize:14,background:quizCurrentQ===totalQ?'linear-gradient(135deg,#22c55e,#16a34a)':'linear-gradient(135deg,#fbbf24,#f59e0b)',color:'#000'}}>{quizCurrentQ===totalQ?'🏁 Bitir':'Sonraki →'}</button>
          </div>
        </div>
        {quizPickerOpen&&(
          <div onClick={()=>setQuizPickerOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
            <div onClick={e=>e.stopPropagation()} style={{background:'#0d1120',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:480,maxHeight:'70vh',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.6)'}}>
              <div style={{width:40,height:4,borderRadius:2,background:'#1e293b',margin:'14px auto 0'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px 10px'}}>
                <span style={{fontSize:14,fontWeight:800,color:'#fff'}}>Soruya Git</span>
                <button onClick={()=>setQuizPickerOpen(false)} style={{background:'#1a2035',border:'none',borderRadius:8,padding:'5px 12px',color:'#94a3b8',fontSize:13,cursor:'pointer',fontWeight:600}}>✕</button>
              </div>
              <div style={{overflowY:'auto',padding:'8px 16px 32px',flex:1}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
                  {Array.from({length:totalQ},(_,i)=>i+1).map(qNo=>{
                    const isCurrent=qNo===quizCurrentQ;
                    const answered=myGroupObjs.some(g=>quizScores[g.no]?.[qNo]!==undefined);
                    const allCorrect=myGroupObjs.length>0&&myGroupObjs.every(g=>quizScores[g.no]?.[qNo]===true);
                    const someCorrect=myGroupObjs.some(g=>quizScores[g.no]?.[qNo]===true);
                    return (<button key={qNo} onClick={()=>{setQuizCurrentQ(qNo);setQuizPickerOpen(false);setQuizShowQuestion(false);}}
                      style={{aspectRatio:'1',borderRadius:10,border:'2px solid',fontSize:13,fontWeight:800,cursor:'pointer',background:isCurrent?'#fbbf24':allCorrect?'#0a1a0a':someCorrect?'#0d1a10':answered?'#0a0e1a':'#111827',color:isCurrent?'#000':allCorrect?'#22c55e':someCorrect?'#4ade80':'#475569',borderColor:isCurrent?'#fbbf24':allCorrect?'#22c55e66':someCorrect?'#22c55e33':'#1e293b',transition:'all 0.1s'}}>{qNo}</button>);
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Sonuçlar
  if (quizStep === 'results') {
    const displayScores = Object.keys(quizLiveScores).length > 0 ? quizLiveScores : quizScores;
    const displayGroups = quizLiveGroups.length > 0 ? quizLiveGroups : quizGroups;
    const allGroupScores = displayGroups.map(g=>({...g,score:calcGroupScore(g.no,quizEventType,displayScores,totalQ)})).sort((a,b)=>b.score-a.score);
    const maxScore = allGroupScores.length > 0 ? allGroupScores[0].score : 0;
    const medals = ['🥇','🥈','🥉'];
    return (
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerLeft}><button style={{...S.smallBtn,marginRight:4}} onClick={()=>setQuizStep('scoring')}>← Geri</button><span style={{fontSize:13,fontWeight:800,letterSpacing:2,color:'#fff'}}>📊 SONUÇLAR</span></div>
          <div style={S.headerRight}>
            {quizResultsLoading&&<span style={{fontSize:11,color:'#4fc9ff'}}>⟳ Yükleniyor…</span>}
            <button onClick={()=>{setQuizResultsLoading(true);fetch('/api/quiz').then(r=>r.json()).then(d=>{if(d.quizData){setQuizLiveScores(d.quizData.scores||{});setQuizLiveGroups(d.quizData.groups||[]);}}).catch(()=>{}).finally(()=>setQuizResultsLoading(false));}} style={{...S.smallBtn}}>⟳ Güncelle</button>
          </div>
        </div>
        <div style={{maxWidth:480,margin:'0 auto',padding:'16px 18px'}}>
          <div style={{textAlign:'center',marginBottom:16}}>
            <div style={{fontSize:11,color:'#475569',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>{ev?.label} · {quizGroups.length} Grup</div>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <button onClick={()=>setQuizSortMode('score')} style={{flex:1,padding:'9px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',background:quizSortMode==='score'?'#12100a':'#0d1120',color:quizSortMode==='score'?'#fbbf24':'#475569',border:'1px solid '+(quizSortMode==='score'?'#fbbf2444':'#1a2035')}}>🏆 Puana Göre</button>
            <button onClick={()=>setQuizSortMode('groupno')} style={{flex:1,padding:'9px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',background:quizSortMode==='groupno'?'#0a1a2e':'#0d1120',color:quizSortMode==='groupno'?'#4fc9ff':'#475569',border:'1px solid '+(quizSortMode==='groupno'?'#4fc9ff44':'#1a2035')}}>🔢 Grup No'ya Göre</button>
          </div>
          {(() => {
            const sorted = quizSortMode==='groupno' ? [...allGroupScores].sort((a,b)=>(parseInt(a.no)||0)-(parseInt(b.no)||0)) : allGroupScores;
            const sortedByScore = [...allGroupScores].sort((a,b)=>b.score-a.score);
            const rankMap = {};
            sortedByScore.forEach((g,i)=>{if(i===0){rankMap[g.no]=1;}else if(g.score===sortedByScore[i-1].score){rankMap[g.no]=rankMap[sortedByScore[i-1].no];}else{const d=new Set(sortedByScore.slice(0,i).map(x=>x.score)).size;rankMap[g.no]=d+1;}});
            return sorted.map(g=>{
              const currentRank=quizSortMode==='score'?rankMap[g.no]:null;
              const isTop=currentRank!==null&&currentRank<=3&&g.score>0;
              const medal=currentRank!==null?medals[currentRank-1]:null;
              const isMe=quizMyGroups.includes(g.no);
              const barWidth=maxScore>0?Math.round((g.score/maxScore)*100):0;
              const isExpanded=quizExpandedGroup===g.no;
              const groupScoreMap=displayScores[g.no]||{};
              const tQ=totalQ;
              return (
                <div key={g.no} style={{marginBottom:8}}>
                  <div onClick={()=>setQuizExpandedGroup(isExpanded?null:g.no)} style={{background:isTop&&currentRank===1&&g.score>0?'#12100a':'#0d1120',border:'1px solid '+(isExpanded?'#fbbf2466':isTop&&currentRank===1&&g.score>0?'#fbbf2444':isMe?'#4fc9ff33':'#0f1525'),borderRadius:isExpanded?'12px 12px 0 0':12,padding:'14px 16px',position:'relative',overflow:'hidden',cursor:'pointer'}}>
                    <div style={{position:'absolute',left:0,top:0,bottom:0,width:barWidth+'%',background:isTop&&currentRank===1&&g.score>0?'#fbbf2408':'#ffffff04',transition:'width 0.5s ease'}}/>
                    <div style={{position:'relative',display:'flex',alignItems:'center',gap:12}}>
                      <div style={{fontSize:20,minWidth:28,textAlign:'center',flexShrink:0}}>{isTop&&medal?medal:currentRank!==null?<span style={{fontSize:13,color:'#374151',fontWeight:700}}>#{currentRank}</span>:<span style={{fontSize:13,color:'#374151',fontWeight:700}}>G{g.no}</span>}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                          <span style={{fontSize:14,fontWeight:800,color:isTop&&currentRank===1&&g.score>0?'#fbbf24':'#e2e8f0'}}>{g.no} No{g.name?' · '+g.name:''}</span>
                          {isMe&&<span style={{fontSize:10,color:'#4fc9ff',background:'#4fc9ff11',border:'1px solid #4fc9ff33',borderRadius:4,padding:'1px 6px',fontWeight:700}}>Benim</span>}
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                        <div style={{textAlign:'right'}}><div style={{fontSize:22,fontWeight:900,color:currentRank===1&&g.score>0?'#fbbf24':g.score>0?'#e2e8f0':'#374151',lineHeight:1}}>{g.score.toLocaleString('tr')}</div><div style={{fontSize:10,color:'#475569'}}>puan</div></div>
                        <span style={{fontSize:16,color:'#475569',transition:'transform 0.2s',display:'inline-block',transform:isExpanded?'rotate(90deg)':'none'}}>›</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded&&(
                    <div style={{background:'#090d17',border:'1px solid #fbbf2422',borderTop:'none',borderRadius:'0 0 12px 12px',padding:'12px 14px'}}>
                      <div style={{fontSize:11,color:'#64748b',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Soru Detayı</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                        {Array.from({length:tQ},(_,i)=>i+1).map(qNo=>{
                          const correct=!!groupScoreMap[qNo]; const hasAnswer=quizAnswers[qNo];
                          return (<div key={qNo} title={hasAnswer?('S'+qNo+': '+quizAnswers[qNo]):'Soru '+qNo}
                            style={{width:32,height:32,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,background:correct?'#0a1a0a':groupScoreMap[qNo]===false?'#1a0a0a':'#111827',border:'1px solid '+(correct?'#22c55e66':groupScoreMap[qNo]===false?'#ef444466':'#1e293b'),color:correct?'#22c55e':groupScoreMap[qNo]===false?'#ef4444':'#374151',cursor:hasAnswer?'help':'default',flexShrink:0}}>
                            {correct?'✓':groupScoreMap[qNo]===false?'✗':qNo}
                          </div>);
                        })}
                      </div>
                      <div style={{display:'flex',gap:16,marginTop:10,fontSize:11,color:'#64748b'}}>
                        <span><span style={{color:'#22c55e'}}>✓</span> Doğru: {Object.values(groupScoreMap).filter(v=>v===true).length}</span>
                        <span><span style={{color:'#ef4444'}}>✗</span> Yanlış/Boş: {tQ-Object.values(groupScoreMap).filter(v=>v===true).length}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
          <button onClick={()=>{setQuizResultsLoading(true);fetch('/api/quiz').then(r=>r.json()).then(d=>{if(d.quizData){setQuizLiveScores(d.quizData.scores||{});setQuizLiveGroups(d.quizData.groups||[]);setQuizScores(d.quizData.scores||{});setQuizGroups(d.quizData.groups||[]);}}).catch(()=>{}).finally(()=>setQuizResultsLoading(false));}}
            style={{width:'100%',marginTop:8,padding:'13px',borderRadius:12,border:'1px solid #4fc9ff44',cursor:'pointer',background:'#0d1a2e',color:'#4fc9ff',fontWeight:700,fontSize:14,marginBottom:8}}>⟳ Tüm Puantör Verilerini Güncelle</button>
          <button onClick={()=>setQuizStep('scoring')} style={{width:'100%',padding:'13px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#fbbf24,#f59e0b)',color:'#000',fontWeight:800,fontSize:14}}>← Puanlamaya Dön (Soru {quizCurrentQ})</button>
        </div>
      </div>
    );
  }

  return null;
}
