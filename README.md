# ExpenseIQ – Frontend (React)

The React frontend for ExpenseIQ, a full-stack personal finance tracker. Features an interactive dashboard with charts, budget tracking, and full expense management — all connected to a Spring Boot REST API.

## Features

### Dashboard
- **KPI cards** — monthly total, daily average, top category, total transactions
- **Spending trend chart** — 6-month area chart (Recharts)
- **Category breakdown** — interactive donut chart (Recharts)
- **Recent expenses** — quick view of latest 5 entries
- **vs Last Month** — percentage change indicator

### Expenses
- Add expenses with title, category, amount, date, and notes
- **Predefined category dropdown** — Food, Transport, Housing, Utilities, and more
- **Inline row editing** — edit any expense directly in the table
- **Sortable columns** — click any header to sort ascending/descending
- **Search & filter** — filter by text or category
- **CSV export** — download all expenses as a spreadsheet
- Delete expenses with confirmation

### Budgets
- Set monthly spending limits per category
- Color-coded progress bars — green → yellow (80%) → red (over budget)
- Real-time over-budget and near-limit alerts
- Inline editing with keyboard shortcuts (Enter to save, Escape to cancel)

### General
- **Toast notifications** — replaces all browser alerts with smooth slide-in toasts
- **Dark / Light mode** toggle
- Fully responsive — works on mobile and desktop

## Tech Stack

- React 19 (Create React App)
- Recharts — area chart and donut chart
- JavaScript (ES6+)
- Fetch API for HTTP requests
- Custom CSS with theme variables (dark/light)

## Running Locally

Make sure the backend is running on `http://localhost:9090`, then:

```bash
npm install
npm start
```

App opens at `http://localhost:3000`.

## Project Structure

```
src/
 ├─ api.js         # All backend API calls (expenses + budgets)
 ├─ App.js         # Main app — tabs, state, components
 ├─ App.css        # Full design system with dark/light themes
 └─ index.js       # Entry point
```

## Backend

This frontend connects to the [Spring Boot backend](https://github.com/Kyleran047/smart-expense-tracker-backend).
