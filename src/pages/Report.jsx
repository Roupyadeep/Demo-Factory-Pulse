import React, { useState, useRef, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  FileText, Download, Printer, Plus, Trash2, ChevronDown,
  ChevronUp, BarChart2, PieChart as PieIcon, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Factory, RefreshCw,
  Eye, EyeOff, GripVertical, Settings, X, Save
} from 'lucide-react';

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED = {
  plantName: 'Plant Alpha — Unit 3',
  period: 'May 2025',
  generatedAt: new Date().toLocaleString(),
  kpis: [
    { label: 'Overall Efficiency',   value: '78%',  delta: '+4%',  up: true  },
    { label: 'Avg Temperature',      value: '72.5°C', delta: '-1.2°C', up: true  },
    { label: 'Peak Vibration',       value: '3.2 mm/s', delta: '+0.3', up: false },
    { label: 'Avg Pressure',         value: '48 PSI', delta: 'stable', up: null  },
    { label: 'Overdue Maintenance',  value: '2',    delta: '-1',   up: true  },
    { label: 'ML Confidence Score',  value: '74%',  delta: '+6%',  up: true  },
  ],
  efficiency: [
    { name: 'Jan', actual: 70, target: 80 },
    { name: 'Feb', actual: 65, target: 80 },
    { name: 'Mar', actual: 72, target: 80 },
    { name: 'Apr', actual: 74, target: 80 },
    { name: 'May', actual: 78, target: 80 },
  ],
  sensor: [
    { name: 'Mon', temp: 71, vib: 3.1, pressure: 47 },
    { name: 'Tue', temp: 73, vib: 3.3, pressure: 49 },
    { name: 'Wed', temp: 74, vib: 3.5, pressure: 48 },
    { name: 'Thu', temp: 72, vib: 3.2, pressure: 47 },
    { name: 'Fri', temp: 75, vib: 3.8, pressure: 50 },
    { name: 'Sat', temp: 76, vib: 4.0, pressure: 51 },
    { name: 'Sun', temp: 74, vib: 3.6, pressure: 49 },
  ],
  riskDist: [
    { name: 'LOW',    value: 1, color: '#ef4444' },
    { name: 'MEDIUM', value: 2, color: '#f59e0b' },
    { name: 'HIGH',   value: 3, color: '#10b981' },
  ],
  anomalies: [
    { time: 'Mon 09:14', metric: 'Vibration',    value: '5.1 mm/s', severity: 'high',   status: 'resolved'  },
    { time: 'Tue 14:30', metric: 'Temperature',  value: '88.2 °C',  severity: 'medium', status: 'resolved'  },
    { time: 'Wed 07:55', metric: 'Pressure',     value: '68 PSI',   severity: 'medium', status: 'monitoring'},
    { time: 'Thu 22:10', metric: 'Vibration',    value: '3.9 mm/s', severity: 'low',    status: 'resolved'  },
    { time: 'Fri 11:40', metric: 'Efficiency',   value: '61%',      severity: 'high',   status: 'open'      },
  ],
  maintenance: [
    { task: 'Lubricate conveyor bearings',  due: '2025-05-14', status: 'overdue',    tech: 'R. Sharma'  },
    { task: 'Inspect pressure relief valve',due: '2025-05-20', status: 'overdue',    tech: 'A. Patel'   },
    { task: 'Calibrate temp sensors',       due: '2025-05-28', status: 'scheduled',  tech: 'D. Kapoor'  },
    { task: 'Replace air filters',          due: '2025-06-02', status: 'scheduled',  tech: 'R. Sharma'  },
    { task: 'Full vibration audit',         due: '2025-06-10', status: 'scheduled',  tech: 'A. Patel'   },
  ],
  recommendations: [
    { priority: 'critical', text: 'Immediately address overdue bearing lubrication — vibration anomalies suggest accelerating wear.' },
    { priority: 'high',     text: 'Schedule pressure relief valve inspection before next production run to avoid pressure excursions.' },
    { priority: 'medium',   text: 'Review Friday efficiency dip; correlates with shift changeover. Consider process standardisation.' },
    { priority: 'low',      text: 'ML confidence trending positive. Continue current monitoring cadence.' },
  ],
};

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:       '#f0f4ff',
  surface:  '#ffffff',
  surface2: '#f8fafc',
  border:   '#e2e8f0',
  text:     '#0f172a',
  textSub:  '#475569',
  textMuted:'#94a3b8',
  grid:     '#f1f5f9',
  accent:   '#3b82f6',
};

