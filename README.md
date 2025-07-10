# 🧭 Journey Planner 🌍

🚀 A smart and feature-rich travel management web app built with **React** and **Firebase**, designed to help users plan, track, and enjoy their journeys with ease. Includes a powerful **Admin Panel**, **AI Mood Trips**, and **API-integrated destination explorer**.

---

## ✨ Features at a Glance

### 🔐 User Authentication
- Login via Email & Password
- Password reset functionality
- Profile Avatar display

### 🧳 Journey Management
- Add new trips with:
  - 🏙 Destination, Date, Transport, PNR
  - ⏱ Time, From ➡ To, Optional Connecting Transport
  - 📦 Packing List with real-time checklist and strikethrough
  - 🧾 Expenses tracker (with totals and categories)
  - 📒 Notes, 📞 Contacts, 🗺 Live Map and Weather
- ⬆ Show More / ⬇ Show Less toggles
- 🧹 Delete individual trips

### 🧠 AI Mood Trips
- Intelligent suggestion engine that recommends trips based on:
  - Country
  - State
  - Location
  - Category of interest (e.g., Adventure, Peace, Nature)
- Option to use 📍 Google Places API for dynamic discovery
- Supports both:
  - ✅ Static 4000+ location dataset (Excel/JSON)
  - 🌐 Real-time Google API (if checkbox enabled)
- Pagination & “Show More” buttons for additional results

### 🛠 Admin Panel (Restricted)
Only accessible by:
hrishavranjan2003@gmail.com

➕ Add posts with:

▪Title
▪Content
▪Media (Image, Audio, Video)
▪✏️ Edit or 🗑 Delete posts
▪🧠 Uploads are stored on Cloudinary
▪💬 View & delete any comments

📰 Admin Feed (For All Users)

▪🔍 View all updates from Admin
▪❤️ Like posts (once per user)
▪💬 Comment (with timestamp)
▪🧼 Delete own comments
▪📽 Media support: images, audio, and videos

📁 Project Structure
journey-planner/
│
├── public/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx         # Main journey UI
│   │   ├── AdminFeed.jsx         # Feed shown to all
│   │   ├── AdminPanel.jsx        # Admin-only post panel
│   │   ├── AiMoodTrips.jsx       # AI trip recommender
│   │   └── EditJourneyModal.jsx
│   ├── context/
│   │   └── UserContext.js        # Auth/user context
│   ├── css/                      # All custom styles
│   └── firebase.js               # Firebase setup
└── README.md

🧠 Tech Stack

▪⚛️ React.js (with Hooks)
▪🔥 Firebase Firestore & Auth
▪☁️ Cloudinary (media uploads)
▪📦 Vite (fast dev environment)
▪🍞 React Toastify (user alerts)
▪🌐 Axios (API calls)


🎨 UI Previews
Login Page 

▪💡 Future Enhancements
▪⏳ Multi-day trip plans with calendars
▪📍 Location-based reminders
▪🛎 Hotel and activity booking integration
▪📱 PWA support for offline usage

👨‍💻 Author
Hrishav Ranjan (@hrishavranjan2003@gmail.com
Final Year BTech
🚀 Passionate about building real-world AI-integrated applications.

📄 License
This project is open-source and free to use under the MIT License.
