# FinMate (Pocket Cash) 🚀

FinMate is an AI-powered personal finance assistant designed specifically for university students in Sri Lanka. It helps students track their daily expenses, manage their monthly allowance, stay under budget, and receive personalized financial advice using AI.

## 🌟 Key Features

- **Smart Dashboard**: Instantly view your remaining pocket cash, monthly allowance, total spent, and your "Health Score".
- **AI Financial Advisor**: Integrated with Google Gemini AI to give personalized, student-friendly tips based on your spending habits.
- **Auto-Categorization**: Uses AI to automatically categorize expenses (e.g., Canteen, Transport, Education, Mobile) based on simple descriptions.
- **Dynamic Health Score**: A gamified score out of 100 that adjusts in real-time based on your spending pace versus your monthly allowance.
- **Customizable Budgets & Limits**: Set a monthly allowance and daily limits to get alerts if you are overspending.
- **Beautiful UI**: Modern, sleek mobile interface with full Dark Mode and Light Mode support.

## 🏗️ Tech Stack

### Mobile App (`/mobile-app`)
- **Framework**: React Native & Expo
- **Styling**: Custom Theme System (Light/Dark mode)
- **Icons**: Lucide React Native
- **Storage**: AsyncStorage for offline caching

### Backend API (`/backend`)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT & bcrypt for secure login/registration
- **AI Integration**: `@google/genai` (Gemini API) for expense categorization and advice

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas)
- Expo CLI (for mobile app)
- A Google Gemini API Key

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
4. Start the server:
   ```bash
   node index.js
   # Or run with nodemon if installed: npm run dev
   ```

### Mobile App Setup
1. Navigate to the `mobile-app` directory:
   ```bash
   cd mobile-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with your phone (using Expo Go) or run on an emulator (Android/iOS).

## 💡 How the AI Works

The AI (Gemini) is integrated deeply into the app's ecosystem:
1. **Categorization**: When a user quickly types an expense like "Bus fare to campus 100", the AI parses the text and automatically logs it under `Transport` with the correct amount.
2. **FinMate Advisor**: The backend feeds the user's recent transactions and category breakdown to the AI, allowing it to give highly contextual advice (e.g., "You've spent Rs. 4,000 on canteen food this week, try packing a lunch to save!").

## 📂 Project Structure

```text
├── backend/            # Express.js REST API, MongoDB models, AI services
├── mobile-app/         # React Native Expo application
├── frontend/           # Web-based view/dashboard components
└── README.md           # Project documentation
```

## 📜 License
This project is for educational and personal use.
