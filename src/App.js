import React, { useEffect, useState } from "react";
import {
  fetchExpenses,
  createExpense,
  deleteExpense,
  fetchMonthlyTotal,
} from "./api";
import "./App.css";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // THEME: "dark" or "light"
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // apply theme to <body> so CSS can react
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (e) {
      setError(e.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }

  async function loadMonthlyTotal(y = year, m = month) {
    try {
      const total = await fetchMonthlyTotal(y, m);
      setMonthlyTotal(total);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadExpenses();
    loadMonthlyTotal();
  }, []);

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!title || !category || !amount) {
      setError("Title, category and amount are required");
      return;
    }

    try {
      setError("");
      const newExpense = {
        title,
        category,
        amount: parseFloat(amount),
        date: date || null,
        notes,
      };
      const saved = await createExpense(newExpense);
      setExpenses((prev) => [...prev, saved]);
      setTitle("");
      setCategory("");
      setAmount("");
      setDate("");
      setNotes("");
      loadMonthlyTotal();
    } catch (e) {
      setError(e.message || "Failed to add expense");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      loadMonthlyTotal();
    } catch (e) {
      alert("Failed to delete");
    }
  }

  function handleMonthChange(e) {
    const m = Number(e.target.value);
    setMonth(m);
    loadMonthlyTotal(year, m);
  }

  function handleYearChange(e) {
    const y = Number(e.target.value);
    setYear(y);
    loadMonthlyTotal(y, month);
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <div className={`app app-${theme}`}>
      <header className="app-header">
        <h1>Smart Expense Tracker</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light mode" : "🌙 Dark mode"}
        </button>
      </header>

      <section className="summary-card">
        <h2>Monthly Summary</h2>
        <div className="summary-controls">
          <label>
            Year:
            <input
              type="number"
              value={year}
              onChange={handleYearChange}
              min="2000"
              max="2100"
            />
          </label>
          <label>
            Month:
            <select value={month} onChange={handleMonthChange}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                <option key={m} value={m}>
                  {m.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="total-amount">${monthlyTotal.toFixed(2)}</p>
      </section>

      <section className="form-card">
        <h2>Add Expense</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleAddExpense} className="expense-form">
          <div className="row">
            <input
              type="text"
              placeholder="Title (e.g. Groceries)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Category (e.g. Food)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="row">
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button type="submit">Add Expense</button>
        </form>
      </section>

      <section className="table-card">
        <h2>All Expenses</h2>
        {loading ? (
          <p>Loading...</p>
        ) : expenses.length === 0 ? (
          <p>No expenses yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.date || "-"}</td>
                  <td>{exp.title}</td>
                  <td>{exp.category}</td>
                  <td>${exp.amount.toFixed(2)}</td>
                  <td>{exp.notes || "-"}</td>
                  <td>
                    <button
                      className="danger"
                      onClick={() => handleDelete(exp.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
