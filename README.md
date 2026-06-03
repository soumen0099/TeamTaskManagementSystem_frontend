# Frontend — WorkPulse (Team Task Management System)

React + Vite frontend for WorkPulse.

## Quick start
1. Install dependencies:

```bash
cd Frontend
npm install
```

2. Environment:
- Copy `.env.example` to `.env` and set `VITE_API_TARGET` (e.g. `http://localhost:8800`).

3. Run dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Features
- Mobile-friendly responsive UI
- Auth flows (register/login)
- Profile page with avatar upload (uploads data URL to backend)

## Notes
- Tokens are stored in `localStorage`. For production consider httpOnly cookies.
- Avatar uploads currently send base64 data URLs; switching to cloud storage is recommended.
- API base path is proxied via Vite dev server to `VITE_API_TARGET`.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# TeamTaskManagementSystem_frontend
