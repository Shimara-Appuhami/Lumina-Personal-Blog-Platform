# Lumina — Personal Blog Platform

Lumina is a full‑stack MERN personal blog platform built for storytellers. Authors can publish rich posts with cover images, readers can explore and engage through likes and threaded comments, and admins have role-aware controls. The project focuses on a polished writing experience, audience engagement, and simple deployment.

---

## 🚀 Highlights

- Modern authoring experience: rich text editing with React Quill, tag management, cover uploads, and optimistic UI updates via React Query.
- Audience engagement: likes, threaded comments with replies, and a notification dropdown marking activity as read.
- Profiles and avatars: public profile pages, editable bios, and avatar uploads (local storage by default; optional Cloudinary integration).
- Secure access: JWT authentication, protected routes, and role-aware UI for editing posts or profiles.
- Polished interface: Tailwind-inspired UI, glassmorphism cards, responsive design, and smooth loading states.

---

## 🧰 Tech Stack

| Layer     | Technologies |
|-----------|--------------|
| Frontend  | React 18, Vite, React Router 6, React Hook Form, @tanstack/react-query, Axios |
| Styling   | Tailwind CSS (utility classes), custom CSS, Headless UI patterns |
| Backend   | Node.js, Express.js, MongoDB, Mongoose |
| Auth      | JSON Web Tokens (JWT), bcrypt |
| Uploads   | Multer (in-memory), image storage in server/uploads (or Cloudinary) |

---

## ⚙️ Prerequisites

- Node.js 18+ and npm (or yarn)
- MongoDB (local instance or MongoDB Atlas)
- Optional: Cloudinary account (if using cloud image storage)

---

## Getting Started

1. Clone the repo and change into the project directory:

```bash
git clone https://github.com/Shimara-Appuhami/Lumina-Personal-Blog-Platform.git
cd Lumina-Personal-Blog-Platform
```

2. Install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Configure environment variables

Copy the example env and edit values:

```bash
cp .env.example .env
```

Then open `.env` and set the appropriate values.

Environment variables used:

| Variable      | Purpose |
|---------------|---------|
| PORT          | Express server port (default: 5000) |
| MONGO_URI     | MongoDB connection string |
| JWT_SECRET    | Secret key for JWT signing |
| JWT_EXPIRES_IN| Token lifetime (e.g., 7d) |
| CLIENT_URL    | Vite dev URL (e.g., http://localhost:5173) |
| SERVER_URL    | API origin for serving uploaded files (e.g., http://localhost:5000) |

Note: Uploaded images are stored locally under `server/uploads` by default. If you wish to use Cloudinary, configure `CLOUDINARY_URL` and enable Cloudinary integration in the server config.

4. Run in development

Use two terminals (one for backend, one for frontend):

Backend

```bash
cd server
npm run dev
```

Backend default: http://localhost:5000

Frontend

```bash
cd client
npm run dev
```

Frontend default: http://localhost:5173

---

## 🛠 Helpful Scripts

- server: `npm run dev` — Start Express server with nodemon (dev)
- client: `npm run dev` — Start Vite development server


(Exact script names and behaviors are defined in each package.json inside `/server` and `/client`.)

---




