import React, { useEffect, useLayoutEffect, useState } from "react";
import "./App.css";

/* ---------- images (remote; they load in your own project) ---------- */
const LOGO = "https://upload.wikimedia.org/wikipedia/en/b/b7/Western_Mindanao_State_University.png";
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
const IMG = {
  campus: U("photo-1523580494863-6f3031224c94"),
  volunteer: U("photo-1559027615-cd4628902d4a"),
  environment: U("photo-1518531933037-91b2f5f229cc"),
  education: U("photo-1509062522246-3755977927d7"),
};
const PHOTO = { "Community Service": IMG.volunteer, Environment: IMG.environment, Education: IMG.education, "Health and Wellness": IMG.campus };
const CATEGORIES = Object.keys(PHOTO);
const COLLEGES = ["College of Agriculture", "College of Architecture", "College of Asian and Islamic Studies", "College of Computing Studies", "College of Criminal Justice Education", "College of Engineering", "College of Forestry and Environmental Studies", "College of Home Economics", "College of Law", "College of Liberal Arts", "College of Medicine", "College of Nursing", "College of Public Administration and Development Studies", "College of Science and Mathematics", "College of Social Work and Community Development", "College of Sports Science and Physical Education", "College of Teacher Education"];
const seedOrganizations = [...COLLEGES.map((name) => ({ name, type: "College", status: "Active" })), { name: "Office of Student Affairs", type: "Office", status: "Active" }];
const DEMO_PW = "demo1234";

/* ---------- seed data ---------- */
const seedUsers = [
  { id: 1, role: "Super Admin", last: "Admin", first: "System", mi: "S", idno: "SA-0001", email: "superadmin@wmsu.edu.ph", college: "University Administration", pw: DEMO_PW, status: "Active" },
  { id: 2, role: "Admin", last: "Santos", first: "Maria", mi: "L", idno: "OFF-0001", email: "admin@wmsu.edu.ph", college: "Office of Student Affairs", orgType: "Office", pw: DEMO_PW, status: "Active" },
  { id: 3, role: "User", last: "Volunteer", first: "Student", mi: "", idno: "2026-00001", email: "student@wmsu.edu.ph", college: "College of Engineering", pw: DEMO_PW, status: "Active" },
  { id: 4, role: "User", last: "Reyes", first: "Juan", mi: "D", idno: "2026-00002", email: "juan.reyes@wmsu.edu.ph", college: "College of Nursing", pw: DEMO_PW, status: "Active" },
  { id: 5, role: "Admin", last: "Admin", first: "Engineering", mi: "", idno: "OFF-0002", email: "engineeringadmin@wmsu.edu.ph", college: "College of Engineering", orgType: "College", pw: DEMO_PW, status: "Active" },
];
const seedActs = [
  { id: 1, title: "Campus Community Outreach", desc: "Distribute school supplies and hygiene kits to partner barangays around Zamboanga City.", category: "Community Service", date: "2026-11-08", time: "08:00", endTime: "12:00", location: "WMSU Main Campus", hours: 4, slots: 30, status: "Open", by: 2, colleges: [...COLLEGES] },
  { id: 2, title: "Green Campus Initiative", desc: "Tree planting and campus clean-up to keep WMSU green.", category: "Environment", date: "2026-11-15", time: "07:30", endTime: "10:30", location: "WMSU Main Campus", hours: 3, slots: 25, status: "Open", by: 2, colleges: [...COLLEGES] },
  { id: 3, title: "Learning Support Program", desc: "Tutor public elementary learners in reading and mathematics.", category: "Education", date: "2026-11-22", time: "13:00", endTime: "18:00", location: "Zamboanga City", hours: 5, slots: 20, status: "Pending", by: 2, colleges: [...COLLEGES] },
  { id: 4, title: "Coastal Clean-up Drive", desc: "Shoreline clean-up and waste segregation awareness.", category: "Environment", date: "2026-10-18", time: "06:30", endTime: "10:30", location: "Paseo del Mar", hours: 4, slots: 40, status: "Completed", by: 2, colleges: [...COLLEGES] },
];
const seedEnr = [
  { id: 1, actId: 4, userId: 3, status: "Accepted", attended: true, hours: 4, logDate: "2026-10-18", verified: true },
  { id: 2, actId: 1, userId: 3, status: "Pending", attended: false, hours: 0 },
  { id: 3, actId: 1, userId: 4, status: "Accepted", attended: false, hours: 0 },
];

/* ---------- helpers ---------- */
function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; } catch { return initial; }
  });
  useEffect(() => {
    const syncFromOtherTab = (event) => {
      if (event.key !== key) return;
      try { setValue(event.newValue === null ? initial : JSON.parse(event.newValue)); } catch { setValue(initial); }
    };
    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, [key, initial]);
  const set = (next) => { setValue(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ } };
  return [value, set];
}
const nid = (list) => Math.max(0, ...list.map((x) => x.id)) + 1;
const fullName = (u) => `${u.first} ${u.mi ? u.mi.toUpperCase() + ". " : ""}${u.last}`;
const initials = (u) => (u.first[0] + u.last[0]).toUpperCase();
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
const fmtTime = (t) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
const timeRange = (a) => (a.time ? (a.endTime ? `${fmtTime(a.time)} – ${fmtTime(a.endTime)}` : fmtTime(a.time)) : "");
const calcHours = (s, e) => { if (!s || !e) return 0; const [h1, m1] = s.split(":").map(Number), [h2, m2] = e.split(":").map(Number); const mins = h2 * 60 + m2 - (h1 * 60 + m1); return mins > 0 ? Math.max(0.5, Math.round(mins / 30) / 2) : 0; };
function compressActivityImage(file) {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, 1100 / image.width, 850 / image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not process that image.");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.72);
        if (compressed.length > 700_000) throw new Error("That image is still too large after compression. Choose a smaller image.");
        resolve(compressed);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(source);
      }
    };
    image.onerror = () => { URL.revokeObjectURL(source); reject(new Error("That image could not be opened.")); };
    image.src = source;
  });
}
const hasActivityEnded = (a, now = new Date()) => {
  if (!a?.date || !a.time || !a.endTime) return false;
  return now >= new Date(`${a.date}T${a.endTime}`);
};
const activityStatus = (a, now = new Date()) => a && ["Open", "Ongoing"].includes(a.status) && hasActivityEnded(a, now) ? "Completed" : a?.status;
const BCLS = { Open: "ok", Accepted: "ok", Completed: "ok", Verified: "ok", Ongoing: "gold", Pending: "gold", Logged: "gold", Rejected: "no", Declined: "no" };
const Badge = ({ s }) => <span className={`bd ${BCLS[s] || ""}`}>{s}</span>;
const accepted = (enr, a) => enr.filter((e) => e.actId === a.id && e.status === "Accepted").length;
const hoursOf = (enr, uid) => enr.filter((e) => e.userId === uid && e.attended).reduce((s, e) => s + Number(e.hours || 0), 0);
const collegeHasActiveAdmin = (college, users, organizations) =>
  organizations.some((org) => org.name === college && org.type === "College" && org.status === "Active") &&
  users.some((user) => user.role === "Admin" && user.status === "Active" && user.college === college);
const studentHasActiveCollegeAdmin = (student, users, organizations) => collegeHasActiveAdmin(student.college, users, organizations);

