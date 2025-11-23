const API_BASE = "http://localhost:9090/api/expenses";

export async function fetchExpenses() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function createExpense(expense) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error("Failed to create expense");
  return res.json();
}

export async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
}

export async function fetchMonthlyTotal(year, month) {
  const params = new URLSearchParams({ year, month });
  const res = await fetch(`${API_BASE}/total-month?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch total");
  return res.json();
}
