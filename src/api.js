const API_BASE = "http://localhost:9090/api";

// ── Expenses ──────────────────────────────────────────────────────────────

export async function fetchExpenses() {
  const res = await fetch(`${API_BASE}/expenses`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function createExpense(expense) {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create expense");
  }
  return res.json();
}

export async function updateExpense(id, expense) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update expense");
  }
  return res.json();
}

export async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete expense");
}

export async function fetchMonthlyTotal(year, month) {
  const params = new URLSearchParams({ year, month });
  const res = await fetch(`${API_BASE}/expenses/total-month?${params}`);
  if (!res.ok) throw new Error("Failed to fetch monthly total");
  return res.json();
}

export async function fetchCategorySummary(year, month) {
  const params = new URLSearchParams({ year, month });
  const res = await fetch(`${API_BASE}/expenses/category-summary?${params}`);
  if (!res.ok) throw new Error("Failed to fetch category summary");
  return res.json();
}

export async function fetchMonthlyStats(months = 6) {
  const params = new URLSearchParams({ months });
  const res = await fetch(`${API_BASE}/expenses/monthly-stats?${params}`);
  if (!res.ok) throw new Error("Failed to fetch monthly stats");
  return res.json();
}

// ── Budgets ───────────────────────────────────────────────────────────────

export async function fetchBudgets() {
  const res = await fetch(`${API_BASE}/budgets`);
  if (!res.ok) throw new Error("Failed to fetch budgets");
  return res.json();
}

export async function saveBudget(budget) {
  const res = await fetch(`${API_BASE}/budgets`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(budget),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save budget");
  }
  return res.json();
}

export async function deleteBudget(id) {
  const res = await fetch(`${API_BASE}/budgets/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete budget");
}
