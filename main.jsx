import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";

const users = [
  { email: "admin@sunzupaystub.com", password: "admin123", role: "Super Admin", name: "Sunzu Logistics Admin" },
  { email: "driver@sunzupaystub.com", password: "driver123", role: "Driver", name: "Jean Ndayishimiye", driverId: 1 }
];

const drivers = [
  { id: 1, name: "Jean Ndayishimiye", truck: "102", status: "Active", email: "driver@sunzupaystub.com" },
  { id: 2, name: "David Mwamba", truck: "118", status: "On Load", email: "david@example.com" },
  { id: 3, name: "Patrick Niyonzima", truck: "125", status: "Pending POD", email: "patrick@example.com" }
];

const startingSettlements = [
  {
    id: "SUNZU-000123",
    driverId: 1,
    driverName: "Jean Ndayishimiye",
    truck: "102",
    periodStart: "2026-05-10",
    periodEnd: "2026-05-16",
    settlementDate: "2026-05-17",
    earnings: { linehaul: 8500, fuelSurcharge: 1200, detention: 350, layover: 250, tonu: 0, other: 0 },
    deductions: { fuel: 1200, dispatch: 850, insurance: 320, trailer: 300, lease: 500, maintenance: 150, advances: 200, tolls: 90, scales: 40, eld: 45, ifta: 85, dashcam: 15, plates: 75, sameDay: 0, other: 60 },
    previousYtdGross: 96000,
    previousYtdDeductions: 18570,
    previousYtdNet: 77430,
    status: "Published"
  },
  {
    id: "SUNZU-000122",
    driverId: 2,
    driverName: "David Mwamba",
    truck: "118",
    periodStart: "2026-05-03",
    periodEnd: "2026-05-09",
    settlementDate: "2026-05-10",
    earnings: { linehaul: 7000, fuelSurcharge: 950, detention: 0, layover: 300, tonu: 0, other: 0 },
    deductions: { fuel: 900, dispatch: 700, insurance: 320, trailer: 300, lease: 500, maintenance: 120, advances: 0, tolls: 70, scales: 35, eld: 45, ifta: 75, dashcam: 15, plates: 60, sameDay: 0, other: 0 },
    previousYtdGross: 83850,
    previousYtdDeductions: 15010,
    previousYtdNet: 68840,
    status: "Published"
  }
];

const loads = [
  { id: "L-10021", driverId: 1, driver: "Jean Ndayishimiye", pickup: "Knoxville, TN", delivery: "Atlanta, GA", rate: 2500, status: "Delivered", pod: "Uploaded" },
  { id: "L-10022", driverId: 2, driver: "David Mwamba", pickup: "Nashville, TN", delivery: "Charlotte, NC", rate: 3200, status: "In Transit", pod: "Waiting" },
  { id: "L-10023", driverId: 3, driver: "Patrick Niyonzima", pickup: "Louisville, KY", delivery: "Dallas, TX", rate: 4100, status: "Assigned", pod: "Not Due" }
];

const ledger = [
  { date: "2026-05-22", account: "Load Revenue", type: "Income", amount: 9800 },
  { date: "2026-05-22", account: "Fuel", type: "Expense", amount: 1850 },
  { date: "2026-05-22", account: "Insurance", type: "Expense", amount: 620 },
  { date: "2026-05-22", account: "Driver Settlement", type: "Payable", amount: 8420 }
];

const labelMap = {
  linehaul: "Linehaul", fuelSurcharge: "Fuel Surcharge", detention: "Detention", layover: "Layover", tonu: "TONU", other: "Other",
  fuel: "Fuel", dispatch: "Dispatch Fees", insurance: "Insurance", trailer: "Trailer Rent", lease: "Truck Lease", maintenance: "Maintenance/Repair Escrow",
  advances: "Advances", tolls: "Tolls", scales: "Scales", eld: "ELD/GPS", ifta: "IFTA", dashcam: "Dashcam Fee", plates: "Plates/Permits", sameDay: "Same Day Pay Fee"
};

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function sum(obj) {
  return Object.values(obj || {}).reduce((a, b) => a + Number(b || 0), 0);
}