// ─── Shared micro-components ──────────────────────────────────────────────────
const Badge = ({ label, color }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
    padding: '2px 8px', borderRadius: 999,
    background: color + '18', color, border: `1px solid ${color}33`,
    fontFamily: "'DM Mono',monospace",
  }}>{label}</span>
);

const severityColor = s => s==='high'?'#ef4444':s==='medium'?'#f59e0b':'#10b981';
const priorityColor  = p => p==='critical'?'#ef4444':p==='high'?'#f97316':p==='medium'?'#f59e0b':'#10b981';
const statusColor    = s => s==='overdue'?'#ef4444':s==='monitoring'?'#f59e0b':s==='open'?'#f97316':'#10b981';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,.12)', fontSize:12, fontFamily:"'DM Mono',monospace" }}>
      <p style={{ color:T.textSub, marginBottom:4, fontWeight:600 }}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{ color:p.color, margin:'2px 0' }}>
          {p.name}: <strong>{typeof p.value==='number'?p.value.toFixed(1):p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const SectionHeader = ({ icon, title, visible, onToggle, onRemove, handle }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: visible ? 16 : 0 }}>
    <span {...handle} style={{ color:T.textMuted, cursor:'grab', display:'flex' }}><GripVertical size={16}/></span>
    <span style={{ color:T.accent }}>{icon}</span>
    <span style={{ fontSize:15, fontWeight:700, color:T.text, flex:1 }}>{title}</span>
    <button onClick={onToggle} style={{ background:'none', border:'none', cursor:'pointer', color:T.textMuted, display:'flex', padding:4, borderRadius:6 }}>
      {visible ? <EyeOff size={14}/> : <Eye size={14}/>}
    </button>
    <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:'#fca5a5', display:'flex', padding:4, borderRadius:6 }}>
      <X size={14}/>
    </button>
  </div>
);

// ─── Section Components ───────────────────────────────────────────────────────
const KPIGrid = ({ data }) => (
  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
    {data.kpis.map((k,i)=>(
      <div key={i} style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', borderLeft:`3px solid ${T.accent}` }}>
        <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:1.2, color:T.textMuted, fontWeight:700, marginBottom:6 }}>{k.label}</p>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <span style={{ fontSize:22, fontWeight:800, color:T.text, fontFamily:"'DM Mono',monospace" }}>{k.value}</span>
          <span style={{ fontSize:11, fontWeight:700, color: k.up===true?'#10b981':k.up===false?'#ef4444':T.textMuted, fontFamily:"'DM Mono',monospace" }}>
            {k.delta}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const EfficiencyChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data.efficiency} barGap={4}>
      <CartesianGrid strokeDasharray="3 3" stroke={T.grid} vertical={false}/>
      <XAxis dataKey="name" tick={{ fill:T.textMuted, fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false}/>
      <YAxis domain={[50,90]} tick={{ fill:T.textMuted, fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend wrapperStyle={{ color:T.textSub, fontSize:11, fontFamily:"'DM Mono',monospace" }}/>
      <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[5,5,0,0]} barSize={30}/>
      <Bar dataKey="target" name="Target" fill="#10b981" radius={[5,5,0,0]} barSize={30} opacity={0.65}/>
    </BarChart>
  </ResponsiveContainer>
);

const SensorChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={data.sensor}>
      <CartesianGrid strokeDasharray="3 3" stroke={T.grid} vertical={false}/>
      <XAxis dataKey="name" tick={{ fill:T.textMuted, fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false}/>
      <YAxis yAxisId="left"  tick={{ fill:T.textMuted, fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false}/>
      <YAxis yAxisId="right" orientation="right" tick={{ fill:T.textMuted, fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend wrapperStyle={{ color:T.textSub, fontSize:11, fontFamily:"'DM Mono',monospace" }}/>
      <Line yAxisId="left"  type="monotone" dataKey="temp"     name="Temp (°C)"     stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{r:4}}/>
      <Line yAxisId="right" type="monotone" dataKey="vib"      name="Vib (mm/s)"    stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{r:4}}/>
      <Line yAxisId="left"  type="monotone" dataKey="pressure" name="Pressure (PSI)" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r:4}}/>
    </LineChart>
  </ResponsiveContainer>
);

const RiskChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <PieChart>
      <Pie data={data.riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={44} paddingAngle={3}
        label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}
        labelLine={{ stroke:T.border, strokeWidth:1 }}>
        {data.riskDist.map((e,i)=><Cell key={i} fill={e.color}/>)}
      </Pie>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend wrapperStyle={{ color:T.textSub, fontSize:11, fontFamily:"'DM Mono',monospace" }}/>
    </PieChart>
  </ResponsiveContainer>
);

