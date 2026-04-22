import { useState, useEffect, useCallback, useRef } from "react";
import { db, auth, provider } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

/* ─── DATA CONSTANTS ─── */
const PHASES = [
  {
    id: "p1", title: "Bridge the gap", badge: "Phase 01", timeline: "0 – 6 months",
    accent: "#38bdf8", accentSoft: "rgba(56,189,248,0.10)", accentBorder: "rgba(56,189,248,0.25)",
    tasks: [
      { id: "p1t1", name: "NASA ARSET training", desc: "Complete at least 2 remote sensing courses from NASA Applied Sciences", link: "https://appliedsciences.nasa.gov/get-involved/training", est: 20, category: "learning" },
      { id: "p1t2", name: "Read SMAD (Parts 1–3)", desc: "Space Mission Analysis & Design by Wertz — the industry vocabulary bible", est: 40, category: "learning" },
      { id: "p1t3", name: "FreeRTOS on soil sensor", desc: "Integrate FreeRTOS into your soil moisture sensor embedded project", est: 30, category: "project" },
      { id: "p1t4", name: "CubeSat standards study", desc: "Learn PC/104 form factor, AX.25 protocol, UHF/VHF downlinks", est: 15, category: "learning" },
      { id: "p1t5", name: "Python space tools", desc: "Learn astropy, satpy, skyfield — reprocess NOAA imagery with professional workflows", est: 25, category: "project" },
      { id: "p1t6", name: "Resume reframe", desc: "Add 'Independent Projects' section, reposition as Embedded / RF Engineer", est: 4, category: "career" },
      { id: "p1t7", name: "Build mock TT&C script", desc: "Telemetry, tracking & command script for a simulated CubeSat", est: 20, category: "project" },
      { id: "p1t8", name: "MIT OCW 16.851 or Delft Aero", desc: "Complete at least one free satellite / aero engineering course", link: "https://ocw.mit.edu", est: 30, category: "learning" },
    ],
  },
  {
    id: "p2", title: "Build the portfolio", badge: "Phase 02", timeline: "6 – 18 months",
    accent: "#34d399", accentSoft: "rgba(52,211,153,0.10)", accentBorder: "rgba(52,211,153,0.25)",
    tasks: [
      { id: "p2t1", name: "NOAA pipeline on GitHub", desc: "Document full GNU Radio satellite imagery pipeline end-to-end with README and samples", est: 20, category: "project" },
      { id: "p2t2", name: "Hydrogen line technical report", desc: "Write up 21cm observations: antenna specs, LNA, signal chain, rotation curve", est: 25, category: "project" },
      { id: "p2t3", name: "Contribute to OpenMCT", desc: "Submit PRs to NASA's open-source mission control framework", link: "https://github.com/nasa/openmct", est: 40, category: "project" },
      { id: "p2t4", name: "Amateur radio license", desc: "Pass General or Extra class FCC exam via ARRL", link: "https://www.arrl.org", est: 30, category: "credential" },
      { id: "p2t5", name: "Set up SatNOGS node", desc: "Build and register a ground station on the SatNOGS open network", link: "https://satnogs.org", est: 20, category: "project" },
      { id: "p2t6", name: "Space-grade PCB writeup", desc: "Extend soil sensor with power budget, thermal sim, radiation tolerance", est: 30, category: "project" },
      { id: "p2t7", name: "Study NASA-STD-8739.8", desc: "Software assurance standard — safety-critical practices and MISRA C", est: 15, category: "learning" },
      { id: "p2t8", name: "Present at a meetup / conf", desc: "Talk on your NOAA pipeline or hydrogen line work at AIAA or ham radio event", est: 10, category: "career" },
    ],
  },
  {
    id: "p3", title: "Get in the door", badge: "Phase 03", timeline: "12 – 24 months",
    accent: "#fbbf24", accentSoft: "rgba(251,191,36,0.10)", accentBorder: "rgba(251,191,36,0.25)",
    tasks: [
      { id: "p3t1", name: "Apply to New Space companies", desc: "Planet Labs, Spire, Hawkeye 360, Umbra, Capella — RF / ground systems roles", est: 15, category: "career" },
      { id: "p3t2", name: "Apply to NASA contractors", desc: "Leidos, Booz Allen, Jacobs, SAIC, KBR — target clearance sponsorship", est: 15, category: "career" },
      { id: "p3t3", name: "Apply to JPL directly", desc: "jpl.nasa.gov/careers — Computer Engineer, Ground Systems roles", link: "https://jpl.nasa.gov/careers", est: 10, category: "career" },
      { id: "p3t4", name: "Join AIAA", desc: "Membership + attend local section events for aerospace networking", link: "https://www.aiaa.org", est: 5, category: "career" },
      { id: "p3t5", name: "Attend SmallSat Conference", desc: "Annual in Logan, UT each August — present NOAA work if possible", link: "https://smallsat.org", est: 20, category: "career" },
      { id: "p3t6", name: "Begin clearance process", desc: "Through employer — target roles with Secret clearance sponsorship", est: 0, category: "credential" },
      { id: "p3t7", name: "USAJOBS profile + alerts", desc: "Set alerts for GS-12/13 Electronics / Computer Engineer at NASA centers", link: "https://www.usajobs.gov", est: 3, category: "career" },
    ],
  },
  {
    id: "p4", title: "At or for NASA", badge: "Phase 04", timeline: "2 – 4 years",
    accent: "#a78bfa", accentSoft: "rgba(167,139,250,0.10)", accentBorder: "rgba(167,139,250,0.25)",
    tasks: [
      { id: "p4t1", name: "Land aerospace role", desc: "Ground Systems SW, RF/Comms, Payload Electronics, or Mission Ops", est: 0, category: "career" },
      { id: "p4t2", name: "Complete clearance", desc: "Obtain Secret or TS/SCI through employer", est: 0, category: "credential" },
      { id: "p4t3", name: "Internal NASA transfer", desc: "Apply for direct civil servant positions after 1–2 years of aerospace XP", est: 0, category: "career" },
      { id: "p4t4", name: "Specialize & publish", desc: "Pick a niche and publish / present at IEEE or AIAA", est: 0, category: "career" },
    ],
  },
];