function totals(settlement) {
  const gross = sum(settlement.earnings);
  const deductions = sum(settlement.deductions);
  const net = gross - deductions;
  return {
    gross,
    deductions,
    net,
    ytdGross: Number(settlement.previousYtdGross || 0) + gross,
    ytdDeductions: Number(settlement.previousYtdDeductions || 0) + deductions,
    ytdNet: Number(settlement.previousYtdNet || 0) + net
  };
}

function nextSettlementNumber(settlements) {
  const last = settlements[0]?.id || "SUNZU-000000";
  const n = Number(last.split("-")[1] || 0) + 1;
  return `SUNZU-${String(n).padStart(6, "0")}`;
}

function Styles() {
  return <style>{`
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; background: #eef3f8; color: #0f172a; }
    button, input, select { font: inherit; }
    .app { min-height: 100vh; background: radial-gradient(circle at top left, #dbeafe 0, #eef3f8 28%, #f8fafc 100%); }
    .login-wrap { min-height: 100vh; display: grid; grid-template-columns: 1.1fr .9fr; gap: 40px; align-items: center; max-width: 1180px; margin: auto; padding: 32px; }
    .hero { background: linear-gradient(135deg, #0f172a, #1e3a8a 55%, #2563eb); border-radius: 34px; padding: 48px; color: white; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .hero-badge { display: inline-flex; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); padding: 10px 14px; border-radius: 999px; font-weight: 800; letter-spacing: .08em; font-size: 12px; }
    .hero h1 { font-size: 54px; line-height: 1.02; margin: 22px 0 16px; }
    .hero p { font-size: 18px; color: #dbeafe; line-height: 1.7; }
    .login-card, .panel, .metric, .paystub-preview { background: rgba(255,255,255,.92); border: 1px solid rgba(148,163,184,.22); border-radius: 28px; box-shadow: 0 18px 45px rgba(15,23,42,.08); }
    .login-card { padding: 34px; }
    .field { display: grid; gap: 7px; margin-bottom: 14px; }
    .field span { font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .05em; color: #64748b; }
    input, select { width: 100%; border: 1px solid #cbd5e1; border-radius: 14px; padding: 12px 13px; background: white; outline: none; }
    input:focus, select:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.12); }
    .primary { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none; border-radius: 15px; padding: 13px 17px; font-weight: 900; cursor: pointer; box-shadow: 0 12px 25px rgba(37,99,235,.25); }
    .darkbtn { background: #0f172a; color: white; border: none; border-radius: 15px; padding: 13px 17px; font-weight: 900; cursor: pointer; }
    .greenbtn { background: #047857; color: white; border: none; border-radius: 15px; padding: 13px 17px; font-weight: 900; cursor: pointer; }
    .redbtn { background: #dc2626; color: white; border: none; border-radius: 15px; padding: 12px 15px; font-weight: 900; cursor: pointer; }
    .ghost { border: 1px solid #dbe4ee; background: white; color: #0f172a; border-radius: 14px; padding: 10px 13px; font-weight: 800; cursor: pointer; }
    .layout { display: grid; grid-template-columns: 290px 1fr; min-height: 100vh; }
    .sidebar { background: #0b1220; color: white; padding: 22px; position: sticky; top: 0; height: 100vh; }
    .brand { background: linear-gradient(135deg, #1d4ed8, #0f172a); border-radius: 26px; padding: 22px; box-shadow: 0 18px 35px rgba(37,99,235,.22); }
    .brand h1 { font-size: 22px; margin: 0; }
    .brand p { margin: 7px 0 0; color: #bfdbfe; font-size: 13px; }
    .nav { display: grid; gap: 8px; margin-top: 22px; }
    .nav button { width: 100%; text-align: left; color: #cbd5e1; background: transparent; border: 0; border-radius: 15px; padding: 13px 14px; cursor: pointer; font-weight: 800; }
    .nav button.active, .nav button:hover { background: #1d4ed8; color: white; }
    .main { padding: 26px; }
    .topbar { display: flex; gap: 18px; align-items: center; justify-content: space-between; margin-bottom: 22px; background: rgba(255,255,255,.92); border: 1px solid rgba(148,163,184,.22); border-radius: 30px; padding: 22px; box-shadow: 0 14px 35px rgba(15,23,42,.07); }
    .topbar h2 { margin: 0; font-size: 28px; letter-spacing: -.03em; }
    .topbar p { margin: 6px 0 0; color: #64748b; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .grid { display: grid; gap: 18px; }
    .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .two { grid-template-columns: 1fr 1fr; }
    .three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .six { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .panel { padding: 22px; }
    .panel h3 { margin: 0 0 18px; font-size: 22px; }
    .metric { padding: 22px; overflow: hidden; position: relative; }
    .metric:after { content: ""; position: absolute; right: -26px; top: -26px; width: 84px; height: 84px; border-radius: 999px; background: rgba(255,255,255,.2); }
    .metric .label { color: inherit; opacity: .75; font-weight: 850; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
    .metric .value { margin-top: 10px; font-size: 28px; font-weight: 950; letter-spacing: -.03em; }
    .m-blue { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; }
    .m-green { background: linear-gradient(135deg, #059669, #065f46); color: white; }
    .m-red { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; }
    .m-slate { background: white; color: #0f172a; }
    .form-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
    .deduction-grid { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 14px; }
    .notice { padding: 16px 18px; border-radius: 20px; background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; font-weight: 800; }
    table { width: 100%; border-collapse: separate; border-spacing: 0 9px; }
    th { text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .06em; padding: 6px 12px; }
    td { background: #f8fafc; padding: 14px 12px; font-weight: 700; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    td:first-child { border-left: 1px solid #e2e8f0; border-radius: 15px 0 0 15px; }
    td:last-child { border-right: 1px solid #e2e8f0; border-radius: 0 15px 15px 0; }
    .paystub-preview { padding: 0; overflow: hidden; }
    .pdf-head { display: flex; justify-content: space-between; gap: 20px; padding: 26px; background: linear-gradient(135deg, #0f172a, #1e3a8a); color: white; }
    .pdf-head h2 { margin: 0; font-size: 28px; }
    .pdf-body { padding: 24px; }
    .info-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
    .info { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 17px; }
    .info small { display: block; color: #64748b; text-transform: uppercase; font-weight: 850; margin-bottom: 5px; }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .line { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 9px 0; font-weight: 750; }
    .line.bold { font-size: 18px; font-weight: 950; color: #0f172a; border-bottom: 0; margin-top: 6px; }
    .driver-list { display: grid; gap: 10px; }
    .driver-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 18px; padding: 14px; cursor: pointer; text-align: left; font-weight: 900; }
    .driver-card.active { background: #1d4ed8; color: white; }
    .mobile-nav { display: none; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    @media (max-width: 1050px) { .layout { grid-template-columns: 1fr; } .sidebar { display: none; } .mobile-nav { display: flex; } .metrics, .six, .four { grid-template-columns: repeat(2, minmax(0,1fr)); } .deduction-grid, .form-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
    @media (max-width: 720px) { .login-wrap { grid-template-columns: 1fr; padding: 18px; } .hero { padding: 28px; } .hero h1 { font-size: 36px; } .topbar { flex-direction: column; align-items: flex-start; } .metrics, .six, .four, .three, .two, .split, .info-row, .deduction-grid, .form-grid { grid-template-columns: 1fr; } .main { padding: 14px; } .pdf-head { flex-direction: column; } }
  `}</style>;
}

