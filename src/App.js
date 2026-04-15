import React, { useEffect, useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  fetchExpenses, createExpense, updateExpense, deleteExpense,
  fetchMonthlyTotal, fetchCategorySummary, fetchMonthlyStats,
  fetchBudgets, saveBudget, deleteBudget,
} from "./api";
import "./App.css";

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Food", "Transport", "Housing", "Utilities",
  "Entertainment", "Health", "Shopping", "Education", "Other",
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CATEGORY_COLORS = {
  Food:          "#22c55e",
  Transport:     "#3b82f6",
  Housing:       "#f59e0b",
  Utilities:     "#8b5cf6",
  Entertainment: "#ec4899",
  Health:        "#14b8a6",
  Shopping:      "#f97316",
  Education:     "#06b6d4",
  Other:         "#6b7280",
};

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || "#94a3b8";
}

function fmt(n) {
  return `$${parseFloat(n || 0).toFixed(2)}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub, trendPct }) {
  const hasTraend = trendPct !== null && trendPct !== undefined;
  const up = trendPct > 0;
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
      {hasTraend && (
        <span className={`kpi-trend ${up ? "kpi-up" : "kpi-down"}`}>
          {up ? "▲" : "▼"} {Math.abs(trendPct).toFixed(1)}% vs last month
        </span>
      )}
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="sort-icon">⇅</span>;
  return <span className="sort-icon active">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{fmt(payload[0].value)}</p>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState(0);

  // Data
  const [expenses, setExpenses] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [budgets, setBudgets] = useState([]);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Period
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // Add-expense form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // Inline edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Budget inline edits: { [category]: stringValue | undefined }
  const [budgetEdits, setBudgetEdits] = useState({});

  // Table filter / sort
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // UI
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    loadAll();
    loadMonthlyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toast helpers ─────────────────────────────────────────────────────────

  function toast(message, type = "success") {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  // ── Data loaders ─────────────────────────────────────────────────────────

  async function loadAll() {
    setLoading(true);
    const [expRes, statsRes, budgetsRes] = await Promise.allSettled([
      fetchExpenses(),
      fetchMonthlyStats(6),
      fetchBudgets(),
    ]);
    if (expRes.status === "fulfilled") setExpenses(expRes.value);
    if (statsRes.status === "fulfilled") setMonthlyStats(statsRes.value);
    if (budgetsRes.status === "fulfilled") setBudgets(budgetsRes.value);
    setLoading(false);
  }

  async function loadMonthlyData(y = year, m = month) {
    const [totalRes, catsRes] = await Promise.allSettled([
      fetchMonthlyTotal(y, m),
      fetchCategorySummary(y, m),
    ]);
    if (totalRes.status === "fulfilled") setMonthlyTotal(totalRes.value);
    if (catsRes.status === "fulfilled") setCategoryData(catsRes.value);
    else setCategoryData([]);
  }

  // ── Expense handlers ─────────────────────────────────────────────────────

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!title || !category || !amount) {
      toast("Title, category and amount are required", "error");
      return;
    }
    try {
      const saved = await createExpense({
        title, category, amount: parseFloat(amount),
        date: date || null, notes,
      });
      setExpenses((prev) => [...prev, saved]);
      setTitle(""); setCategory("Food"); setAmount(""); setDate(""); setNotes("");
      await Promise.all([loadMonthlyData(), loadAll()]);
      toast("Expense added!");
    } catch (err) {
      toast(err.message || "Failed to add expense", "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      await Promise.all([loadMonthlyData(), loadAll()]);
      toast("Expense deleted", "info");
    } catch {
      toast("Failed to delete", "error");
    }
  }

  function startEdit(exp) {
    setEditingId(exp.id);
    setEditForm({
      title: exp.title, category: exp.category,
      amount: exp.amount, date: exp.date || "", notes: exp.notes || "",
    });
  }

  function cancelEdit() { setEditingId(null); setEditForm({}); }

  async function saveEdit(id) {
    try {
      const saved = await updateExpense(id, {
        ...editForm, amount: parseFloat(editForm.amount),
      });
      setExpenses((prev) => prev.map((exp) => (exp.id === id ? saved : exp)));
      cancelEdit();
      await Promise.all([loadMonthlyData(), loadAll()]);
      toast("Changes saved!");
    } catch {
      toast("Failed to save changes", "error");
    }
  }

  // ── Budget handlers ───────────────────────────────────────────────────────

  async function handleSaveBudget(cat, limitStr) {
    const limit = parseFloat(limitStr);
    if (isNaN(limit) || limit <= 0) {
      toast("Enter a valid positive amount", "error");
      return;
    }
    try {
      const saved = await saveBudget({ category: cat, monthlyLimit: limit });
      setBudgets((prev) => {
        const exists = prev.find((b) => b.category === cat);
        return exists ? prev.map((b) => (b.category === cat ? saved : b)) : [...prev, saved];
      });
      setBudgetEdits((prev) => { const n = { ...prev }; delete n[cat]; return n; });
      toast(`Budget set for ${cat}!`);
    } catch {
      toast("Failed to save budget", "error");
    }
  }

  async function handleDeleteBudget(id, cat) {
    try {
      await deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      toast(`Budget removed for ${cat}`, "info");
    } catch {
      toast("Failed to remove budget", "error");
    }
  }

  // ── Period & sort ─────────────────────────────────────────────────────────

  function handleMonthChange(e) {
    const m = Number(e.target.value);
    setMonth(m);
    loadMonthlyData(year, m);
  }

  function handleYearChange(e) {
    const y = Number(e.target.value);
    setYear(y);
    loadMonthlyData(y, month);
  }

  function handleSort(field) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  // ── CSV export ────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = ["Date", "Title", "Category", "Amount", "Notes"];
    const rows = expenses.map((exp) => [
      exp.date || "", exp.title, exp.category,
      parseFloat(exp.amount).toFixed(2), exp.notes || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "expenses.csv"; a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported!");
  }

  // ── Derived / memoized data ───────────────────────────────────────────────

  const chartStats = useMemo(
    () =>
      monthlyStats.map((s) => ({
        ...s,
        total: parseFloat(s.total),
        label: MONTH_NAMES[s.month - 1].slice(0, 3) + " '" + String(s.year).slice(2),
      })),
    [monthlyStats]
  );

  const vsLastMonth = useMemo(() => {
    if (chartStats.length < 2) return null;
    const curr = chartStats.find((s) => s.year === year && s.month === month);
    const prevDate = new Date(year, month - 2);
    const prev = chartStats.find(
      (s) => s.year === prevDate.getFullYear() && s.month === prevDate.getMonth() + 1
    );
    if (!curr || !prev || prev.total === 0) return null;
    return ((curr.total - prev.total) / prev.total) * 100;
  }, [chartStats, year, month]);

  const dailyAvg = useMemo(() => {
    if (monthlyTotal === 0) return 0;
    const isCurrent = year === today.getFullYear() && month === today.getMonth() + 1;
    const days = isCurrent ? today.getDate() : new Date(year, month, 0).getDate();
    return monthlyTotal / days;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyTotal, year, month]);

  const topCategory = useMemo(
    () => (categoryData.length > 0 ? categoryData[0] : null),
    [categoryData]
  );

  const uniqueCategories = useMemo(() => {
    const cats = [...new Set(expenses.map((e) => e.category))].sort();
    return ["All", ...cats];
  }, [expenses]);

  const displayedExpenses = useMemo(() => {
    let filtered = expenses.filter((exp) => {
      const text = filterText.toLowerCase();
      const matchText =
        !text ||
        exp.title.toLowerCase().includes(text) ||
        exp.category.toLowerCase().includes(text) ||
        (exp.notes || "").toLowerCase().includes(text);
      const matchCat = filterCategory === "All" || exp.category === filterCategory;
      return matchText && matchCat;
    });
    filtered.sort((a, b) => {
      let vA = a[sortField] ?? "";
      let vB = b[sortField] ?? "";
      if (sortField === "amount") { vA = parseFloat(vA) || 0; vB = parseFloat(vB) || 0; }
      else { vA = String(vA).toLowerCase(); vB = String(vB).toLowerCase(); }
      if (vA < vB) return sortDir === "asc" ? -1 : 1;
      if (vA > vB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [expenses, filterText, filterCategory, sortField, sortDir]);

  const budgetMap = useMemo(() => {
    const m = {};
    budgets.forEach((b) => { m[b.category] = b; });
    return m;
  }, [budgets]);

  const categorySpendMap = useMemo(() => {
    const m = {};
    categoryData.forEach((c) => { m[c.category] = parseFloat(c.total); });
    return m;
  }, [categoryData]);

  const accentColor = theme === "dark" ? "#818cf8" : "#4f46e5";
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const recentExpenses = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 5),
    [expenses]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`app app-${theme}`}>
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      {/* Header */}
      <header className="app-header">
        <div className="app-brand">
          <span className="brand-icon">💸</span>
          <span className="brand-name">ExpenseIQ</span>
        </div>
        <button className="theme-toggle" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? "☀ Light" : "🌙 Dark"}
        </button>
      </header>

      {/* Tab bar */}
      <nav className="tab-bar">
        {[
          { label: "Dashboard", icon: "📊" },
          { label: "Expenses",  icon: "💳" },
          { label: "Budgets",   icon: "🎯" },
        ].map(({ label, icon }, i) => (
          <button
            key={label}
            className={`tab-btn${activeTab === i ? " tab-active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            <span className="tab-icon">{icon}</span>
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── DASHBOARD ── */}
      {activeTab === 0 && (
        <div className="tab-content">

          <div className="period-row">
            <select value={month} onChange={handleMonthChange} className="period-select">
              {MONTH_NAMES.map((n, i) => (
                <option key={i + 1} value={i + 1}>{n}</option>
              ))}
            </select>
            <input
              type="number" value={year} onChange={handleYearChange}
              min="2000" max="2100" className="period-year"
            />
          </div>

          {/* KPI cards */}
          <div className="kpi-grid">
            <KpiCard
              label="This Month"
              value={fmt(monthlyTotal)}
              trendPct={vsLastMonth}
            />
            <KpiCard
              label="Daily Average"
              value={fmt(dailyAvg)}
              sub={`${MONTH_NAMES[month - 1]} ${year}`}
            />
            <KpiCard
              label="Top Category"
              value={topCategory ? topCategory.category : "—"}
              sub={topCategory ? fmt(topCategory.total) : "No data"}
            />
            <KpiCard
              label="Total Transactions"
              value={expenses.length.toString()}
              sub="all time"
            />
          </div>

          {/* Charts */}
          <div className="charts-row">
            <div className="chart-card">
              <h3>Spending Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={accentColor} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    width={62}
                  />
                  <RechartsTip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={accentColor}
                    fill="url(#areaGrad)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: accentColor, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>By Category</h3>
              {categoryData.length === 0 ? (
                <p className="empty-state chart-empty">No data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {categoryData.map((item) => (
                        <Cell key={item.category} fill={getCategoryColor(item.category)} />
                      ))}
                    </Pie>
                    <RechartsTip formatter={(v) => [fmt(v), ""]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent */}
          <div className="card">
            <h3 className="card-title">Recent Expenses</h3>
            {recentExpenses.length === 0 ? (
              <p className="empty-state">No expenses yet — add some in the Expenses tab.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>{exp.date || "—"}</td>
                      <td>{exp.title}</td>
                      <td>
                        <span
                          className="category-badge"
                          style={{
                            background: getCategoryColor(exp.category) + "22",
                            color: getCategoryColor(exp.category),
                            borderColor: getCategoryColor(exp.category) + "66",
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="amount-cell">{fmt(exp.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── EXPENSES ── */}
      {activeTab === 1 && (
        <div className="tab-content">
          <div className="card">
            <h2 className="card-title">Add Expense</h2>
            <form onSubmit={handleAddExpense} className="expense-form">
              <div className="row">
                <input
                  type="text" placeholder="Title (e.g. Groceries)"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                />
                <select
                  value={category} onChange={(e) => setCategory(e.target.value)}
                  className="category-select"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="row">
                <input
                  type="number" step="0.01" placeholder="Amount ($)"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                />
                <input
                  type="date" value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={notes} onChange={(e) => setNotes(e.target.value)}
              />
              <button type="submit" className="btn-primary">Add Expense</button>
            </form>
          </div>

          <div className="card">
            <div className="table-header-row">
              <h2 className="card-title">All Expenses</h2>
              <div className="table-filters">
                <input
                  type="text" placeholder="Search…"
                  value={filterText} onChange={(e) => setFilterText(e.target.value)}
                  className="filter-input"
                />
                <select
                  value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="filter-select"
                >
                  {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn-ghost" onClick={exportCSV}>⬇ CSV</button>
              </div>
            </div>

            {loading ? (
              <p className="loading-text">Loading…</p>
            ) : displayedExpenses.length === 0 ? (
              <p className="empty-state">
                {expenses.length === 0
                  ? "No expenses yet — add one above!"
                  : "No expenses match your filters."}
              </p>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => handleSort("date")}>
                        Date <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="sortable" onClick={() => handleSort("title")}>
                        Title <SortIcon field="title" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="sortable" onClick={() => handleSort("category")}>
                        Category <SortIcon field="category" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="sortable" onClick={() => handleSort("amount")}>
                        Amount <SortIcon field="amount" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedExpenses.map((exp) =>
                      editingId === exp.id ? (
                        <tr key={exp.id} className="edit-row">
                          <td>
                            <input type="date" value={editForm.date}
                              onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                              className="edit-input" />
                          </td>
                          <td>
                            <input type="text" value={editForm.title}
                              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                              className="edit-input" />
                          </td>
                          <td>
                            <select value={editForm.category}
                              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                              className="edit-input">
                              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td>
                            <input type="number" step="0.01" value={editForm.amount}
                              onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                              className="edit-input" />
                          </td>
                          <td>
                            <input type="text" value={editForm.notes}
                              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                              className="edit-input" />
                          </td>
                          <td className="action-cell">
                            <button className="save-btn" onClick={() => saveEdit(exp.id)} title="Save">✓</button>
                            <button className="cancel-btn" onClick={cancelEdit} title="Cancel">✕</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={exp.id}>
                          <td>{exp.date || "—"}</td>
                          <td>{exp.title}</td>
                          <td>
                            <span
                              className="category-badge"
                              style={{
                                background: getCategoryColor(exp.category) + "22",
                                color: getCategoryColor(exp.category),
                                borderColor: getCategoryColor(exp.category) + "66",
                              }}
                            >
                              {exp.category}
                            </span>
                          </td>
                          <td className="amount-cell">{fmt(exp.amount)}</td>
                          <td className="notes-cell">{exp.notes || "—"}</td>
                          <td className="action-cell">
                            <button className="edit-btn" onClick={() => startEdit(exp)} title="Edit">✎</button>
                            <button className="danger" onClick={() => handleDelete(exp.id)} title="Delete">✕</button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
                <p className="result-count">
                  {displayedExpenses.length === expenses.length
                    ? `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`
                    : `${displayedExpenses.length} of ${expenses.length} expenses`}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── BUDGETS ── */}
      {activeTab === 2 && (
        <div className="tab-content">
          <div className="card">
            <h2 className="card-title">Monthly Budgets</h2>
            <p className="section-sub">
              Set per-category spending limits. Progress is tracked against the selected month.
            </p>

            <div className="period-row">
              <select value={month} onChange={handleMonthChange} className="period-select">
                {MONTH_NAMES.map((n, i) => (
                  <option key={i + 1} value={i + 1}>{n}</option>
                ))}
              </select>
              <input
                type="number" value={year} onChange={handleYearChange}
                min="2000" max="2100" className="period-year"
              />
            </div>

            <div className="budget-list">
              {CATEGORIES.map((cat) => {
                const budget = budgetMap[cat];
                const spent = categorySpendMap[cat] || 0;
                const limit = budget ? parseFloat(budget.monthlyLimit) : null;
                const pct = limit ? Math.min((spent / limit) * 100, 100) : 0;
                const over = limit && spent > limit;
                const near = limit && !over && pct >= 80;
                const barColor = over ? "#ef4444" : near ? "#f59e0b" : getCategoryColor(cat);
                const isEditing = budgetEdits[cat] !== undefined;

                return (
                  <div key={cat} className={`budget-row${over ? " budget-over" : near ? " budget-near" : ""}`}>
                    <div className="budget-cat">
                      <span className="budget-dot" style={{ background: getCategoryColor(cat) }} />
                      <span className="budget-cat-name">{cat}</span>
                    </div>

                    <div className="budget-center">
                      <div className="budget-bar-bg">
                        <div
                          className="budget-bar-fill"
                          style={{ width: limit ? `${pct}%` : "0%", background: barColor }}
                        />
                      </div>
                      <div className="budget-amounts">
                        <span className="spent-label">{fmt(spent)} spent</span>
                        {limit && (
                          <span className={over ? "text-danger" : near ? "text-warn" : "text-muted"}>
                            {over
                              ? `⚠ Over by ${fmt(spent - limit)}`
                              : `${fmt(limit)} limit · ${pct.toFixed(0)}%`}
                          </span>
                        )}
                        {!limit && <span className="text-muted">No limit set</span>}
                      </div>
                    </div>

                    <div className="budget-actions">
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="$"
                            value={budgetEdits[cat]}
                            onChange={(e) =>
                              setBudgetEdits((p) => ({ ...p, [cat]: e.target.value }))
                            }
                            className="budget-input"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveBudget(cat, budgetEdits[cat]);
                              if (e.key === "Escape") setBudgetEdits((p) => { const n = {...p}; delete n[cat]; return n; });
                            }}
                          />
                          <button
                            className="save-btn"
                            onClick={() => handleSaveBudget(cat, budgetEdits[cat])}
                          >✓</button>
                          <button
                            className="cancel-btn"
                            onClick={() => setBudgetEdits((p) => { const n = {...p}; delete n[cat]; return n; })}
                          >✕</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-ghost"
                            onClick={() =>
                              setBudgetEdits((p) => ({ ...p, [cat]: limit ? String(limit) : "" }))
                            }
                          >
                            {limit ? "Edit" : "Set limit"}
                          </button>
                          {budget && (
                            <button
                              className="btn-ghost btn-ghost-danger"
                              onClick={() => handleDeleteBudget(budget.id, cat)}
                              title="Remove budget"
                            >
                              ✕
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
