import React, { useMemo, useState } from "react";

const users = [
  { email: "admin@sunzupaystub.com", password: "admin123", role: "Super Admin", name: "Sunzu Logistics Admin" },
  { email: "driver@sunzupaystub.com", password: "driver123", role: "Driver", name: "Jean Ndayishimiye", driverId: 1 }
];

const initialDrivers = [
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

export default function SunzuPaystubPro() {
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState("admin@sunzupaystub.com");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState("dashboard");
  const [drivers] = useState(initialDrivers);
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
    if (!found) {
      setLoginError("Wrong email or password.");
      return;
    }
    setSession(found);
    setLoginError("");
    if (found.role === "Driver") {
      setSelectedDriverId(found.driverId);
      setView("drivers");
    }
  };

  const logout = () => {
    setSession(null);
    setView("dashboard");
  };

  const createNewSettlement = (driverId = selectedDriver.id) => {
    const driver = drivers.find((d) => d.id === Number(driverId)) || drivers[0];
    const last = settlements.find((s) => s.driverId === driver.id);
    const lastTotals = last ? totals(last) : { ytdGross: 0, ytdDeductions: 0, ytdNet: 0 };
    const newDraft = {
      id: nextSettlementNumber(settlements),
      driverId: driver.id,
      driverName: driver.name,
      truck: driver.truck,
      periodStart: "",
      periodEnd: "",
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
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto grid min-h-[90vh] max-w-6xl items-center gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex rounded-3xl bg-blue-700 px-5 py-3 text-sm font-bold">SUNZU PAYSTUB PRO</div>
            <h1 className="text-5xl font-extrabold leading-tight">Professional trucking settlement, dispatch, and accounting system.</h1>
            <p className="mt-5 text-lg text-slate-300">Login as admin to create settlements, auto-fill YTD from the last paystub, dispatch loads, and manage bookkeeping. Drivers can login to review, download, and track their settlements and loads.</p>
          </div>
          <div className="rounded-[2rem] bg-white p-8 text-slate-900 shadow-2xl">
            <h2 className="text-3xl font-extrabold">Login</h2>
            <p className="mt-1 text-slate-500">Demo accounts are ready.</p>
            <div className="mt-6 space-y-4">
              <Field label="Email" value={loginEmail} onChange={setLoginEmail} />
              <Field label="Password" type="password" value={loginPassword} onChange={setLoginPassword} />
              {loginError && <div className="rounded-2xl bg-red-50 p-3 font-bold text-red-700">{loginError}</div>}
              <button onClick={login} className="w-full rounded-2xl bg-blue-700 px-5 py-4 text-lg font-extrabold text-white">Login</button>
            </div>
            <div className="mt-6 grid gap-3 text-sm">
              <button onClick={() => { setLoginEmail("admin@sunzupaystub.com"); setLoginPassword("admin123"); }} className="rounded-2xl bg-slate-100 p-3 text-left"><b>Admin:</b> admin@sunzupaystub.com / admin123</button>
              <button onClick={() => { setLoginEmail("driver@sunzupaystub.com"); setLoginPassword("driver123"); }} className="rounded-2xl bg-slate-100 p-3 text-left"><b>Driver:</b> driver@sunzupaystub.com / driver123</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const adminOnly = session.role !== "Driver";
  const navItems = adminOnly
    ? [["dashboard", "Dashboard"], ["settlements", "Settlements"], ["drivers", "Driver Portal"], ["dispatch", "Load Dispatch"], ["bookkeeping", "Bookkeeping"], ["accounting", "Accounting"], ["pdf", "PDF Center"]]
    : [["drivers", "My Portal"], ["pdf", "My PDFs"]];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-slate-950 p-5 text-white lg:block">
          <div className="rounded-3xl bg-blue-700 p-5 shadow-xl">
            <h1 className="text-2xl font-extrabold">Sunzu Paystub Pro</h1>
            <p className="mt-1 text-sm text-blue-100">{session.role}</p>
          </div>
          <nav className="mt-6 space-y-2">
            {navItems.map(([key, label]) => <button key={key} onClick={() => setView(key)} className={`w-full rounded-2xl px-4 py-3 text-left font-semibold ${view === key ? "bg-blue-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}>{label}</button>)}
          </nav>
          <button onClick={logout} className="mt-6 w-full rounded-2xl bg-red-700 px-4 py-3 font-bold text-white">Logout</button>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-xl md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold">Welcome, {session.name}</h2>
              <p className="text-slate-500">Auto-fill settlements from last paystub • Live YTD calculations • Driver preview matched to admin entry.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {adminOnly && <button onClick={() => createNewSettlement()} className="rounded-2xl bg-blue-700 px-5 py-3 font-bold text-white">Create New Settlement</button>}
              {adminOnly && <button onClick={() => setView("dispatch")} className="rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white">Assign Load</button>}
              <button onClick={logout} className="rounded-2xl bg-red-700 px-5 py-3 font-bold text-white lg:hidden">Logout</button>
            </div>
          </div>

          {view === "dashboard" && adminOnly && (
            <section className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"><Metric title="Total Load Revenue" value={money(revenue)} tone="blue" /><Metric title="Open Driver Payables" value={money(drivers.reduce((s, d) => s + (settlements.find((x) => x.driverId === d.id) ? totals(settlements.find((x) => x.driverId === d.id)).net : 0), 0))} tone="green" /><Metric title="Monthly Expenses" value={money(expenses)} tone="red" /><Metric title="Active Loads" value={loads.length} tone="slate" /></div>
              <Panel title="Recent Settlements"><Table headers={["Settlement", "Driver", "Gross", "Deductions", "Net", "YTD Net", "Status"]} rows={settlements.map((s) => { const t = totals(s); return [s.id, s.driverName, money(t.gross), money(t.deductions), money(t.net), money(t.ytdNet), s.status]; })} /></Panel>
            </section>
          )}

          {view === "settlements" && adminOnly && (
            <section className="space-y-6">
              <div className="rounded-3xl bg-amber-50 p-5 font-semibold text-amber-900 shadow">When you create a new settlement, the system pulls the driver’s last YTD gross, YTD deductions, and YTD net automatically, then adds the new gross/deductions/net live.</div>
              <div className="grid gap-6 xl:grid-cols-3">
                <Panel title="Settlement Information">
                  <Field label="Settlement Number" value={draft.id} onChange={(v) => updateDraft("id", v)} />
                  <Select label="Contractor / Driver" value={String(selectedDriverId)} options={drivers.map((d) => ({ value: String(d.id), label: `${d.name} — Truck ${d.truck}` }))} onChange={(id) => createNewSettlement(Number(id))} />
                  <Field label="Truck Number" value={draft.truck} onChange={(v) => updateDraft("truck", v)} />
                  <div className="grid grid-cols-2 gap-3"><Field label="Period Start" type="date" value={draft.periodStart} onChange={(v) => updateDraft("periodStart", v)} /><Field label="Period End" type="date" value={draft.periodEnd} onChange={(v) => updateDraft("periodEnd", v)} /></div>
                  <Field label="Settlement Date" type="date" value={draft.settlementDate} onChange={(v) => updateDraft("settlementDate", v)} />
                </Panel>
                <Panel title="Earnings" className="xl:col-span-2">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><MoneyInput label="Linehaul" value={draft.earnings.linehaul} onChange={(v) => updateMoney("earnings", "linehaul", v)} /><MoneyInput label="Fuel Surcharge" value={draft.earnings.fuelSurcharge} onChange={(v) => updateMoney("earnings", "fuelSurcharge", v)} /><MoneyInput label="Detention" value={draft.earnings.detention} onChange={(v) => updateMoney("earnings", "detention", v)} /><MoneyInput label="Layover" value={draft.earnings.layover} onChange={(v) => updateMoney("earnings", "layover", v)} /><MoneyInput label="TONU" value={draft.earnings.tonu} onChange={(v) => updateMoney("earnings", "tonu", v)} /><MoneyInput label="Other Earnings" value={draft.earnings.other} onChange={(v) => updateMoney("earnings", "other", v)} /></div>
                  <div className="mt-6 rounded-3xl bg-blue-50 p-6 text-blue-900"><p className="font-bold">Gross Earnings Auto Total</p><div className="text-5xl font-extrabold">{money(draftTotals.gross)}</div></div>
                </Panel>
              </div>
              <Panel title="Deductions"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{[["Fuel","fuel"],["Dispatch Fees","dispatch"],["Insurance","insurance"],["Trailer Rent","trailer"],["Truck Lease","lease"],["Maintenance/Repair Escrow","maintenance"],["Advances","advances"],["Tolls","tolls"],["Scales","scales"],["ELD/GPS","eld"],["IFTA","ifta"],["Dashcam Fee","dashcam"],["Plates/Permits","plates"],["Same Day Pay Fee","sameDay"],["Other Company Fees","other"]].map(([label, key]) => <MoneyInput key={key} label={label} value={draft.deductions[key]} onChange={(v) => updateMoney("deductions", key, v)} />)}</div></Panel>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6"><Metric title="Previous YTD Gross" value={money(draft.previousYtdGross)} tone="slate" /><Metric title="New Gross" value={money(draftTotals.gross)} tone="blue" /><Metric title="New YTD Gross" value={money(draftTotals.ytdGross)} tone="blue" /><Metric title="Total Deductions" value={money(draftTotals.deductions)} tone="red" /><Metric title="New YTD Deductions" value={money(draftTotals.ytdDeductions)} tone="red" /><Metric title="Net Pay" value={money(draftTotals.net)} tone="green" /></div>
              <Panel title="Driver Paystub Preview — Auto Matches This Settlement"><PaystubPreview settlement={draft} /></Panel>
              <div className="rounded-3xl bg-white p-6 shadow-xl"><div className="flex flex-wrap gap-3"><button onClick={saveSettlement} className="rounded-2xl bg-blue-700 px-6 py-4 font-bold text-white">Save & Publish to Driver Portal</button><button className="rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white">Generate PDF</button><button className="rounded-2xl bg-emerald-700 px-6 py-4 font-bold text-white">Email Driver</button></div></div>
            </section>
          )}

          {view === "drivers" && (
            <section className="grid gap-6 xl:grid-cols-3">
              {adminOnly && <Panel title="Driver Accounts">{drivers.map((d) => <button key={d.id} onClick={() => { setSelectedDriverId(d.id); }} className={`mb-3 w-full rounded-2xl p-4 text-left font-bold ${selectedDriver.id === d.id ? "bg-blue-700 text-white" : "bg-slate-100"}`}>{d.name}<br /><span className="text-sm opacity-75">Truck {d.truck} • {d.status}</span></button>)}</Panel>}
              <Panel title="Driver Portal Preview" className={adminOnly ? "xl:col-span-2" : "xl:col-span-3"}>
                <div className="rounded-3xl bg-slate-950 p-6 text-white"><h3 className="text-3xl font-extrabold">Welcome, {selectedDriver.name}</h3><p className="text-slate-300">Review settlements, download PDFs, track assigned loads, upload POD, and confirm delivery.</p></div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">{latestDriverSettlement ? <><Metric title="Latest Net Pay" value={money(totals(latestDriverSettlement).net)} tone="green" /><Metric title="YTD Gross" value={money(totals(latestDriverSettlement).ytdGross)} tone="blue" /><Metric title="YTD Net" value={money(totals(latestDriverSettlement).ytdNet)} tone="slate" /></> : <Metric title="No Settlement Yet" value="$0.00" tone="slate" />}</div>
                <div className="mt-6"><Table headers={["Settlement", "Date", "Gross", "Deductions", "Net", "Action"]} rows={driverSettlements.map((s) => { const t = totals(s); return [s.id, s.settlementDate, money(t.gross), money(t.deductions), money(t.net), "Download PDF"]; })} /></div>
              </Panel>
            </section>
          )}

          {view === "dispatch" && adminOnly && <DispatchView selectedDriver={selectedDriver} drivers={drivers} />}
          {view === "bookkeeping" && adminOnly && <BookkeepingView revenue={revenue} expenses={expenses} />}
          {view === "accounting" && adminOnly && <AccountingView />}
          {view === "pdf" && <Panel title="PDF Center"><p className="text-slate-600">Every published settlement will generate a clean letter-size PDF with no page-break text cutting, gross/deductions/net totals, YTD totals, and Sunzu branding.</p><div className="mt-5">{latestDriverSettlement && <PaystubPreview settlement={latestDriverSettlement} />}</div></Panel>}
        </main>
      </div>
    </div>
  );
}

function PaystubPreview({ settlement }) {
  const t = totals(settlement);
  return <div className="rounded-3xl border bg-white p-6"><div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row"><div><h3 className="text-3xl font-extrabold text-blue-900">SUNZU LOGISTICS LLC</h3><p className="font-semibold text-slate-500">1099 Owner Operator Settlement</p></div><div className="text-right"><p className="font-bold">{settlement.id}</p><p>{settlement.settlementDate}</p></div></div><div className="mt-5 grid gap-4 md:grid-cols-3"><Info label="Driver" value={settlement.driverName} /><Info label="Truck" value={settlement.truck} /><Info label="Period" value={`${settlement.periodStart || "—"} to ${settlement.periodEnd || "—"}`} /></div><div className="mt-6 grid gap-5 md:grid-cols-2"><div className="rounded-2xl bg-blue-50 p-5"><h4 className="font-extrabold text-blue-900">Earnings</h4>{Object.entries(settlement.earnings).map(([k, v]) => <Line key={k} label={labelMap[k] || k} value={money(v)} />)}<Line bold label="Gross Earnings" value={money(t.gross)} /></div><div className="rounded-2xl bg-red-50 p-5"><h4 className="font-extrabold text-red-900">Deductions</h4>{Object.entries(settlement.deductions).map(([k, v]) => <Line key={k} label={labelMap[k] || k} value={money(v)} />)}<Line bold label="Total Deductions" value={money(t.deductions)} /></div></div><div className="mt-6 grid gap-4 md:grid-cols-4"><Metric title="YTD Gross" value={money(t.ytdGross)} tone="blue" /><Metric title="YTD Deductions" value={money(t.ytdDeductions)} tone="red" /><Metric title="YTD Net" value={money(t.ytdNet)} tone="slate" /><Metric title="Net Pay" value={money(t.net)} tone="green" /></div></div>;
}

const labelMap = { linehaul: "Linehaul", fuelSurcharge: "Fuel Surcharge", detention: "Detention", layover: "Layover", tonu: "TONU", other: "Other", fuel: "Fuel", dispatch: "Dispatch Fees", insurance: "Insurance", trailer: "Trailer Rent", lease: "Truck Lease", maintenance: "Maintenance/Repair Escrow", advances: "Advances", tolls: "Tolls", scales: "Scales", eld: "ELD/GPS", ifta: "IFTA", dashcam: "Dashcam Fee", plates: "Plates/Permits", sameDay: "Same Day Pay Fee" };
function Line({ label, value, bold }) { return <div className={`flex justify-between border-b py-2 ${bold ? "mt-3 text-lg font-extrabold" : "font-semibold"}`}><span>{label}</span><span>{value}</span></div>; }
function Info({ label, value }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="font-extrabold">{value}</p></div>; }
function Metric({ title, value, tone }) { const colors = { blue: "bg-blue-700 text-white", green: "bg-emerald-700 text-white", red: "bg-red-700 text-white", slate: "bg-white text-slate-900" }; return <div className={`rounded-3xl p-6 shadow-xl ${colors[tone] || colors.slate}`}><p className="text-sm font-bold opacity-80">{title}</p><div className="mt-2 text-2xl font-extrabold">{value}</div></div>; }
function Panel({ title, children, className = "" }) { return <div className={`rounded-3xl bg-white p-6 shadow-xl ${className}`}><h2 className="mb-5 text-2xl font-extrabold">{title}</h2>{children}</div>; }
function Field({ label, value = "", type = "text", onChange = () => {} }) { return <label className="block"><span className="mb-1 block text-sm font-bold text-slate-600">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-600" /></label>; }
function Select({ label, value, options, onChange }) { return <label className="block"><span className="mb-1 block text-sm font-bold text-slate-600">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-600">{options.map((x) => typeof x === "string" ? <option key={x} value={x}>{x}</option> : <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>; }
function MoneyInput({ label, value, onChange }) { return <label className="block"><span className="mb-1 block text-sm font-bold text-slate-600">{label}</span><input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-600" /></label>; }
function Table({ headers, rows }) { return <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-separate border-spacing-y-2"><thead><tr>{headers.map((h) => <th key={h} className="px-4 py-2 text-left text-sm uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="bg-slate-50">{row.map((cell, j) => <td key={j} className="px-4 py-4 font-semibold first:rounded-l-2xl last:rounded-r-2xl">{cell}</td>)}</tr>)}</tbody></table></div>; }
function DispatchView({ selectedDriver, drivers }) { return <section className="space-y-6"><Panel title="Dispatch Load to Driver"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Load Number" value="L-10024" /><Select label="Assign Driver" value={String(selectedDriver.id)} options={drivers.map((d) => ({ value: String(d.id), label: d.name }))} onChange={() => {}} /><Field label="Pickup City/State" value="Knoxville, TN" /><Field label="Delivery City/State" value="Atlanta, GA" /><Field label="Pickup Date" type="datetime-local" /><Field label="Delivery Date" type="datetime-local" /><Field label="Rate Confirmation Amount" value="2500" /><Field label="Broker / Customer" value="ABC Logistics" /></div><button className="mt-5 rounded-2xl bg-blue-700 px-5 py-3 font-bold text-white">Send Load to Driver Portal</button></Panel></section>; }
function BookkeepingView({ revenue, expenses }) { return <section className="space-y-6"><div className="grid gap-5 md:grid-cols-3"><Metric title="Income" value={money(revenue)} tone="green" /><Metric title="Expenses" value={money(expenses)} tone="red" /><Metric title="Estimated Profit" value={money(revenue - expenses)} tone="blue" /></div><Panel title="Bookkeeping Ledger"><Table headers={["Date", "Account", "Type", "Amount"]} rows={ledger.map((x) => [x.date, x.account, x.type, money(x.amount)])} /></Panel></section>; }
function AccountingView() { return <section className="space-y-6"><Panel title="QuickBooks-Style Accounting Center"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{["Chart of Accounts", "Profit & Loss", "Balance Sheet", "Accounts Payable", "Accounts Receivable", "1099 Contractor Reports", "Tax Summary", "Bank Reconciliation"].map((item) => <div key={item} className="rounded-3xl border bg-slate-50 p-5 font-bold shadow-sm">{item}</div>)}</div></Panel></section>; }
