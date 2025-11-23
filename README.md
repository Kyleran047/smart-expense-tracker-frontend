# Smart Expense Tracker – Frontend (React)

This is the React frontend for my Smart Expense Tracker project.  
It connects to a Spring Boot backend and gives a simple dashboard to add, view, and manage personal expenses.

## Features

- Add expenses with **title, category, amount, date, notes**
- View all expenses in a responsive **table**
- **Delete** expenses
- See **monthly total** and change the year/month
- **Dark / Light mode** toggle using CSS theme variables
- Talks to the backend via REST API

## Tech Stack

- React (Create React App)
- JavaScript (ES6+)
- Fetch API for HTTP requests
- Custom CSS with theme variables (dark/light)

## Project Structure

```text
src/
 ├─ api.js         # Functions to call the backend API
 ├─ App.js         # Main UI and state management
 ├─ App.css        # Styling + dark/light theme
 └─ index.js       # App entry point