function SunzuPaystubPro() {
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState("admin@sunzupaystub.com");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState("dashboard");
  const [settlements, setSettlements] = useState(startingSettlements);
  const [selectedDriverId, setSelectedDriverId] = useState(1);
  const [draft, setDraft] = useState(startingSettlements[0]);

  const selectedDriver = drivers.find((d) => d.id === Number(selectedDriverId)) || drivers[0];
  const draftTotals = totals(draft);
  const driverSettlements = settlements.filter((s) => s.driverId === selectedDriver.id);
  const latestDriverSettlement = driverSettlements[0];
  const revenue = loads.reduce((total, load) => total + load.rate, 0);
  const expenses = ledger.filter((x) => x.type === "Expense").reduce((total, x) => total + x.amount, 0);

  const login = () => {
    const found = users.find((u) => u.email === loginEmail && u.password === loginPassword);
    if (!found) return setLoginError("Wrong email or password.");
    setSession(found);
    setLoginError("");
    if (found.role === "Driver") {
      setSelectedDriverId(found.driverId);
      setView("drivers");
    }
  };

  const logout = () => { setSession(null); setView("dashboard"); };

  const createNewSettlement = (driverId = selectedDriver.id) => {
    const driver = drivers.find((d) => d.id === Number(driverId)) || drivers[0];
    const last = settlements.find((s) => s.driverId === driver.id);
    const lastTotals = last ? totals(last) : { ytdGross: 0, ytdDeductions: 0, ytdNet: 0 };
    const newDraft = {
      id: nextSettlementNumber(settlements),
      driverId: driver.id,
      driverName: driver.name,
      truck: driver.truck,
      periodStart: "2026-05-22",
      periodEnd: "2026-05-22",
      settlementDate: new Date().toISOString().slice(0, 10),
      earnings: { linehaul: 0, fuelSurcharge: 0, detention: 0, layover: 0, tonu: 0, other: 0 },
      deductions: { fuel: 0, dispatch: 0, insurance: 0, trailer: 0, lease: 0, maintenance: 0, advances: 0, tolls: 0, scales: 0, eld: 0, ifta: 0, dashcam: 0, plates: 0, sameDay: 0, other: 0 },
      previousYtdGross: lastTotals.ytdGross,
      previousYtdDeductions: lastTotals.ytdDeductions,
      previousYtdNet: lastTotals.ytdNet,
      status: "Draft"
    };
    setSelectedDriverId(driver.id);
    setDraft(newDraft);
    setView("settlements");
  };

  const saveSettlement = () => {
    const finalSettlement = { ...draft, status: "Published" };
    setSettlements((current) => [finalSettlement, ...current.filter((s) => s.id !== finalSettlement.id)]);
    setDraft(finalSettlement);
  };

  const updateDraft = (field, value) => setDraft((d) => ({ ...d, [field]: value }));
  const updateMoney = (section, name, value) => setDraft((d) => ({ ...d, [section]: { ...d[section], [name]: Number(value || 0) } }));

  if (!session) {
    return <><Styles /><div className="app"><div className="login-wrap"><section className="hero"><span className="hero-badge">SUNZU PAYSTUB PRO</span><h1>Professional trucking payroll, dispatch, and accounting.</h1><p>Built for 1099 owner-operators, fleets, settlements, load tracking, driver portals, and clean PDF paystub workflows.</p></section><section className="login-card"><h2>Login</h2><p style={{ color: "#64748b" }}>Use demo credentials below.</p><Field label="Email" value={loginEmail} onChange={setLoginEmail} /><Field label="Password" type="password" value={loginPassword} onChange={setLoginPassword} />{loginError && <div className="notice" style={{ background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" }}>{loginError}</div>}<button className="primary" style={{ width: "100%" }} onClick={login}>Login</button><div className="grid" style={{ marginTop: 16 }}><button className="ghost" onClick={() => { setLoginEmail("admin@sunzupaystub.com"); setLoginPassword("admin123"); }}>Admin: admin@sunzupaystub.com / admin123</button><button className="ghost" onClick={() => { setLoginEmail("driver@sunzupaystub.com"); setLoginPassword("driver123"); }}>Driver: driver@sunzupaystub.com / driver123</button></div></section></div></div></>;
  }

  const adminOnly = session.role !== "Driver";
  const navItems = adminOnly
    ? [["dashboard", "Dashboard"], ["settlements", "Settlements"], ["drivers", "Driver Portal"], ["dispatch", "Load Dispatch"], ["bookkeeping", "Bookkeeping"], ["accounting", "Accounting"], ["pdf", "PDF Center"]]
    : [["drivers", "My Portal"], ["pdf", "My PDFs"]];

  return <><Styles /><div className="app"><div className="layout"><aside className="sidebar"><div className="brand"><h1>Sunzu Paystub Pro</h1><p>{session.role}</p></div><nav className="nav">{navItems.map(([key, label]) => <button key={key} onClick={() => setView(key)} className={view === key ? "active" : ""}>{label}</button>)}</nav><button onClick={logout} className="redbtn" style={{ width: "100%", marginTop: 22 }}>Logout</button></aside><main className="main"><div className="mobile-nav">{navItems.map(([key, label]) => <button className="ghost" key={key} onClick={() => setView(key)}>{label}</button>)}</div><header className="topbar"><div><h2>Welcome, {session.name}</h2><p>Auto-fill YTD from last paystub • live calculations • driver preview matched to admin entry.</p></div><div className="actions">{adminOnly && <button onClick={() => createNewSettlement()} className="primary">Create New Settlement</button>}{adminOnly && <button onClick={() => setView("dispatch")} className="darkbtn">Assign Load</button>}<button onClick={logout} className="redbtn">Logout</button></div></header>

  {view === "dashboard" && adminOnly && <section className="grid"><div className="grid metrics"><Metric title="Total Load Revenue" value={money(revenue)} tone="blue" /><Metric title="Open Driver Payables" value={money(11480)} tone="green" /><Metric title="Monthly Expenses" value={money(expenses)} tone="red" /><Metric title="Active Loads" value={loads.length} tone="slate" /></div><Panel title="Recent Settlements"><Table headers={["Settlement", "Driver", "Gross", "Deductions", "Net", "YTD Net", "Status"]} rows={settlements.map((s) => { const t = totals(s); return [s.id, s.driverName, money(t.gross), money(t.deductions), money(t.net), money(t.ytdNet), s.status]; })} /></Panel></section>}

  {view === "settlements" && adminOnly && <section className="grid"><div className="notice">When you create a new settlement, the system pulls the driver’s last YTD gross, YTD deductions, and YTD net automatically, then adds the new gross/deductions/net live.</div><div className="grid" style={{ gridTemplateColumns: "minmax(280px,.85fr) 2fr" }}><Panel title="Settlement Information"><Field label="Settlement Number" value={draft.id} onChange={(v) => updateDraft("id", v)} /><Select label="Contractor / Driver" value={String(selectedDriverId)} options={drivers.map((d) => ({ value: String(d.id), label: `${d.name} — Truck ${d.truck}` }))} onChange={(id) => createNewSettlement(Number(id))} /><Field label="Truck Number" value={draft.truck} onChange={(v) => updateDraft("truck", v)} /><Field label="Period Start" type="date" value={draft.periodStart} onChange={(v) => updateDraft("periodStart", v)} /><Field label="Period End" type="date" value={draft.periodEnd} onChange={(v) => updateDraft("periodEnd", v)} /><Field label="Settlement Date" type="date" value={draft.settlementDate} onChange={(v) => updateDraft("settlementDate", v)} /></Panel><Panel title="Earnings"><div className="form-grid"><MoneyInput label="Linehaul" value={draft.earnings.linehaul} onChange={(v) => updateMoney("earnings", "linehaul", v)} /><MoneyInput label="Fuel Surcharge" value={draft.earnings.fuelSurcharge} onChange={(v) => updateMoney("earnings", "fuelSurcharge", v)} /><MoneyInput label="Detention" value={draft.earnings.detention} onChange={(v) => updateMoney("earnings", "detention", v)} /><MoneyInput label="Layover" value={draft.earnings.layover} onChange={(v) => updateMoney("earnings", "layover", v)} /><MoneyInput label="TONU" value={draft.earnings.tonu} onChange={(v) => updateMoney("earnings", "tonu", v)} /><MoneyInput label="Other Earnings" value={draft.earnings.other} onChange={(v) => updateMoney("earnings", "other", v)} /></div><div style={{ marginTop: 18 }}><Metric title="Gross Earnings Auto Total" value={money(draftTotals.gross)} tone="blue" /></div></Panel></div><Panel title="Deductions"><div className="deduction-grid">{[["Fuel","fuel"],["Dispatch Fees","dispatch"],["Insurance","insurance"],["Trailer Rent","trailer"],["Truck Lease","lease"],["Maintenance/Repair Escrow","maintenance"],["Advances","advances"],["Tolls","tolls"],["Scales","scales"],["ELD/GPS","eld"],["IFTA","ifta"],["Dashcam Fee","dashcam"],["Plates/Permits","plates"],["Same Day Pay Fee","sameDay"],["Other Company Fees","other"]].map(([label, key]) => <MoneyInput key={key} label={label} value={draft.deductions[key]} onChange={(v) => updateMoney("deductions", key, v)} />)}</div></Panel><div className="grid six"><Metric title="Previous YTD Gross" value={money(draft.previousYtdGross)} tone="slate" /><Metric title="New Gross" value={money(draftTotals.gross)} tone="blue" /><Metric title="New YTD Gross" value={money(draftTotals.ytdGross)} tone="blue" /><Metric title="Total Deductions" value={money(draftTotals.deductions)} tone="red" /><Metric title="New YTD Deductions" value={money(draftTotals.ytdDeductions)} tone="red" /><Metric title="Net Pay" value={money(draftTotals.net)} tone="green" /></div><Panel title="Driver Paystub Preview"><PaystubPreview settlement={draft} /></Panel><Panel title="Actions"><div className="actions"><button onClick={saveSettlement} className="primary">Save & Publish to Driver Portal</button><button className="darkbtn">Generate PDF</button><button className="greenbtn">Email Driver</button></div></Panel></section>}

  {view === "drivers" && <section className="grid" style={{ gridTemplateColumns: adminOnly ? "330px 1fr" : "1fr" }}>{adminOnly && <Panel title="Driver Accounts"><div className="driver-list">{drivers.map((d) => <button key={d.id} onClick={() => setSelectedDriverId(d.id)} className={`driver-card ${selectedDriver.id === d.id ? "active" : ""}`}>{d.name}<br /><small>Truck {d.truck} • {d.status}</small></button>)}</div></Panel>}<Panel title="Driver Portal"><div className="paystub-preview"><div className="pdf-head"><div><h2>Welcome, {selectedDriver.name}</h2><p>Review settlements, download PDFs, track assigned loads, upload POD, and confirm delivery.</p></div></div><div className="pdf-body"><div className="grid three">{latestDriverSettlement && <><Metric title="Latest Net Pay" value={money(totals(latestDriverSettlement).net)} tone="green" /><Metric title="YTD Gross" value={money(totals(latestDriverSettlement).ytdGross)} tone="blue" /><Metric title="YTD Net" value={money(totals(latestDriverSettlement).ytdNet)} tone="slate" /></>}</div><Table headers={["Settlement", "Date", "Gross", "Deductions", "Net", "Action"]} rows={driverSettlements.map((s) => { const t = totals(s); return [s.id, s.settlementDate, money(t.gross), money(t.deductions), money(t.net), "Download PDF"]; })} /></div></div></Panel></section>}

  {view === "dispatch" && adminOnly && <DispatchView selectedDriver={selectedDriver} drivers={drivers} />}
  {view === "bookkeeping" && adminOnly && <BookkeepingView revenue={revenue} expenses={expenses} />}
  {view === "accounting" && adminOnly && <AccountingView />}
  {view === "pdf" && <Panel title="PDF Center"><PaystubPreview settlement={latestDriverSettlement || draft} /></Panel>}
</main></div></div></>;
}

function PaystubPreview({ settlement }) {
  const t = totals(settlement);
  return <div className="paystub-preview"><div className="pdf-head"><div><h2>SUNZU LOGISTICS LLC</h2><p>1099 Owner Operator Settlement</p></div><div style={{ textAlign: "right" }}><strong>{settlement.id}</strong><br />{settlement.settlementDate}</div></div><div className="pdf-body"><div className="info-row"><Info label="Driver" value={settlement.driverName} /><Info label="Truck" value={settlement.truck} /><Info label="Period" value={`${settlement.periodStart || "—"} to ${settlement.periodEnd || "—"}`} /></div><div className="split"><div className="panel" style={{ boxShadow: "none", background: "#eff6ff" }}><h3>Earnings</h3>{Object.entries(settlement.earnings).map(([k, v]) => <Line key={k} label={labelMap[k] || k} value={money(v)} />)}<Line bold label="Gross Pay" value={money(t.gross)} /></div><div className="panel" style={{ boxShadow: "none", background: "#fef2f2" }}><h3>Deductions</h3>{Object.entries(settlement.deductions).map(([k, v]) => <Line key={k} label={labelMap[k] || k} value={money(v)} />)}<Line bold label="Total Deduction" value={money(t.deductions)} /></div></div><div className="grid four" style={{ marginTop: 18 }}><Metric title="YTD Gross" value={money(t.ytdGross)} tone="blue" /><Metric title="YTD Deductions" value={money(t.ytdDeductions)} tone="red" /><Metric title="YTD Net" value={money(t.ytdNet)} tone="slate" /><Metric title="Net Pay" value={money(t.net)} tone="green" /></div></div></div>;
}

function Metric({ title, value, tone }) { return <div className={`metric m-${tone || "slate"}`}><div className="label">{title}</div><div className="value">{value}</div></div>; }
function Panel({ title, children }) { return <section className="panel"><h3>{title}</h3>{children}</section>; }
function Field({ label, value = "", type = "text", onChange = () => {} }) { return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function Select({ label, value, options, onChange }) { return <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((x) => typeof x === "string" ? <option key={x} value={x}>{x}</option> : <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>; }
function MoneyInput({ label, value, onChange }) { return <label className="field"><span>{label}</span><input type="number" value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function Info({ label, value }) { return <div className="info"><small>{label}</small><strong>{value}</strong></div>; }
function Line({ label, value, bold }) { return <div className={`line ${bold ? "bold" : ""}`}><span>{label}</span><span>{value}</span></div>; }
function Table({ headers, rows }) { return <div style={{ overflowX: "auto" }}><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>; }
function DispatchView({ selectedDriver, drivers }) { return <section className="grid"><Panel title="Dispatch Load to Driver"><div className="form-grid"><Field label="Load Number" value="L-10024" /><Select label="Assign Driver" value={String(selectedDriver.id)} options={drivers.map((d) => ({ value: String(d.id), label: d.name }))} onChange={() => {}} /><Field label="Pickup City/State" value="Knoxville, TN" /><Field label="Delivery City/State" value="Atlanta, GA" /><Field label="Pickup Date" type="datetime-local" /><Field label="Delivery Date" type="datetime-local" /><Field label="Rate Confirmation Amount" value="2500" /><Field label="Broker / Customer" value="ABC Logistics" /></div><button className="primary">Send Load to Driver Portal</button></Panel></section>; }
function BookkeepingView({ revenue, expenses }) { return <section className="grid"><div className="grid three"><Metric title="Income" value={money(revenue)} tone="green" /><Metric title="Expenses" value={money(expenses)} tone="red" /><Metric title="Estimated Profit" value={money(revenue - expenses)} tone="blue" /></div><Panel title="Bookkeeping Ledger"><Table headers={["Date", "Account", "Type", "Amount"]} rows={ledger.map((x) => [x.date, x.account, x.type, money(x.amount)])} /></Panel></section>; }
function AccountingView() { return <section className="grid"><Panel title="QuickBooks-Style Accounting Center"><div className="grid four">{["Chart of Accounts", "Profit & Loss", "Balance Sheet", "Accounts Payable", "Accounts Receivable", "1099 Contractor Reports", "Tax Summary", "Bank Reconciliation"].map((item) => <div className="info" key={item}><strong>{item}</strong></div>)}</div></Panel></section>; }

ReactDOM.createRoot(document.getElementById("root")).render(<SunzuPaystubPro />);
