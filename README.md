# 🧠 AI Learning Companion

An AI-powered adaptive learning chatbot that teaches concepts interactively and adjusts difficulty based on your understanding.

Built with **React** + **Express** + **Google Gemini AI**.

---

## ✨ Features

- 🎯 **Adaptive Teaching** — Adjusts explanation complexity (Level 1–5) based on your answers
- 💬 **Interactive Chat** — Conversational UI with markdown-rich responses
- 🧪 **Assessment Questions** — Tests understanding after each explanation
- 🧠 **Internal User Model** — Tracks your level, understanding, and mistakes
- 🌙 **Dark Theme** — Premium dark UI with smooth animations

---

## 📁 Project Structure

```
Hack2Skill/
├── backend/
│   ├── server.js         # Express server + Gemini AI integration
│   ├── .env              # API key config (create this)
│   ├── .env.example      # Template for .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main chat component
│   │   ├── App.css       # Chat UI styles
│   │   ├── index.css     # Global styles & design tokens
│   │   └── main.jsx      # React entry point
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Google Gemini API Key** — Get one free at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Step 1: Configure API Key

Edit `backend/.env` and replace the placeholder with your actual key:

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
```

### Step 2: Start the Backend

```bash
cd backend
npm install       # (already done if you cloned fresh)
npm run dev
```

You should see:
```
🚀  Backend running on http://localhost:3001
🔑  API key loaded: AIzaSy...
```

### Step 3: Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install       # (already done if you cloned fresh)
npm run dev
```

Vite will start and show:
```
  ➜  Local:   http://localhost:5173/
```

### Step 4: Open the App

Go to **http://localhost:5173** in your browser and start learning!

---

## 🔧 API Endpoint

### `POST /chat`

**Request:**
```json
{
  "message": "Teach me about loops in Python",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! What do you want to learn?" }
  ]
}
```

**Response:**
```json
{
  "reply": "Great choice! Let me explain loops..."
}
```

### `GET /health`

Returns `{ "status": "ok" }` for health checks.

---

## 🎨 How It Works

1. **You pick a topic** — Tell the AI what you want to learn
2. **AI teaches** — Explains at your level with analogies and examples
3. **AI asks a question** — Tests your understanding
4. **You answer** — AI evaluates and adjusts difficulty
5. **Repeat** — Each response is adapted to your progress

The AI maintains an internal model that tracks:
- Your current **level** (1–5)
- Your **understanding** score
- Your **mistakes** for targeted review

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend  | React + Vite |
| Backend   | Node.js + Express |
| AI        | Google Gemini 2.0 Flash |
| Styling   | Vanilla CSS (dark theme) |
| Icons     | Lucide React |
| Markdown  | react-markdown |

---

## 📝 Notes

- No database is used — conversation history is maintained in the browser's state
- Session resets when you refresh the page
- The AI internally tracks a user model but doesn't expose it unless asked
- All API calls go through the Express backend (no direct browser → Gemini calls)