const CATS = {
  learning:   { label: "Learning",   fg: "#38bdf8", bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.25)" },
  project:    { label: "Project",    fg: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.25)" },
  career:     { label: "Career",     fg: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.25)" },
  credential: { label: "Credential", fg: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
};

const DEFAULT_STATE = { tasks: {}, schedule: {}, notes: {}, weeklyHours: 10, startDate: new Date().toISOString().split("T")[0] };
const ALL_TASKS = PHASES.flatMap(p => p.tasks);

/* ─── UI COMPONENTS ─── */
const Pill = ({ children, fg, bg, border }) => (
  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", padding: "3px 10px", borderRadius: 20, background: bg, color: fg, border: `1px solid ${border}`, whiteSpace: "nowrap" }}>{children}</span>
);

const Stat = ({ label, value, sub, color }) => (
  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px", minWidth: 0 }}>
    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || "#e2e8f0", lineHeight: 1 }}>{value}{sub && <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.35)", marginLeft: 2 }}>{sub}</span>}</div>
  </div>
);

const Bar = ({ pct, color, height = 5 }) => (
  <div style={{ height, background: "rgba(255,255,255,0.06)", borderRadius: height, overflow: "hidden", width: "100%" }}>
    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: height, transition: "width 0.6s cubic-bezier(.22,1,.36,1)" }} />
  </div>
);

const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const LinkIcon = () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "-1px" }}><path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const CalIcon = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "-1px" }}><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 7h12" stroke="currentColor" strokeWidth="1.1"/><path d="M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;

