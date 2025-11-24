import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';

const MainLayout = () => (
  <div className="relative min-h-screen overflow-hidden text-slate-900">
    <div className="pointer-events-none absolute inset-0 -z-20 opacity-90">
      <div className="absolute left-1/2 top-[-20%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-br from-rose-200/50 via-orange-200/25 to-transparent blur-[140px]" />
      <div className="absolute -left-24 top-1/3 h-[360px] w-[360px] rounded-full bg-gradient-to-br from-rose-300/35 via-pink-200/25 to-transparent blur-[140px] animate-soft-float" />
      <div className="absolute -right-24 bottom-0 h-[320px] w-[320px] rounded-full bg-gradient-to-tr from-amber-200/35 via-rose-200/15 to-transparent blur-[140px] animate-soft-float" />
    </div>
    <Header />
  <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-24 md:pt-32">
      <Outlet />
    </main>
  </div>
);

export default MainLayout;