function Logo({ big }) {
  const [bad, setBad] = useState(false);
  if (bad) return <div className="mark">W</div>;
  return <img className={`logo ${big ? "big" : ""}`} src={LOGO} alt="WMSU logo" onError={() => setBad(true)} />;
}
function ThemeToggle({ theme, setTheme }) {
  const next = theme === "dark" ? "light" : "dark";
  return <button type="button" className="theme-toggle" onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`}>{theme === "dark" ? "☀ Light" : "☾ Dark"}</button>;
}
function ActivityDetails({ activity, users, enrollments, organizations, status, close }) {
  if (!activity) return null;
  const coordinator = users.find((u) => u.id === activity.by);
  const participants = enrollments.filter((e) => e.actId === activity.id && e.status === "Accepted");
  const configuredColleges = organizations.filter((org) => collegeHasActiveAdmin(org.name, users, organizations)).map((org) => org.name);
  const activityColleges = (activity.colleges?.length ? activity.colleges : configuredColleges).filter((name) => configuredColleges.includes(name));
  const colleges = [...new Set([...(configuredColleges.includes(coordinator?.college) ? [coordinator.college] : []), ...activityColleges])];
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section className="card activity-modal" role="dialog" aria-modal="true" aria-labelledby="activity-details-title">
        <div className="ph"><div><span className="eb">ACTIVITY DETAILS</span><h2 id="activity-details-title">{activity.title}</h2></div><button type="button" className="tb bad" onClick={close}>Close</button></div>
        <div className="activity-detail-image" style={{ backgroundImage: `url(${activity.image || PHOTO[activity.category] || IMG.campus})` }} role="img" aria-label={`${activity.title} event photo`} />
        <p className="modal-description">{activity.desc}</p>
        <div className="detail-grid">
          <span><b>Status</b><Badge s={status || activity.status} /></span>
          <span><b>Coordinator</b>{coordinator ? fullName(coordinator) : "Not available"}</span>
          <span><b>Office</b>{coordinator?.college || "Not available"}</span>
          <span><b>Email</b>{coordinator?.email || "Not available"}</span>
          <span><b>Schedule</b>{fmtDate(activity.date)} · {timeRange(activity)}</span>
          <span><b>Location</b>{activity.location}</span>
          <span><b>Capacity</b>{participants.length} / {activity.slots} slots filled ({Math.max(activity.slots - participants.length, 0)} available)</span>
          <span className="w"><b>Eligible colleges</b>{configuredColleges.length > 0 && colleges.length === configuredColleges.length ? "All colleges" : colleges.join(", ") || "No active colleges selected"}</span>
        </div>
        <div className="tw participant-table"><table><thead><tr><th>PARTICIPANT</th><th>COLLEGE</th><th>ATTENDANCE</th><th>HOURS</th></tr></thead><tbody>
          {participants.map((e) => {
            const student = users.find((u) => u.id === e.userId);
            if (!student) return null;
            return <tr key={e.id}><td><strong>{fullName(student)}</strong><small>{student.idno}</small></td><td>{student.college}</td><td>{e.verified ? "Verified" : e.attended ? "Awaiting review" : "Not logged"}</td><td>{e.attended ? `${e.hours} / ${activity.hours} h` : "—"}</td></tr>;
          })}
          {!participants.length && <Empty cols={4} text="No approved participants yet." />}
        </tbody></table></div>
      </section>
    </div>
  );
}
function Stat({ label, value, detail, icon }) {
  return (
    <article className="card stat">
      <div className="st"><span>{label}</span><span className="si">{icon}</span></div>
      <div className="sv">{value}</div><div className="sd">{detail}</div>
    </article>
  );
}
function Gallery() {
  const t = [["Campus life", IMG.campus], ["Community outreach", IMG.volunteer], ["Green initiatives", IMG.environment], ["Education for all", IMG.education]];
  return <section className="gallery noprint">{t.map(([n, i]) => <div key={n} className="gal" style={{ backgroundImage: `url(${i})` }}><span>{n}</span></div>)}</section>;
}
function Hero({ title, text, children }) {
  return (
    <section className="hero photo">
      <Logo big />
      <span className="kick">✦ COMMUNITY • SERVICE • EXCELLENCE</span>
      <h2>{title}</h2><p>{text}</p>{children}
    </section>
  );
}
function Panel({ eyebrow, title, sub, action, children }) {
  return (
    <section className="card panel">
      <div className="ph"><div><span className="eb">{eyebrow}</span><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{action}</div>
      {children}
    </section>
  );
}
const Empty = ({ cols, text }) => <tr><td colSpan={cols} className="empty">{text}</td></tr>;

/* ---------- certificate (canvas -> PDF / print) ---------- */
const loadImg = (src) => new Promise((res) => {
  const i = new Image(); i.crossOrigin = "anonymous";
  i.onload = () => res(i); i.onerror = () => res(null); i.src = src; setTimeout(() => res(null), 4000);
});
function wrapText(ctx, text, maxWidth) {
  const lines = []; let line = "";
  text.split(" ").forEach((w) => { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line); return lines;
}
async function drawCertificate(name, college, heading, body) {
  const W = 1600, H = 1131, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#fffdfd"; x.fillRect(0, 0, W, H);
  x.strokeStyle = "#B5122B"; x.lineWidth = 8; x.strokeRect(40, 40, W - 80, H - 80);
  x.strokeStyle = "#e9bdc6"; x.lineWidth = 2; x.strokeRect(64, 64, W - 128, H - 128);
  x.save(); x.translate(W / 2, H / 2); x.rotate(-Math.PI / 12); x.fillStyle = "rgba(121,9,27,.05)";
  x.font = "900 400px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("WMSU", 0, 0); x.restore();
  x.textAlign = "center"; x.textBaseline = "alphabetic";
  const logo = await loadImg(LOGO);
  if (logo) x.drawImage(logo, W / 2 - 62, 110, 124, 124);
  else { x.fillStyle = "#B5122B"; x.beginPath(); x.arc(W / 2, 172, 52, 0, Math.PI * 2); x.fill(); x.fillStyle = "#fff"; x.font = "bold 50px Georgia"; x.fillText("W", W / 2, 190); }
  x.fillStyle = "#B5122B"; x.font = "800 24px sans-serif"; x.letterSpacing = "5px"; x.fillText("WESTERN MINDANAO STATE UNIVERSITY", W / 2, 300); x.letterSpacing = "0px";
  x.fillStyle = "#79091B"; x.font = "bold 80px Georgia, serif"; x.fillText(heading, W / 2, 408);
  x.fillStyle = "#776A6E"; x.font = "28px sans-serif"; x.fillText("Presented to", W / 2, 490);
  x.fillStyle = "#20151A"; x.font = "italic 70px Georgia, serif"; x.fillText(name, W / 2, 580);
  x.strokeStyle = "#bda6ab"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(W / 2 - 380, 610); x.lineTo(W / 2 + 380, 610); x.stroke();
  x.fillStyle = "#776A6E"; x.font = "28px sans-serif"; x.fillText(college, W / 2, 665);
  wrapText(x, body, 900).forEach((l, i) => x.fillText(l, W / 2, 745 + i * 46));
  x.fillText("Issued on " + new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }), W / 2, 890);
  x.strokeStyle = "#bda6ab"; x.beginPath(); x.moveTo(W / 2 - 190, 975); x.lineTo(W / 2 + 190, 975); x.stroke();
  x.fillStyle = "#20151A"; x.font = "22px sans-serif"; x.fillText("Authorized Signature", W / 2, 1010);
  return c;
}
function pdfFromCanvas(canvas) {
  const jpg = Uint8Array.from(atob(canvas.toDataURL("image/jpeg", 0.95).split(",")[1]), (ch) => ch.charCodeAt(0));
  const enc = new TextEncoder(), parts = [], off = []; let len = 0;
  const push = (d) => { const b = typeof d === "string" ? enc.encode(d) : d; parts.push(b); len += b.length; };
  const obj = (n, body) => { off[n] = len; push(`${n} 0 obj\n${body}\nendobj\n`); };
  push("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
  off[4] = len;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);
  push(jpg); push("\nendstream\nendobj\n");
  const content = "q 842 0 0 595 0 0 cm /Im0 Do Q";
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const xref = len;
  push("xref\n0 6\n0000000000 65535 f \n" + [1, 2, 3, 4, 5].map((n) => String(off[n]).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: "application/pdf" });
}
function saveBlob(blob, filename) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------- sign in / create account ---------- */
function AuthScreen({ d }) {
  const { users, setUsers, setMeId } = d;
  const studentColleges = d.organizations.filter((org) => collegeHasActiveAdmin(org.name, users, d.organizations)).map((org) => org.name);
  const [tab, setTab] = useState("login");
  const [error, setError] = useState("");
  const isLogin = tab === "login";

  function login(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const u = users.find((x) => x.email.toLowerCase() === f.email.trim().toLowerCase());
    if (!u) return setError("No account uses that email. Check the address or ask the Super Admin to confirm the account.");
    if (u.pw !== f.pw) return setError("That password does not match this account. Passwords are case-sensitive.");
    if (u.status !== "Active") return setError("This account is inactive. Please contact the Super Admin.");
    if (u.role === "User" && !studentHasActiveCollegeAdmin(u, users, d.organizations)) return setError("Your college currently has no active Admin account, so student sign-in is disabled. Contact the Super Admin.");
    setMeId(u.id);
  }
  function register(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const email = f.email.trim().toLowerCase(), idno = f.idno.trim();
    if (!/^[^\s@]+@wmsu\.edu\.ph$/.test(email)) return setError("Please use your WMSU email (name@wmsu.edu.ph).");
    if (!studentColleges.includes(f.college)) return setError("Your college needs an active Admin account before student sign-up is available.");
    if (f.pw !== f.pw2) return setError("Passwords do not match.");
    if (users.some((x) => x.email.toLowerCase() === email)) return setError("An account with this email already exists.");
    if (users.some((x) => x.idno.toLowerCase() === idno.toLowerCase())) return setError("An account with this ID number already exists.");
    const n = { id: nid(users), role: "User", last: f.last.trim(), first: f.first.trim(), mi: f.mi.trim().replace(/\./g, ""), idno, email, college: f.college, pw: f.pw, status: "Active" };
    setUsers([...users, n]); setMeId(n.id);
  }

  return (
    <div className="auth">
      <section className="auth-art photo">
        <div className="brand"><Logo /><div><b>WMSU IMPACT</b><small>Western Mindanao State University · Zamboanga City</small></div></div>
        <ThemeToggle theme={d.theme} setTheme={d.setTheme} />
        <div>
          <span className="kick">✦ COMMUNITY • SERVICE • EXCELLENCE</span>
          <h1>Serve. Log hours.<br />Make an impact.</h1>
          <p>WMSU IMPACT connects students with meaningful campus and community service. Discover opportunities, coordinate with activity organizers, and build a verified record of service.</p>
          <div className="landing-points"><span>Discover approved opportunities</span><span>Track service hours and attendance</span><span>Earn certificates after verified completion</span></div>
        </div>
        <div className="landing-gallery" aria-label="Campus and community service photos">
          {[[IMG.campus, "Campus life"], [IMG.volunteer, "Community outreach"], [IMG.environment, "Green initiatives"]].map(([image, label]) => <div key={label} style={{ backgroundImage: `url(${image})` }} aria-label={label} />)}
        </div>
        <small style={{ opacity: 0.75, position: "relative", zIndex: 1 }}>A Smart Research University by 2040</small>
      </section>
      <section className="auth-side">
        <div className="card auth-box">
          <div className="tabs">
            <button type="button" className={isLogin ? "on" : ""} onClick={() => { setTab("login"); setError(""); }}>Log in</button>
            <button type="button" className={!isLogin ? "on" : ""} onClick={() => { setTab("register"); setError(""); }}>Student sign-up</button>
          </div>
          {isLogin ? (
            <>
              <h2>Welcome back</h2>
              <p className="sub">Log in with your WMSU email. Your portal (Super Admin, Admin or Student) opens automatically.</p>
              <form className="f" onSubmit={login}>
                <label className="w">WMSU email<input name="email" type="email" placeholder="name@wmsu.edu.ph" autoComplete="username" required /></label>
                <label className="w">Password<input name="pw" type="password" autoComplete="current-password" required /></label>
                {error && <div className="err">{error}</div>}
                <button className="btn full" style={{ gridColumn: "1 / -1" }}>Log in</button>
              </form>
              <div className="hint"><b>Demo accounts</b> (password <code>{DEMO_PW}</code>)<br /><span>Super Admin:</span> <code>superadmin@wmsu.edu.ph</code><br /><span>Admin · Office of Student Affairs:</span> <code>admin@wmsu.edu.ph</code><br /><span>Admin · College of Engineering:</span> <code>engineeringadmin@wmsu.edu.ph</code><br /><span>Student · College of Engineering:</span> <code>student@wmsu.edu.ph</code></div>
            </>
          ) : (
            <>
              <h2>Create your student account</h2>
              <p className="sub">All student accounts open the Student Portal. Choose your college to see its activities and activities from colleges that invite you. A college appears here after the Super Admin assigns it an active Admin.</p>
              <form className="f" onSubmit={register}>
                <label>Last name<input name="last" required /></label>
                <label>First name<input name="first" required /></label>
                <label>Middle initial <span className="opt">(optional)</span><input name="mi" maxLength={2} /></label>
                <label>ID number<input name="idno" required placeholder="e.g. 2026-00123" /></label>
                <label className="w">WMSU email<input name="email" type="email" required placeholder="name@wmsu.edu.ph" /></label>
                <label className="w">College<select name="college" defaultValue="" required disabled={!studentColleges.length}><option value="">{studentColleges.length ? "Select your college" : "No colleges have an active Admin yet"}</option>{studentColleges.map((c) => <option key={c}>{c}</option>)}</select></label>
                <label>Password<input name="pw" type="password" minLength={8} required /></label>
                <label>Confirm password<input name="pw2" type="password" minLength={8} required /></label>
                {error && <div className="err">{error}</div>}
                <button className="btn full" style={{ gridColumn: "1 / -1" }}>Create account</button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- sidebar shell (Super Admin + Admin) ---------- */
function Shell({ d, nav, page, setPage, children }) {
  const u = d.me, sa = u.role === "Super Admin";
  return (
    <div className="app">
      <aside className={`side ${sa ? "sa" : ""}`}>
        <button type="button" className="brand brand-link" aria-label="Go to dashboard" onClick={() => setPage(sa ? "Overview" : "Dashboard")}><Logo /><span><b>WMSU IMPACT</b><small>{u.role} Portal</small></span></button>
        <button type="button" className="prof profile-link" title="Open my profile" onClick={() => setPage("My Profile")}><span className="av">{initials(u)}</span><span><b>{fullName(u)}</b><small>{u.college}</small></span></button>
        <nav className="nav"><span className="nh">WORKSPACE</span>
          {nav.map(([label, icon, count]) => (
            <button key={label} type="button" className={`ni ${page === label ? "on" : ""}`} onClick={() => setPage(label)}>
              <span>{icon}</span>{label}{count > 0 && <em>{count}</em>}
            </button>
          ))}
        </nav>
        <div className="sb">
          <div className="sidepic" style={{ backgroundImage: `url(${IMG.campus})` }}><b>Make an impact</b><small>Every activity is a step toward a stronger community.</small></div>
          <button type="button" className="btn out sm full" style={{ marginTop: 12 }} onClick={d.logout}>Log out</button>
        </div>
      </aside>
      <main className="main">
        <header className="top"><div><div className="bc">WMSU IMPACT / {u.role} / {page}</div><h1>{page}</h1></div><div className="tr"><ThemeToggle theme={d.theme} setTheme={d.setTheme} /><button type="button" className="av avbtn" title="Open my profile" aria-label="Open my profile" onClick={() => setPage("My Profile")}>{initials(u)}</button></div></header>
        {children}
        <footer className="foot"><span>WMSU IMPACT</span><span>Western Mindanao State University · {new Date().getFullYear()}</span></footer>
      </main>
    </div>
  );
}

/* ---------- profile (all roles) ---------- */
function Profile({ d }) {
  const { me, users, setUsers, flash } = d;
  function changePw(e) {
    e.preventDefault();
    const p = Object.fromEntries(new FormData(e.target));
    if (p.cur !== me.pw) return flash("Current password is incorrect.", true);
    if (p.next.length < 8) return flash("New password must be at least 8 characters.", true);
    if (p.next !== p.next2) return flash("New passwords do not match.", true);
    setUsers(users.map((u) => (u.id === me.id ? { ...u, pw: p.next } : u)));
    e.target.reset(); flash("Password changed.");
  }
  return (
    <>
      <section className="card pcard">
        <div className="pbanner" style={{ backgroundImage: `linear-gradient(120deg,rgba(77,6,18,.85),rgba(181,18,43,.45)),url(${IMG.campus})` }} />
        <div className="pbody">
          <div className="av lg">{initials(me)}</div>
          <div className="pname"><h2>{fullName(me)}</h2><span className={`bd ${me.role === "Super Admin" ? "gold" : "ok"}`}>{me.role}</span></div>
          <div className="pinfo"><span>🎓 {me.college}</span><span>✉ {me.email}</span><span>🪪 {me.idno}</span>{me.phone && <span>☎ {me.phone}</span>}</div>
        </div>
      </section>
      <div className="two eq">
        <Panel eyebrow="MY PROFILE" title="Personal details" sub="Your account details are read-only. Contact your administrator if something needs to be corrected.">
          <dl className="profile-details">
            <div><dt>Full name</dt><dd>{fullName(me)}</dd></div>
            <div><dt>Role</dt><dd>{me.role}</dd></div>
            <div><dt>ID number</dt><dd>{me.idno}</dd></div>
            <div><dt>WMSU email</dt><dd>{me.email}</dd></div>
            <div className="w"><dt>{me.role === "User" ? "College" : "Office / department"}</dt><dd>{me.college}</dd></div>
            {me.phone && <div className="w"><dt>Contact number</dt><dd>{me.phone}</dd></div>}
          </dl>
        </Panel>
        <Panel eyebrow="SECURITY" title="Change password">
          <form className="form" onSubmit={changePw}>
            <label className="w">Current password<input name="cur" type="password" required autoComplete="current-password" /></label>
            <label>New password<input name="next" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label>Confirm new password<input name="next2" type="password" minLength={8} required autoComplete="new-password" /></label>
            <button className="btn sm" type="submit">Update password</button>
          </form>
        </Panel>
      </div>
    </>
  );
}

/* ================= SUPER ADMIN ================= */
function SuperAdminApp({ d, start }) {
  const { users, setUsers, acts, setActs, enr, flash, organizations, setOrganizations } = d;
  const [page, setPage] = useState(start || "Overview");
  const admins = users.filter((u) => u.role === "Admin"), students = users.filter((u) => u.role === "User");
  const pending = acts.filter((a) => a.status === "Pending");
  const owner = (a) => users.find((u) => u.id === a.by);
  const totalHours = enr.filter((e) => e.attended).reduce((s, e) => s + Number(e.hours || 0), 0);

  function decide(id, status) {
    setActs(acts.map((a) => (a.id === id ? { ...a, status } : a)));
    flash(status === "Open" ? "Activity approved and published to students." : "Activity request rejected.", status !== "Open");
  }
  function addAdmin(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)); const email = f.email.trim().toLowerCase();
    const organization = organizations.find((org) => org.name === f.organization && org.status === "Active");
    if (!organization) return flash("Choose an active college or office from the organization list.", true);
    if (!/^[^\s@]+@wmsu\.edu\.ph$/.test(email)) return flash("Use a WMSU email (name@wmsu.edu.ph).", true);
    if (f.pw !== f.pw2) return flash("The initial passwords do not match.", true);
    if (users.some((u) => u.email.toLowerCase() === email)) return flash("An account with this email already exists.", true);
    setUsers([...users, { id: nid(users), role: "Admin", last: f.last.trim(), first: f.first.trim(), mi: f.mi.trim().replace(/\./g, ""), idno: "OFF-" + String(nid(users)).padStart(4, "0"), email, college: organization.name, orgType: organization.type, pw: f.pw, status: "Active" }]);
    e.target.reset(); flash(`Admin account created for ${organization.name}. They sign in with the WMSU email and password you set.`);
  }
  function addOrganization(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const name = f.name.trim();
    if (!name) return flash("Enter a college or office name.", true);
    if (organizations.some((org) => org.name.toLowerCase() === name.toLowerCase())) return flash("That college or office already exists.", true);
    setOrganizations([...organizations, { name, type: f.type, status: "Active" }]);
    e.target.reset();
    flash(`${f.type} added. You can now assign an Admin account to it.`);
  }
  function toggleOrganization(name) {
    setOrganizations(organizations.map((org) => org.name === name ? { ...org, status: org.status === "Active" ? "Inactive" : "Active" } : org));
    flash("Organization status updated.");
  }
  function toggle(id) {
    const account = users.find((u) => u.id === id);
    if (!account) return;
    const nextStatus = account.status === "Active" ? "Inactive" : "Active";
    setUsers(users.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)));
    const isCollegeAdmin = organizations.some((org) => org.name === account.college && org.type === "College");
    if (account.role === "Admin" && nextStatus === "Inactive" && isCollegeAdmin && !users.some((u) => u.id !== id && u.role === "Admin" && u.status === "Active" && u.college === account.college)) {
      flash(`Admin deactivated. Students in ${account.college} can’t sign in until an active Admin is assigned.`);
    } else flash("Account status updated.");
  }
  function deleteAdmin(id) {
    const account = users.find((u) => u.id === id && u.role === "Admin");
    if (!account) return;
    if (!window.confirm(`Permanently delete ${fullName(account)} (${account.email})? This removes the Admin account.`)) return;
    setUsers(users.filter((u) => u.id !== id));
    const anotherActiveAdmin = users.some((u) => u.id !== id && u.role === "Admin" && u.status === "Active" && u.college === account.college);
    const isCollegeAdmin = organizations.some((org) => org.name === account.college && org.type === "College");
    if (isCollegeAdmin && !anotherActiveAdmin) flash(`Admin deleted. Students in ${account.college} can’t sign in until an active Admin is assigned.`);
    else flash("Admin account permanently deleted.");
  }

  const Pending = ({ list }) => (
    <div className="tw"><table><thead><tr><th>ACTIVITY</th><th>REQUESTED BY</th><th>SCHEDULE</th><th>HOURS / SLOTS</th><th>DECISION</th></tr></thead><tbody>
      {list.map((a) => (
        <tr key={a.id}><td><strong>{a.title}</strong><small>{a.category}</small></td><td>{owner(a) ? fullName(owner(a)) : "—"}<small>{owner(a)?.college}</small></td><td>{fmtDate(a.date)} · {timeRange(a)}<small>{a.location}</small></td><td>{a.hours} h<small>{a.slots} slots</small></td>
          <td><button type="button" className="tb" onClick={() => decide(a.id, "Open")}>✓ Approve</button><button type="button" className="tb bad" onClick={() => decide(a.id, "Rejected")}>✕ Reject</button></td></tr>
      ))}
      {list.length === 0 && <Empty cols={5} text="No pending requests. You’re all caught up." />}
    </tbody></table></div>
  );

  return (
    <Shell d={d} page={page} setPage={setPage} nav={[["Overview", "▦"], ["Approvals", "✓", pending.length], ["Colleges & Offices", "⌂"], ["Admin Accounts", "♙"], ["Monitoring", "◉"], ["Students", "♧"], ["My Profile", "☺"]]}>
      {page === "Overview" && (
        <>
          <Hero title="Oversee every service, everywhere." text="Review activity requests from campus offices, create Admin accounts, and monitor volunteer engagement across WMSU." />
          <section className="stats">
            <Stat label="Pending approvals" value={pending.length} detail="Activity requests to review" icon="✓" />
            <Stat label="Admin accounts" value={admins.length} detail="Campus offices" icon="♙" />
            <Stat label="Students" value={students.length} detail="Registered volunteers" icon="♧" />
            <Stat label="Logged hours" value={totalHours} detail="Across all activities" icon="◷" />
          </section>
          <Gallery />
          <div className="two">
            <Panel eyebrow="NEEDS YOUR ATTENTION" title="Awaiting approval" action={<button type="button" className="btn out sm" onClick={() => setPage("Approvals")}>Open approvals →</button>}>
              <Pending list={pending.slice(0, 3)} />
            </Panel>
            <Panel eyebrow="ACTIVITY STATUS" title="Programs at a glance">
              <div className="bars">
                {["Open", "Ongoing", "Completed", "Pending", "Rejected"].map((s) => {
                  const n = acts.filter((a) => a.status === s).length;
                  return <div key={s}><div className="row"><span>{s}</span><b>{n}</b></div><div className="bar"><i style={{ width: `${acts.length ? (n / acts.length) * 100 : 0}%` }} /></div></div>;
                })}
              </div>
            </Panel>
          </div>
        </>
      )}
      {page === "Approvals" && <Panel eyebrow="REVIEW QUEUE" title="Activity requests" sub="Approved activities are published so students can enroll."><Pending list={pending} /></Panel>}
      {page === "Colleges & Offices" && (
        <Panel eyebrow="ORGANIZATION DIRECTORY" title="Colleges and offices" sub="Manage the organizations students can join and assign activity admins to. A college is available for student sign-up after it has an active Admin account.">
          <form className="form" onSubmit={addOrganization}>
            <label className="w">College or office name<input name="name" required placeholder="e.g. College of Nursing" /></label>
            <label>Organization type<select name="type" defaultValue="College"><option>College</option><option>Office</option></select></label>
            <button className="btn sm" type="submit">＋ Add organization</button>
          </form>
          <div className="tw"><table><thead><tr><th>ORGANIZATION</th><th>TYPE</th><th>ADMIN ACCOUNTS</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
            {organizations.map((org) => <tr key={org.name}><td><strong>{org.name}</strong></td><td>{org.type}</td><td>{admins.filter((u) => u.college === org.name && u.status === "Active").length}</td><td><Badge s={org.status === "Active" ? "Open" : "Rejected"} /></td><td><button type="button" className="tb" onClick={() => toggleOrganization(org.name)}>{org.status === "Active" ? "Deactivate" : "Activate"}</button></td></tr>)}
            {!organizations.length && <Empty cols={5} text="No colleges or offices have been added." />}
          </tbody></table></div>
        </Panel>
      )}
      {page === "Admin Accounts" && (
        <Panel eyebrow="SUPER ADMIN CONSOLE" title="Admin accounts" sub="Assign each admin account to a college or office. Deactivate to suspend an account or delete it permanently. Students in a college can sign in only while that college has an active Admin.">
          <form className="form" onSubmit={addAdmin}>
            <label>Last name<input name="last" required /></label>
            <label>First name<input name="first" required /></label>
            <label>Middle initial (optional)<input name="mi" maxLength={2} /></label>
            <label className="w">Assigned college or office<select name="organization" defaultValue="" required><option value="">Select an organization</option>{organizations.filter((org) => org.status === "Active").map((org) => <option key={org.name} value={org.name}>{org.name} · {org.type}</option>)}</select></label>
            <label>WMSU email<input name="email" type="email" required placeholder="office@wmsu.edu.ph" /></label>
            <label>Initial password<input name="pw" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label>Confirm initial password<input name="pw2" type="password" minLength={8} required autoComplete="new-password" /></label>
            <button className="btn sm" type="submit">＋ Create Admin</button>
          </form>
          <div className="tw"><table><thead><tr><th>ADMIN</th><th>COLLEGE / OFFICE</th><th>ACTIVITIES</th><th>STATUS</th><th>ACCOUNT ACTIONS</th></tr></thead><tbody>
            {admins.map((u) => <tr key={u.id}><td><strong>{fullName(u)}</strong><small>{u.email}</small></td><td>{u.college}</td><td>{acts.filter((a) => a.by === u.id).length}</td><td><Badge s={u.status === "Active" ? "Open" : "Rejected"} /></td><td><button type="button" className="tb" onClick={() => toggle(u.id)}>{u.status === "Active" ? "Deactivate" : "Activate"}</button><button type="button" className="tb bad" onClick={() => deleteAdmin(u.id)}>Delete</button></td></tr>)}
            {admins.length === 0 && <Empty cols={5} text="No admin accounts yet." />}
          </tbody></table></div>
        </Panel>
      )}
      {page === "Monitoring" && (
        <Panel eyebrow="LIVE MONITORING" title="All volunteer activities" sub="Track status, enrollment and attendance for every office.">
          <div className="tw"><table><thead><tr><th>ACTIVITY</th><th>OFFICE</th><th>DATE</th><th>ENROLLED</th><th>REQUESTS</th><th>ATTENDED</th><th>STATUS</th></tr></thead><tbody>
            {acts.map((a) => <tr key={a.id}><td><strong>{a.title}</strong><small>{a.category}</small></td><td>{owner(a)?.college}</td><td>{fmtDate(a.date)}</td><td>{accepted(enr, a)} / {a.slots}</td><td>{enr.filter((e) => e.actId === a.id && e.status === "Pending").length}</td><td>{enr.filter((e) => e.actId === a.id && e.attended).length}</td><td><Badge s={a.status} /></td></tr>)}
          </tbody></table></div>
        </Panel>
      )}
      {page === "Students" && (
        <Panel eyebrow="VOLUNTEER REGISTRY" title="Students" sub="Verified volunteer hours per student.">
          <div className="tw"><table><thead><tr><th>STUDENT</th><th>ID NUMBER</th><th>COLLEGE</th><th>ACTIVITIES</th><th>HOURS</th><th>ACCOUNT</th></tr></thead><tbody>
            {students.map((u) => <tr key={u.id}><td><strong>{fullName(u)}</strong><small>{u.email}</small></td><td>{u.idno}</td><td>{u.college}</td><td>{enr.filter((e) => e.userId === u.id && e.status === "Accepted").length}</td><td><b>{hoursOf(enr, u.id)}</b></td><td><button type="button" className="tb" onClick={() => toggle(u.id)}>{u.status === "Active" ? "Deactivate" : "Activate"}</button></td></tr>)}
            {students.length === 0 && <Empty cols={6} text="No students registered yet." />}
          </tbody></table></div>
        </Panel>
      )}
      {page === "My Profile" && <Profile d={d} />}
    </Shell>
  );
}

/* ================= ADMIN ================= */
const blank = { title: "", desc: "", category: CATEGORIES[0], date: "", time: "", endTime: "", location: "", hours: 3, slots: 20, colleges: [...COLLEGES], image: "" };
function AdminApp({ d, start }) {
  const { users, acts, setActs, enr, setEnr, flash, me, organizations } = d;
  const [page, setPage] = useState(start || "Dashboard");
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [q, setQ] = useState(""); const [sf, setSf] = useState("All");
  const [clockNow, setClockNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const statusOf = (activity) => activityStatus(activity, clockNow);
  useEffect(() => {
    const endedIds = new Set(acts.filter((activity) => activity.by === me.id && ["Open", "Ongoing"].includes(activity.status) && hasActivityEnded(activity, clockNow)).map((activity) => activity.id));
    if (endedIds.size) setActs(acts.map((activity) => endedIds.has(activity.id) ? { ...activity, status: "Completed" } : activity));
  }, [acts, clockNow, me.id, setActs]);
  const collegeOptions = organizations.filter((org) => collegeHasActiveAdmin(org.name, users, organizations)).map((org) => org.name);
  const assignedCollege = collegeOptions.includes(me.college) ? me.college : "";
  const mine = acts.filter((a) => a.by === me.id);
  const myEnr = enr.filter((e) => mine.some((a) => a.id === e.actId));
  const reqs = myEnr.filter((e) => e.status === "Pending");
  const stu = (id) => users.find((u) => u.id === id);
  const act = (id) => acts.find((a) => a.id === id);
  const shown = mine.filter((a) => (sf === "All" || statusOf(a) === sf) && [a.title, a.category, a.location].some((f) => f.toLowerCase().includes(q.trim().toLowerCase())));
  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleCollege = (college) => setForm({ ...form, colleges: form.colleges.includes(college) ? form.colleges.filter((c) => c !== college) : [...form.colleges, college] });
  const setTime = (k) => (e) => { const next = { ...form, [k]: e.target.value }; const h = calcHours(next.time, next.endTime); if (h) next.hours = h; setForm(next); };
  async function chooseImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return flash("Choose an image file.", true);
    if (file.size > 10 * 1024 * 1024) return flash("Choose an image smaller than 10 MB.", true);
    try {
      const image = await compressActivityImage(file);
      setForm((current) => current ? { ...current, image } : current);
    } catch (error) {
      flash(error.message || "Could not load that image.", true);
    }
  }

  function save(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time || !form.endTime || !form.location.trim()) return flash("Please complete the title, date, starting time, ending time and location.", true);
    if (form.endTime <= form.time) return flash("The ending time must be later than the starting time.", true);
    const eligibleColleges = [...new Set([...form.colleges, ...(assignedCollege ? [assignedCollege] : [])])];
    if (!eligibleColleges.length || eligibleColleges.some((college) => !collegeOptions.includes(college))) return flash("Choose at least one active participating college.", true);
    const data = { ...form, colleges: eligibleColleges, title: form.title.trim(), location: form.location.trim(), hours: Number(form.hours) || 1, slots: Number(form.slots) || 1 };
    if (editId) { setActs(acts.map((a) => (a.id === editId ? { ...a, ...data, status: a.status === "Rejected" ? "Pending" : a.status } : a))); flash("Activity updated."); }
    else { setActs([...acts, { ...data, id: nid(acts), status: "Pending", by: me.id }]); flash("Activity submitted to the Super Admin for approval."); }
    setForm(null); setEditId(null);
  }
  function remove(a) {
    if (!window.confirm(`Delete “${a.title}”? Enrollments will be removed too.`)) return;
    setActs(acts.filter((x) => x.id !== a.id)); setEnr(enr.filter((e) => e.actId !== a.id)); flash("Activity deleted.");
  }
  const setStatus = (a, status) => { setActs(acts.map((x) => (x.id === a.id ? { ...x, status } : x))); flash(`Activity marked ${status.toLowerCase()}.`); };
  function respond(e, status) {
    const a = act(e.actId);
    if (status === "Accepted" && hasActivityEnded(a, clockNow)) return flash("This activity has ended, so new participation requests can’t be approved.", true);
    if (status === "Accepted" && accepted(enr, a) >= a.slots) return flash("This activity is already full.", true);
    setEnr(enr.map((x) => (x.id === e.id ? { ...x, status } : x))); flash(`Request ${status.toLowerCase()}.`, status === "Declined");
  }
  const verify = (e) => { setEnr(enr.map((x) => (x.id === e.id ? { ...x, verified: true } : x))); flash("Attendance verified."); };
  const rejectLog = (e) => { setEnr(enr.map((x) => (x.id === e.id ? { ...x, attended: false, hours: 0, verified: false, logDate: "" } : x))); flash("Log rejected. The student can submit it again.", true); };

  return (
    <Shell d={d} page={page} setPage={setPage} nav={[["Dashboard", "▦"], ["My Activities", "◈"], ["Requests", "✉", reqs.length], ["Attendance & Hours", "◷"], ["My Profile", "☺"]]}>
      {page === "Dashboard" && (
        <>
          <Hero title={`Welcome, ${me.first}.`} text="Create volunteer activities, accept student requests, and confirm attendance to log hours.">
            <button type="button" className="btn sm" style={{ position: "relative", zIndex: 1 }} onClick={() => { setForm({ ...blank, colleges: assignedCollege ? [assignedCollege] : [] }); setEditId(null); setPage("My Activities"); }}>＋ Create an activity</button>
          </Hero>
          <section className="stats">
            <Stat label="My activities" value={mine.length} detail="Posted by your office" icon="◈" />
            <Stat label="Awaiting approval" value={mine.filter((a) => a.status === "Pending").length} detail="Sent to Super Admin" icon="⏳" />
            <Stat label="Student requests" value={reqs.length} detail="Waiting for your reply" icon="✉" />
            <Stat label="Hours logged" value={myEnr.filter((e) => e.attended).reduce((s, e) => s + Number(e.hours || 0), 0)} detail="Across your activities" icon="◷" />
          </section>
          <Gallery />
          <Panel eyebrow="YOUR PROGRAMS" title="Activity participation" sub="Select one of your activities to review approved students and remaining capacity.">
            <div className="activity-shortcuts">{mine.map((a) => {
              const participants = accepted(enr, a), available = Math.max(a.slots - participants, 0);
              return <button key={a.id} type="button" className="activity-shortcut" onClick={() => setSelectedActivity(a)}>
                <span className="activity-shortcut-main"><span className="activity-shortcut-heading"><b>{a.title}</b><Badge s={statusOf(a)} /></span><small>{fmtDate(a.date)} · {timeRange(a)} · {a.location}</small></span>
                <span className="activity-shortcut-metrics"><span><strong>{participants}</strong><small>participants</small></span><span><strong>{available}</strong><small>slots open</small></span><span className="activity-shortcut-link">View details →</span></span>
              </button>;
            })}
              {mine.length === 0 && <p className="note">Create an activity to begin tracking participants.</p>}</div>
          </Panel>
        </>
      )}
      {page === "My Activities" && (
        <Panel eyebrow="PROGRAM MANAGEMENT" title="Volunteer activities" sub="New activities are reviewed by the Super Admin before students can see them."
          action={<button type="button" className="btn sm" onClick={() => { setForm(form ? null : { ...blank, colleges: assignedCollege ? [assignedCollege] : [] }); setEditId(null); }}>{form ? (editId ? "Cancel editing" : "Cancel") : "＋ Add activity"}</button>}>
          {form && (
            <form className="form" onSubmit={save}>
              {editId && <div className="editbar">✎ Editing “{acts.find((a) => a.id === editId)?.title}” — change any detail below, then save.</div>}
              <label className="w">Title<input value={form.title} onChange={setF("title")} placeholder="e.g. Coastal clean-up" /></label>
              <label className="w">Description<textarea value={form.desc} onChange={setF("desc")} placeholder="What will volunteers do?" /></label>
              <label className="w">Activity photo <span className="opt">(optional, JPG/PNG/WebP; max 10 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /></label>
              {form.image && <div className="activity-upload-preview w"><img src={form.image} alt="Activity photo preview" /><button type="button" className="tb bad" onClick={() => setForm({ ...form, image: "" })}>Remove photo</button></div>}
              <label>Category<select value={form.category} onChange={setF("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label>Location<input value={form.location} onChange={setF("location")} /></label>
              <label>Date<input type="date" value={form.date} onChange={setF("date")} /></label>
              <label>Starting time<input type="time" value={form.time} onChange={setTime("time")} /></label>
              <label>Ending time<input type="time" value={form.endTime} onChange={setTime("endTime")} /></label>
              <label>Service hours (auto from times)<input type="number" min="0.5" step="0.5" value={form.hours} onChange={setF("hours")} /></label>
              <label>Volunteer slots<input type="number" min="1" value={form.slots} onChange={setF("slots")} /></label>
              <fieldset className="college-picker w"><legend>Participating colleges</legend><p>Only colleges with an active Admin appear here. Your own college is always included; select other colleges to invite their students.</p><div className="college-options">{collegeOptions.map((college) => <label key={college}><input type="checkbox" checked={form.colleges.includes(college) || college === assignedCollege} disabled={college === assignedCollege} onChange={() => toggleCollege(college)} />{college}</label>)}</div>{!collegeOptions.length && <small>The Super Admin must assign an active Admin to a college before it can be selected.</small>}</fieldset>
              <button className="btn sm" type="submit">{editId ? "Save changes" : "Submit for approval"}</button>
            </form>
          )}
          <div className="filters"><input aria-label="Search" placeholder="Search activities…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={sf} onChange={(e) => setSf(e.target.value)}>{["All", "Pending", "Open", "Ongoing", "Completed", "Rejected"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="tw admin-work-table"><table><thead><tr><th>ACTIVITY</th><th>SCHEDULE</th><th>HOURS</th><th>ENROLLED</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
            {shown.map((a) => (
              <tr key={a.id}><td><button type="button" className="activity-link" onClick={() => setSelectedActivity(a)}><strong>{a.title}</strong></button><small>{a.category}</small></td><td>{fmtDate(a.date)} · {timeRange(a)}<small>{a.location}</small></td><td>{a.hours} h</td><td>{accepted(enr, a)} / {a.slots}</td><td><Badge s={statusOf(a)} /></td>
                <td>
                  {statusOf(a) === "Open" && <button type="button" className="tb" onClick={() => setStatus(a, "Ongoing")}>Start</button>}
                  {statusOf(a) === "Ongoing" && <button type="button" className="tb" onClick={() => setStatus(a, "Completed")}>Complete</button>}
                  <button type="button" className="tb" onClick={() => { setForm({ title: a.title, desc: a.desc, category: a.category, date: a.date, time: a.time, endTime: a.endTime || "", location: a.location, hours: a.hours, slots: a.slots, colleges: a.colleges?.length ? a.colleges.filter((college) => collegeOptions.includes(college)) : [...collegeOptions], image: a.image || "" }); setEditId(a.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>✎ Edit</button>
                  <button type="button" className="tb bad" onClick={() => remove(a)}>Delete</button>
                </td></tr>
            ))}
            {shown.length === 0 && <Empty cols={6} text="No activities found." />}
          </tbody></table></div>
        </Panel>
      )}
      {page === "Requests" && (
        <Panel eyebrow="ENROLLMENT REQUESTS" title="Student requests" sub="Accept or decline students who want to join your activities.">
          <div className="tw admin-work-table"><table><thead><tr><th>STUDENT</th><th>COLLEGE</th><th>ACTIVITY</th><th>STATUS</th><th>DECISION</th></tr></thead><tbody>
            {myEnr.map((e) => (
              <tr key={e.id}><td><strong>{fullName(stu(e.userId))}</strong><small>{stu(e.userId).idno}</small></td><td>{stu(e.userId).college}</td><td>{act(e.actId).title}<small>{fmtDate(act(e.actId).date)}</small></td><td><Badge s={e.status} /></td>
                <td>{e.status === "Pending" ? <><button type="button" className="tb" onClick={() => respond(e, "Accepted")}>✓ Accept</button><button type="button" className="tb bad" onClick={() => respond(e, "Declined")}>✕ Decline</button></> : "—"}</td></tr>
            ))}
            {myEnr.length === 0 && <Empty cols={5} text="No student requests yet." />}
          </tbody></table></div>
        </Panel>
      )}
      {page === "Attendance & Hours" && (
        <Panel eyebrow="ATTENDANCE LOGS" title="Student attendance & hours" sub="Students log their own attendance and hours. Verify each entry, or reject it so the student can resubmit.">
          <div className="tw admin-work-table"><table><thead><tr><th>STUDENT</th><th>ACTIVITY</th><th>LOG DATE</th><th>HOURS</th><th>STATUS</th><th>REVIEW</th></tr></thead><tbody>
            {myEnr.filter((e) => e.status === "Accepted").map((e) => {
              const a = act(e.actId);
              return (
                <tr key={e.id}><td><strong>{fullName(stu(e.userId))}</strong><small>{stu(e.userId).college}</small></td><td>{a.title}<small>{statusOf(a)}</small></td>
                  <td>{e.attended ? fmtDate(e.logDate) : "—"}</td><td>{e.attended ? `${e.hours} / ${a.hours}` : "—"}</td>
                  <td>{e.attended ? <Badge s={e.verified ? "Verified" : "Logged"} /> : <small>Not logged yet</small>}</td>
                  <td>{e.attended && !e.verified ? <><button type="button" className="tb" onClick={() => verify(e)}>✓ Verify</button><button type="button" className="tb bad" onClick={() => rejectLog(e)}>✕ Reject</button></> : "—"}</td></tr>
              );
            })}
            {myEnr.filter((e) => e.status === "Accepted").length === 0 && <Empty cols={6} text="No accepted volunteers yet." />}
          </tbody></table></div>
        </Panel>
      )}
      {page === "My Profile" && <Profile d={d} />}
      {selectedActivity && <ActivityDetails activity={selectedActivity} status={statusOf(selectedActivity)} users={users} enrollments={enr} organizations={organizations} close={() => setSelectedActivity(null)} />}
    </Shell>
  );
}

/* ================= STUDENT ================= */
function StudentApp({ d, start }) {
  const { acts, enr, setEnr, flash, me, users, organizations } = d;
  const [page, setPage] = useState(start || "Home");
  const [q, setQ] = useState(""); const [cat, setCat] = useState("All"); const [st, setSt] = useState("All");
  const [logId, setLogId] = useState(null);
  const [log, setLog] = useState({ date: "", hours: "" });
  const [clockNow, setClockNow] = useState(() => new Date());
  const [certKey, setCertKey] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const act = (id) => acts.find((a) => a.id === id);
  const studentCollegeActive = organizations.some((org) => org.name === me.college && org.type === "College" && org.status === "Active");
  const canAccessActivity = (activity) => {
    const owner = users.find((user) => user.id === activity.by);
    return studentCollegeActive && (owner?.college === me.college || !activity.colleges?.length || activity.colleges.includes(me.college));
  };
  const mine = enr.filter((e) => e.userId === me.id && act(e.actId));
  const visible = acts.filter((a) => ["Open", "Ongoing"].includes(activityStatus(a, clockNow)) && !hasActivityEnded(a, clockNow) && canAccessActivity(a));
  const logged = mine.filter((e) => e.attended);
  const total = logged.reduce((s, e) => s + Number(e.hours || 0), 0);
  const done = (e) => { const a = act(e.actId); return e.status === "Accepted" && e.attended && e.verified && activityStatus(a, clockNow) === "Completed" && e.hours >= a.hours; };
  const released = mine.filter(done);
  const doneHours = released.reduce((s, e) => s + Number(e.hours), 0);
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const certs = [
    ...released.map((e) => { const a = act(e.actId); return { key: "e" + e.id, label: a.title, heading: "Certificate of Completion", body: `has successfully completed the volunteer activity “${a.title}”, rendering ${plural(e.hours, "hour")} of service on ${fmtDate(e.logDate || a.date)}.` }; }),
    ...(released.length ? [{ key: "all", label: `Accumulated hours (${doneHours} h)`, heading: "Certificate of Volunteer Service", body: `has rendered ${plural(doneHours, "hour")} of volunteer and community service across ${plural(released.length, "completed activity").replace("activitys", "activities")}.` }] : []),
  ];
  const cert = certs.find((c) => c.key === certKey) || certs[0];
  const list = visible.filter((a) => (cat === "All" || a.category === cat) && (st === "All" || activityStatus(a, clockNow) === st) && [a.title, a.desc, a.location].some((f) => f.toLowerCase().includes(q.trim().toLowerCase())));

  function enroll(a) {
    if (!canAccessActivity(a)) return flash("This activity is not open to your college.", true);
    if (hasActivityEnded(a)) return flash("This activity has ended and is no longer open for enrollment.", true);
    if (mine.some((e) => e.actId === a.id)) return flash("You already have an enrollment request for this activity.", true);
    setEnr([...enr, { id: nid(enr), actId: a.id, userId: me.id, status: "Pending", attended: false, hours: 0 }]); flash("Request sent! The office will review your enrollment.");
  }
  function cancel(e) { setEnr(enr.filter((x) => x.id !== e.id)); flash("Enrollment request cancelled."); }
  function openLog(e) {
    const a = act(e.actId);
    if (e.status !== "Accepted") return flash("Your enrollment must be approved before you can submit hours.", true);
    if (!hasActivityEnded(a)) return flash(`Attendance can be submitted after the activity ends at ${fmtTime(a.endTime)} on ${fmtDate(a.date)}.`, true);
    setLogId(e.id); setLog({ date: a.date, hours: e.attended ? e.hours : a.hours });
  }
  function submitLog(ev) {
    ev.preventDefault();
    const e = enr.find((x) => x.id === logId), a = act(e.actId), h = Number(log.hours);
    if (e.status !== "Accepted") return flash("Your enrollment must be approved before you can submit hours.", true);
    if (!hasActivityEnded(a)) return flash("You can submit attendance after the activity's scheduled end time.", true);
    if (log.date !== a.date) return flash("Attendance must be recorded for the activity date.", true);
    if (!log.date || !(h > 0)) return flash("Enter the date you attended and the hours you worked.", true);
    if (h > a.hours) return flash(`Hours can’t exceed the activity’s ${a.hours} service hour(s).`, true);
    setEnr(enr.map((x) => (x.id === e.id ? { ...x, attended: true, hours: h, logDate: log.date, verified: false } : x)));
    setLogId(null);
    flash("Attendance and hours submitted. Your coordinator must verify them before a certificate can be released.");
  }
  async function pdf() { const c = await drawCertificate(fullName(me), me.college, cert.heading, cert.body); saveBlob(pdfFromCanvas(c), `WMSU-${cert.key}-${me.last}-${me.first}.pdf`.replace(/[^\w.-]+/g, "_")); flash("Certificate PDF downloaded."); }

  const Card = ({ a }) => {
    const e = mine.find((x) => x.actId === a.id), left = a.slots - accepted(enr, a);
    return (
      <article className="card acard">
        <button type="button" className="aimg" style={{ backgroundImage: `url(${a.image || PHOTO[a.category] || IMG.campus})` }} onClick={() => setSelectedActivity(a)} aria-label={`View ${a.title} details`}><Badge s={activityStatus(a, clockNow)} /></button>
        <div className="abody">
          <span className="eb">{a.category.toUpperCase()}</span><h3><button type="button" className="activity-title" onClick={() => setSelectedActivity(a)} aria-label={`View details for ${a.title}`}>{a.title}</button></h3><p>{a.desc}</p>
          <div className="meta"><span>📅 {fmtDate(a.date)} · {timeRange(a)}</span><span>📍 {a.location}</span><span>⏱ {plural(a.hours, "service hour")} · {Math.max(left, 0)} slot(s) left</span></div>
          <div className="foot-row">
            <button type="button" className="tb" onClick={() => setSelectedActivity(a)}>Coordinator & details</button>
            {e ? <Badge s={e.status} /> : <span />}
            {e ? (e.status === "Pending" && <button type="button" className="tb bad" onClick={() => cancel(e)}>Cancel</button>)
              : <button type="button" className="btn sm" disabled={a.status !== "Open" || left <= 0} onClick={() => enroll(a)}>{a.status !== "Open" ? "Closed" : left <= 0 ? "Full" : "Enroll"}</button>}
          </div>
        </div>
      </article>
    );
  };

  const logE = logId && enr.find((x) => x.id === logId);
  const logA = logE && act(logE.actId);

  return (
    <div className="stu">
      <nav className="snav noprint" aria-label="Main navigation">
        <button type="button" className="brand brand-link" aria-label="Go to home" onClick={() => setPage("Home")}><Logo /><span><b>WMSU IMPACT</b><small>Student Portal</small></span></button>
        <div className="tabsbar">{[["Home", "⌂"], ["Activities", "◈"], ["My Enrollments", "✉"], ["Hours & Certificate", "🎓"], ["My Profile", "☺"]].map(([l, i]) => <button key={l} type="button" className={`ni ${page === l ? "on" : ""}`} onClick={() => setPage(l)}><span>{i}</span>{l}</button>)}</div>
        <ThemeToggle theme={d.theme} setTheme={d.setTheme} />
        <button type="button" className="av avbtn" title="My profile" onClick={() => setPage("My Profile")}>{initials(me)}</button>
        <button type="button" className="btn out sm" onClick={d.logout}>Log out</button>
      </nav>
      <main className="stu-main">
        {page === "Home" && (
          <>
            <Hero title={`Hello, ${me.first}! Ready to serve?`} text="Browse volunteer activities from campus offices, enroll, log your attendance and hours, and receive your certificate automatically once you finish.">
              <button type="button" className="btn sm" style={{ position: "relative", zIndex: 1 }} onClick={() => setPage("Activities")}>Find an activity →</button>
            </Hero>
            <section className="stats">
              <Stat label="Hours logged" value={total} detail="Your recorded service" icon="◷" />
              <Stat label="Activities joined" value={mine.filter((e) => e.status === "Accepted").length} detail="Accepted enrollments" icon="◈" />
              <Stat label="Pending requests" value={mine.filter((e) => e.status === "Pending").length} detail="Waiting for approval" icon="⏳" />
              <Stat label="Certificates" value={released.length} detail="Released automatically" icon="🎓" />
            </section>
            <div className="sh"><div><span className="eb">OPEN FOR SIGN-UP</span><h2 style={{ fontSize: 20, letterSpacing: "-.04em", margin: "5px 0" }}>Featured activities</h2></div></div>
            <div className="acts">{visible.filter((a) => a.status === "Open").slice(0, 3).map((a) => <Card key={a.id} a={a} />)}</div>
            <div style={{ height: 24 }} /><Gallery />
          </>
        )}
        {page === "Activities" && (
          <Panel eyebrow="VOLUNTEER OPPORTUNITIES" title="Browse activities" sub="Search and filter, then enroll in the services you want to join.">
            <div className="filters"><input aria-label="Search activities" placeholder="Search by title, description or location…" value={q} onChange={(e) => setQ(e.target.value)} />
              <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>{["All", ...CATEGORIES].map((c) => <option key={c}>{c}</option>)}</select>
              <select aria-label="Status" value={st} onChange={(e) => setSt(e.target.value)}>{["All", "Open", "Ongoing", "Completed"].map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="acts">{list.map((a) => <Card key={a.id} a={a} />)}</div>
            {list.length === 0 && <p className="note">No activities match your filters.</p>}
          </Panel>
        )}
        {page === "My Enrollments" && (
          <Panel eyebrow="MY SERVICES" title="My enrollments" sub="After your request is approved and the activity ends, enter the accumulated hours you worked. The coordinator reviews your attendance before a certificate can be released.">
            {logE && (
              <form className="form" onSubmit={submitLog}>
                <label className="w">Logging attendance for<input value={logA.title} disabled /></label>
                <label>Date attended<input type="date" value={log.date} max={logA.date} min={logA.date} readOnly /></label>
                <label>Accumulated hours worked (max {logA.hours})<input type="number" min="0.5" max={logA.hours} step="0.5" value={log.hours} onChange={(e) => setLog({ ...log, hours: e.target.value })} /></label>
                <p className="attendance-help w">Submit your total hours after the scheduled end time. Your activity coordinator must verify the entry.</p>
                <button className="btn sm" type="submit">Save attendance</button>
                <button className="btn out sm" type="button" onClick={() => setLogId(null)}>Cancel</button>
              </form>
            )}
            <div className="tw"><table><thead><tr><th>ACTIVITY</th><th>SCHEDULE</th><th>REQUEST</th><th>MY ATTENDANCE</th><th>CERTIFICATE</th><th>ACTION</th></tr></thead><tbody>
              {mine.map((e) => {
                const a = act(e.actId), can = e.status === "Accepted" && hasActivityEnded(a, clockNow);
                return (
                  <tr key={e.id}><td><strong>{a.title}</strong><small>{a.category}</small></td><td>{fmtDate(a.date)} · {timeRange(a)}<small>{a.location}</small></td>
                    <td><Badge s={e.status} /><small>Activity: {activityStatus(a, clockNow)}</small></td>
                    <td>{e.attended ? <>{e.hours} / {a.hours} h<small>{fmtDate(e.logDate)} · {e.verified ? "Verified" : "Awaiting review"}</small></> : "—"}</td>
                    <td>{done(e) ? <span className="bd ok">🎓 Released</span> : e.status === "Accepted" ? <small>{e.attended && !e.verified ? "Awaiting coordinator verification" : `Full ${a.hours} h + verification + activity completion required`}</small> : "—"}</td>
                    <td>
                      {e.status === "Pending" && <button type="button" className="tb bad" onClick={() => cancel(e)}>Cancel</button>}
                      {e.status === "Accepted" && !can && <small>Attendance opens after {fmtTime(a.endTime)} on {fmtDate(a.date)}.</small>}
                      {e.status === "Accepted" && can && !e.verified && <button type="button" className="tb" onClick={() => openLog(e)}>{e.attended ? "Edit hours" : "Submit attendance"}</button>}
                      {done(e) && <button type="button" className="tb" onClick={() => { setCertKey("e" + e.id); setPage("Hours & Certificate"); }}>View certificate</button>}
                    </td></tr>
                );
              })}
              {mine.length === 0 && <Empty cols={6} text="You haven’t enrolled in any activity yet." />}
            </tbody></table></div>
          </Panel>
        )}
        {page === "Hours & Certificate" && (
          <Panel eyebrow="COMPLETION RECORDS" title="Hours report & certificates" sub={`Total logged: ${plural(total, "hour")} across ${plural(logged.length, "activity").replace("activitys", "activities")}. Certificates use the name and college saved in your profile.`}>
            <div className="tw noprint"><table><thead><tr><th>ACTIVITY</th><th>DATE</th><th>HOURS</th><th>REVIEW</th><th>CERTIFICATE</th></tr></thead><tbody>
              {logged.map((e) => <tr key={e.id}><td><strong>{act(e.actId).title}</strong></td><td>{fmtDate(e.logDate)}</td><td>{e.hours} / {act(e.actId).hours}</td><td><Badge s={e.verified ? "Verified" : "Logged"} /></td><td>{done(e) ? <span className="bd ok">🎓 Released</span> : "—"}</td></tr>)}
              {logged.length === 0 && <Empty cols={5} text="No hours logged yet. Log your attendance under My Enrollments." />}
            </tbody></table></div>
            {cert ? (
              <>
                <div className="chips noprint">{certs.map((c) => <button key={c.key} type="button" className={`chip ${c.key === cert.key ? "on" : ""}`} onClick={() => setCertKey(c.key)}>{c.label}</button>)}</div>
                <div className="cert-bar noprint"><div className="cert-actions">
                  <button type="button" className="btn sm" onClick={() => window.print()}>🖨 Print</button>
                  <button type="button" className="btn out sm" onClick={pdf}>⬇ Download PDF</button></div></div>
                <div className="cert" id="certificate">
                  <div className="wm">WMSU</div><Logo big />
                  <span className="eb">WESTERN MINDANAO STATE UNIVERSITY</span>
                  <h2>{cert.heading}</h2><p>Presented to</p>
                  <div className="nm">{fullName(me)}</div>
                  <p>{me.college}<br />{cert.body}</p>
                  <p>Issued on {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <div className="line">Authorized Signature</div>
                </div>
                <p className="note noprint">Use Print and choose “Save as PDF”, or download the PDF directly.</p>
              </>
            ) : (
              <p className="note" style={{ marginTop: 18 }}>🎓 Certificates are released only after an approved participant records the full scheduled hours, the coordinator verifies attendance, and the activity is marked completed.</p>
            )}
          </Panel>
        )}
        {page === "My Profile" && <Profile d={d} />}
        {selectedActivity && <ActivityDetails activity={selectedActivity} status={activityStatus(selectedActivity, clockNow)} users={d.users} enrollments={enr} organizations={d.organizations} close={() => setSelectedActivity(null)} />}
      </main>
    </div>
  );
}

/* ================= ROOT ================= */
export default function App() {
  const [users, setUsers] = useStored("wmsu_users", seedUsers);
  const [acts, setActs] = useStored("wmsu_acts", seedActs);
  const [enr, setEnr] = useStored("wmsu_enr", seedEnr);
  const [organizations, setOrganizations] = useStored("wmsu_organizations", seedOrganizations);
  const [engineeringDemoSeeded, setEngineeringDemoSeeded] = useStored("wmsu_engineering_demo_seeded", false);
  const [meId, setMeId] = useStored("wmsu_me", null);
  const [theme, setTheme] = useStored("wmsu_theme", "light");
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    if (engineeringDemoSeeded) return;
    const demoAdmin = seedUsers.find((user) => user.email === "engineeringadmin@wmsu.edu.ph");
    if (demoAdmin && !users.some((user) => user.email === demoAdmin.email)) setUsers([...users, { ...demoAdmin, id: nid(users) }]);
    setEngineeringDemoSeeded(true);
  }, [engineeringDemoSeeded, users, setUsers, setEngineeringDemoSeeded]);
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const flash = (message, bad = false) => { setNotice({ message, bad }); window.setTimeout(() => setNotice(null), 3200); };
  const me = users.find((u) => u.id === meId && u.status === "Active" && (u.role !== "User" || studentHasActiveCollegeAdmin(u, users, organizations)));
  const d = { users, setUsers, acts, setActs, enr, setEnr, organizations, setOrganizations, flash, me, setMeId, theme, setTheme, logout: () => setMeId(null) };
  return (
    <>
      {notice && <div className={`toast fx ${notice.bad ? "bad" : ""}`} role="status">{notice.message}</div>}
      {!me ? <AuthScreen d={d} /> : me.role === "Super Admin" ? <SuperAdminApp d={d} /> : me.role === "Admin" ? <AdminApp d={d} /> : <StudentApp d={d} />}
    </>
  );
}