/* ─── MAIN APP ─── */
export default function App() {
  const [s, setS] = useState(DEFAULT_STATE);
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState("p1");
  const [tab, setTab] = useState("tasks");
  const [editSched, setEditSched] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});

  // 1. Listen for Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 2. Listen for Data (Firestore)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "roadmap", "mission_data"), (snapshot) => {
      if (snapshot.exists()) {
        setS(snapshot.data());
      } else {
        setS(DEFAULT_STATE);
      }
      setLoaded(true);
    });
    return () => unsub();
  }, []);

  // 3. Persist to Firestore
  const persist = useCallback(async (ns) => {
    if (!auth.currentUser) {
      alert("Unauthorized: You must be logged in to save changes.");
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, "roadmap", "mission_data"), ns);
    } catch (e) {
      console.error("Save failed", e);
      alert("Permission denied. Check Firestore rules.");
    }
    setSaving(false);
  }, []);

  // Auth Handlers
  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // Task Handlers
  const toggle = id => { 
    const n = { ...s, tasks: { ...s.tasks } }; 
    if (n.tasks[id]) delete n.tasks[id]; 
    else n.tasks[id] = new Date().toISOString(); 
    persist(n); 
  };
  
  const setSched = (id, d) => { persist({ ...s, schedule: { ...s.schedule, [id]: d } }); setEditSched(null); };
  const rmSched = id => { const sc = { ...s.schedule }; delete sc[id]; persist({ ...s, schedule: sc }); };
  const setNote = (id, v) => persist({ ...s, notes: { ...s.notes, [id]: v } });
  const setHrs = v => persist({ ...s, weeklyHours: Math.max(1, parseInt(v) || 1) });
  const setStart = v => persist({ ...s, startDate: v });

  // Calculations
  const doneCount = ALL_TASKS.filter(t => s.tasks[t.id]).length;
  const pct = Math.round((doneCount / ALL_TASKS.length) * 100) || 0;
  const pStats = PHASES.map(p => {
    const d = p.tasks.filter(t => s.tasks[t.id]).length;
    return { ...p, done: d, total: p.tasks.length, pct: Math.round((d / p.tasks.length) * 100) };
  });
  const upcoming = Object.entries(s.schedule || {})
    .filter(([id]) => !s.tasks[id])
    .map(([id, date]) => ({ id, date, task: ALL_TASKS.find(t => t.id === id), phase: PHASES.find(p => p.tasks.some(t => t.id === id)) }))
    .filter(u => u.task)
    .sort((a, b) => a.date.localeCompare(b.date));
  const cur = PHASES.find(p => p.id === phase);

  if (!loaded) return (
    <div style={{ padding: 80, textAlign: "center", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", background: "#0b0f19", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div>Initializing mission systems...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: "#e2e8f0", background: "#0b0f19", minHeight: "100vh", padding: "0 0 60px" }}>
      
      {/* HEADER */}
      <div style={{ background: "linear-gradient(180deg, rgba(56,189,248,0.06) 0%, transparent 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "28px 24px 20px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#38bdf8", marginBottom: 6, fontFamily: "monospace" }}>
                Mission Control — Radhey Patel
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                Roadmap to NASA
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saving && <span style={{ fontSize: 10, color: "#38bdf8", fontFamily: "monospace" }}>SYNCING...</span>}
              {!user ? (
                <button onClick={login} style={{ fontSize: 10, color: "#fff", background: "#38bdf8", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: 700 }}>LOGIN TO EDIT</button>
              ) : (
                <button onClick={logout} style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>LOGOUT ({user.email.split('@')[0]})</button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Global Progress</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", fontFamily: "monospace" }}>{pct}<span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>%</span></span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #38bdf8, #a78bfa)", width: `${pct}%`, borderRadius: 8, transition: "width 0.7s cubic-bezier(.22,1,.36,1)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", padding: "0 24px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", width: "100%" }}>
          {["tasks", "schedule", "dashboard"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontSize: 13, fontWeight: tab === t ? 700 : 400, padding: "12px 20px", background: "none", border: "none",
              borderBottom: tab === t ? "2px solid #38bdf8" : "2px solid transparent",
              color: tab === t ? "#38bdf8" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.2s", marginBottom: -1,
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>

          {/* TASKS TAB */}
          {tab === "tasks" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {PHASES.map(p => {
                const ps = pStats.find(x => x.id === p.id);
                const active = phase === p.id;
                return (
                  <button key={p.id} onClick={() => setPhase(p.id)} style={{
                    fontSize: 12, fontWeight: active ? 700 : 500, padding: "8px 18px", borderRadius: 10, cursor: "pointer",
                    border: `1.5px solid ${active ? p.accent : "rgba(255,255,255,0.08)"}`,
                    background: active ? p.accentSoft : "rgba(255,255,255,0.02)",
                    color: active ? p.accent : "rgba(255,255,255,0.4)", transition: "all 0.2s",
                  }}>
                    <span style={{ fontFamily: "monospace", marginRight: 6 }}>{ps.done}/{ps.total}</span>{p.title}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: cur.accent, boxShadow: `0 0 12px ${cur.accent}55` }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{cur.title}</h2>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20, paddingLeft: 22, fontFamily: "monospace" }}>{cur.timeline}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cur.tasks.map(task => {
                const isDone = !!s.tasks[task.id];
                const sched = s.schedule[task.id];
                const cat = CATS[task.category];
                const note = s.notes[task.id] || "";
                const noteOpen = expandedNotes[task.id];

                return (
                  <div key={task.id} style={{
                    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14,
                    borderLeft: `3px solid ${isDone ? cur.accent + "44" : cur.accent}`,
                    opacity: isDone ? 0.55 : 1, transition: "all 0.3s", overflow: "hidden",
                  }}>
                    <div style={{ padding: "16px 18px" }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <button disabled={!user} onClick={() => toggle(task.id)} style={{
                          width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 1, padding: 0, cursor: user ? "pointer" : "not-allowed",
                          border: `2px solid ${isDone ? cur.accent : "rgba(255,255,255,0.15)"}`,
                          background: isDone ? cur.accent : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                        }}>{isDone && <CheckIcon />}</button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", textDecoration: isDone ? "line-through" : "none" }}>{task.name}</span>
                            <Pill fg={cat.fg} bg={cat.bg} border={cat.border}>{cat.label}</Pill>
                          </div>

                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 10 }}>{task.desc}</div>

                          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                            {editSched === task.id ? (
                              <input type="date" onChange={e => setSched(task.id, e.target.value)} autoFocus style={{ fontSize: 11, background: "#1e293b", color: "#fff", border: "1px solid #38bdf8" }} />
                            ) : (
                              <button disabled={!user} onClick={() => setEditSched(task.id)} style={{ fontSize: 11, color: sched ? "#38bdf8" : "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: user ? "pointer" : "default" }}>
                                <CalIcon /> {sched || "Set date"}
                              </button>
                            )}
                            {task.link && <a href={task.link} target="_blank" rel="noopener" style={{ fontSize: 11, color: "#38bdf8", textDecoration: "none" }}><LinkIcon /> Resource</a>}
                            <button onClick={() => setExpandedNotes(p => ({ ...p, [task.id]: !p[task.id] }))} style={{ fontSize: 11, color: note ? "#a78bfa" : "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}>
                              {note ? "View Note" : "+ Note"}
                            </button>
                          </div>

                          {noteOpen && (
                            <textarea disabled={!user} value={note} onChange={e => setNote(task.id, e.target.value)} placeholder="Only the mission lead can edit notes..." rows={2}
                              style={{ width: "100%", marginTop: 10, fontSize: 12, padding: "10px", borderRadius: 8, background: "rgba(0,0,0,0.2)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)" }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}

          {/* SCHEDULE TAB */}
          {tab === "schedule" && (<>
            <div style={{ display: "flex", gap: 20, marginBottom: 28 }}>
              <div>
                <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>START DATE</label>
                <input disabled={!user} type="date" value={s.startDate} onChange={e => setStart(e.target.value)} style={{ background: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "5px", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>HOURS / WEEK</label>
                <input disabled={!user} type="number" value={s.weeklyHours} onChange={e => setHrs(e.target.value)} style={{ background: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "5px", borderRadius: "4px", width: "60px" }} />
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map(u => (
                <div key={u.id} style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{u.task.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.phase.badge}</div>
                  </div>
                  <div style={{ fontFamily: "monospace", color: "#38bdf8" }}>{u.date}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* DASHBOARD TAB */}
          {tab === "dashboard" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              <Stat label="Completed Tasks" value={doneCount} sub={`/ ${ALL_TASKS.length}`} />
              <Stat label="Total Progress" value={`${pct}%`} color="#34d399" />
              <Stat label="Active Phase" value={pStats.find(p => p.pct < 100)?.badge || "Done"} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}