const AnomalyTable = ({ data }) => (
  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px', fontSize:12 }}>
    <thead>
      <tr>
        {['Time','Metric','Value','Severity','Status'].map(h=>(
          <th key={h} style={{ padding:'6px 12px', textAlign:'left', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, color:T.textMuted, fontFamily:"'DM Mono',monospace" }}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.anomalies.map((row,i)=>(
        <tr key={i}>
          {[
            <span style={{ fontFamily:"'DM Mono',monospace", color:T.textSub }}>{row.time}</span>,
            <strong style={{ color:T.text }}>{row.metric}</strong>,
            <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:700, color:severityColor(row.severity) }}>{row.value}</span>,
            <Badge label={row.severity} color={severityColor(row.severity)}/>,
            <Badge label={row.status}   color={statusColor(row.status)}/>,
          ].map((cell,j)=>(
            <td key={j} style={{ padding:'10px 12px', background: i%2===0 ? T.surface2 : T.surface, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`,
              borderLeft: j===0 ? `1px solid ${T.border}` : 'none',
              borderRight: j===4 ? `1px solid ${T.border}` : 'none',
              borderRadius: j===0 ? '8px 0 0 8px' : j===4 ? '0 8px 8px 0' : 0,
            }}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const MaintenanceTable = ({ data }) => (
  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px', fontSize:12 }}>
    <thead>
      <tr>
        {['Task','Due Date','Technician','Status'].map(h=>(
          <th key={h} style={{ padding:'6px 12px', textAlign:'left', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, color:T.textMuted, fontFamily:"'DM Mono',monospace" }}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.maintenance.map((row,i)=>(
        <tr key={i}>
          {[
            <strong style={{ color:T.text }}>{row.task}</strong>,
            <span style={{ fontFamily:"'DM Mono',monospace", color: row.status==='overdue'?'#ef4444':T.textSub }}>{row.due}</span>,
            <span style={{ color:T.textSub }}>{row.tech}</span>,
            <Badge label={row.status} color={statusColor(row.status)}/>,
          ].map((cell,j)=>(
            <td key={j} style={{ padding:'10px 12px', background: i%2===0 ? T.surface2 : T.surface, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`,
              borderLeft: j===0 ? `1px solid ${T.border}` : 'none',
              borderRight: j===3 ? `1px solid ${T.border}` : 'none',
              borderRadius: j===0 ? '8px 0 0 8px' : j===3 ? '0 8px 8px 0' : 0,
            }}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const Recommendations = ({ data }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
    {data.recommendations.map((r,i)=>(
      <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:10, background:T.surface2, border:`1px solid ${T.border}`, borderLeft:`3px solid ${priorityColor(r.priority)}` }}>
        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, color:priorityColor(r.priority), fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap', paddingTop:2 }}>{r.priority}</span>
        <p style={{ fontSize:13, color:T.textSub, lineHeight:1.6 }}>{r.text}</p>
      </div>
    ))}
  </div>
);

// ─── All available sections ───────────────────────────────────────────────────
const ALL_SECTIONS = [
  { id:'kpi',         label:'KPI Summary',          icon:<BarChart2 size={16}/>,    component: KPIGrid },
  { id:'efficiency',  label:'Efficiency Trend',      icon:<TrendingUp size={16}/>,   component: EfficiencyChart },
  { id:'sensor',      label:'Sensor Trends',         icon:<TrendingUp size={16}/>,   component: SensorChart },
  { id:'risk',        label:'Risk Distribution',     icon:<PieIcon size={16}/>,      component: RiskChart },
  { id:'anomalies',   label:'Anomaly Log',           icon:<AlertTriangle size={16}/>,component: AnomalyTable },
  { id:'maintenance', label:'Maintenance Schedule',  icon:<Clock size={16}/>,        component: MaintenanceTable },
  { id:'recommendations', label:'Recommendations',   icon:<CheckCircle size={16}/>,  component: Recommendations },
];

// ─── Main Report Component ────────────────────────────────────────────────────
const ReportBuilder = () => {
  const [reportData, setReportData] = useState(SEED);
  const [sections, setSections] = useState(
    ALL_SECTIONS.map(s=>({ ...s, visible:true }))
  );
  const [showPanel, setShowPanel] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(reportData.plantName);
  const [period, setPeriod] = useState(reportData.period);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [saved, setSaved] = useState(false);
  const printRef = useRef(null);

  // ── Toggle visibility ──
  const toggleSection = id => setSections(s => s.map(x => x.id===id ? {...x, visible:!x.visible} : x));
  const removeSection  = id => setSections(s => s.filter(x => x.id!==id));
  const addSection     = s  => setSections(prev => [...prev, {...s, visible:true}]);

  // ── Drag-to-reorder ──
  const onDragStart = i => setDragIdx(i);
  const onDragOver  = (e,i) => { e.preventDefault(); setDragOver(i); };
  const onDrop      = i => {
    if (dragIdx===null || dragIdx===i) { setDragIdx(null); setDragOver(null); return; }
    const next = [...sections];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setSections(next);
    setDragIdx(null);
    setDragOver(null);
  };

  // ── Print / export ──
  const handlePrint = () => window.print();

  const handleSave = () => {
    setReportData(d => ({ ...d, plantName: title, period, generatedAt: new Date().toLocaleString() }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const removedSections = ALL_SECTIONS.filter(a => !sections.find(s => s.id===a.id));

  const axisT = { fill:T.textMuted, fontSize:11, fontFamily:"'DM Mono',monospace" };

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans','Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .sec{animation:fadeIn .35s ease-out both}
        @media print {
          .no-print{display:none!important}
          body{background:#fff}
          .print-page{box-shadow:none!important;border-radius:0!important;margin:0!important}
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="no-print" style={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${T.border}`,
        padding:'10px 24px', display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FileText size={18} color="#fff"/>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:T.text }}>Report Builder</p>
            <p style={{ fontSize:11, color:T.textMuted }}>Drag sections · toggle visibility · export</p>
          </div>
        </div>

        <button onClick={() => setShowPanel(p=>!p)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8,
          background: showPanel ? T.accent : T.surface, border:`1px solid ${showPanel ? T.accent : T.border}`,
          color: showPanel ? '#fff' : T.textSub, cursor:'pointer', fontSize:12, fontWeight:600,
        }}>
          <Settings size={14}/> Sections
        </button>

        <button onClick={handleSave} style={{
          display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8,
          background: saved ? '#10b981' : T.surface, border:`1px solid ${saved ? '#10b981' : T.border}`,
          color: saved ? '#fff' : T.textSub, cursor:'pointer', fontSize:12, fontWeight:600,
          transition:'all .25s',
        }}>
          <Save size={14}/> {saved ? 'Saved!' : 'Save'}
        </button>

        <button onClick={handlePrint} style={{
          display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8,
          background:'#0f172a', border:'1px solid #0f172a',
          color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600,
        }}>
          <Printer size={14}/> Print / Export PDF
        </button>
      </div>

      {/* ── Sections panel ── */}
      {showPanel && (
        <div className="no-print" style={{
          position:'fixed', right:24, top:70, zIndex:200,
          background:T.surface, border:`1px solid ${T.border}`, borderRadius:14,
          padding:18, width:260, boxShadow:'0 8px 32px rgba(0,0,0,.12)',
          animation:'fadeIn .2s ease-out',
        }}>
          <p style={{ fontSize:12, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>Manage Sections</p>
          {sections.map(s=>(
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:8, marginBottom:4, background:T.surface2 }}>
              <span style={{ color:T.accent, display:'flex' }}>{s.icon}</span>
              <span style={{ fontSize:12, flex:1, color:T.text }}>{s.label}</span>
              <button onClick={()=>toggleSection(s.id)} style={{ background:'none', border:'none', cursor:'pointer', color: s.visible ? '#10b981' : T.textMuted, display:'flex' }}>
                {s.visible ? <Eye size={13}/> : <EyeOff size={13}/>}
              </button>
              <button onClick={()=>removeSection(s.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#fca5a5', display:'flex' }}>
                <X size={13}/>
              </button>
            </div>
          ))}
          {removedSections.length > 0 && (
            <>
              <p style={{ fontSize:11, color:T.textMuted, margin:'12px 0 6px', textTransform:'uppercase', letterSpacing:0.8 }}>Add back</p>
              {removedSections.map(s=>(
                <button key={s.id} onClick={()=>addSection(s)} style={{
                  display:'flex', alignItems:'center', gap:6, width:'100%',
                  padding:'6px 8px', borderRadius:8, marginBottom:4,
                  background:'none', border:`1px dashed ${T.border}`,
                  color:T.textSub, cursor:'pointer', fontSize:12,
                }}>
                  <Plus size={12}/> {s.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Report Page ── */}
      <div ref={printRef} className="print-page" style={{ maxWidth:960, margin:'28px auto', padding:'0 24px 48px' }}>

        {/* Cover header */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:'28px 32px', marginBottom:20, boxShadow:'0 2px 16px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#3b82f6,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Factory size={20} color="#fff"/>
                </div>
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, color:T.textMuted }}>Manufacturing Intelligence Report</span>
              </div>

              {editingTitle ? (
                <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <input value={title} onChange={e=>setTitle(e.target.value)}
                    style={{ fontSize:22, fontWeight:800, color:T.text, border:`1px solid ${T.accent}`, borderRadius:8, padding:'4px 10px', fontFamily:"'DM Sans',sans-serif", outline:'none', width:340 }}
                    autoFocus onBlur={()=>setEditingTitle(false)} onKeyDown={e=>e.key==='Enter'&&setEditingTitle(false)}
                  />
                </div>
              ) : (
                <h1 onClick={()=>setEditingTitle(true)} style={{ fontSize:24, fontWeight:800, color:T.text, marginBottom:6, cursor:'text', letterSpacing:-0.5 }}>
                  {title} <span style={{ fontSize:13, fontWeight:400, color:T.textMuted }}>✎</span>
                </h1>
              )}

              <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:T.textSub }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Clock size={12} color={T.textMuted}/>
                  <input value={period} onChange={e=>setPeriod(e.target.value)}
                    style={{ border:'none', background:'none', fontSize:12, color:T.textSub, fontFamily:"'DM Sans',sans-serif", cursor:'text', outline:'none', width:90 }}/>
                </span>
                <span>Generated: {reportData.generatedAt}</span>
              </div>
            </div>

            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>ML Confidence</div>
              <div style={{ fontSize:40, fontWeight:800, color:T.accent, fontFamily:"'DM Mono',monospace", lineHeight:1 }}>74%</div>
              <div style={{ fontSize:11, color:'#10b981', fontWeight:700 }}>▲ +6% vs last period</div>
            </div>
          </div>
        </div>

        {/* Draggable sections */}
        {sections.map((sec, idx) => {
          const Comp = sec.component;
          return (
            <div
              key={sec.id}
              className="sec"
              draggable
              onDragStart={()=>onDragStart(idx)}
              onDragOver={e=>onDragOver(e,idx)}
              onDrop={()=>onDrop(idx)}
              style={{
                background:T.surface,
                border:`1px solid ${dragOver===idx ? T.accent : T.border}`,
                borderRadius:16, padding:'20px 24px', marginBottom:16,
                boxShadow: dragOver===idx ? `0 0 0 2px ${T.accent}33` : '0 2px 16px rgba(0,0,0,.06)',
                transition:'border .15s, box-shadow .15s',
                opacity: dragIdx===idx ? 0.5 : 1,
              }}
            >
              <SectionHeader
                icon={sec.icon} title={sec.label}
                visible={sec.visible}
                onToggle={()=>toggleSection(sec.id)}
                onRemove={()=>removeSection(sec.id)}
                handle={{ draggable:false }}
              />
              {sec.visible && (
                <div style={{ animation:'fadeIn .3s ease-out' }}>
                  <Comp data={reportData}/>
                </div>
              )}
            </div>
          );
        })}

        {/* Add section */}
        {removedSections.length > 0 && (
          <div className="no-print" style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
            {removedSections.map(s=>(
              <button key={s.id} onClick={()=>addSection(s)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'8px 14px', borderRadius:10,
                background:T.surface, border:`1.5px dashed ${T.border}`,
                color:T.textSub, cursor:'pointer', fontSize:12, fontWeight:600,
              }}>
                <Plus size={13}/> {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop:28, padding:'16px 24px', borderRadius:12, background:T.surface2, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, color:T.textMuted, fontFamily:"'DM Mono',monospace" }}>
            Manufacturing Intelligence Platform · Auto-generated · {reportData.generatedAt}
          </span>
          <span style={{ fontSize:11, color:T.textMuted, fontFamily:"'DM Mono',monospace" }}>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;