
import React from 'react';
import { ArrowRight } from 'lucide-react';
import Logo from '../../components/Logo';

interface WelcomeViewProps {
  onStart: () => void;
  onStaffLogin: () => void; // Google sign-in (students)
  onAdminLogin: () => void; // Credential screen (admin/cashier/server)
  disabled?: boolean; // Disable button while auth is loading
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onStart, onStaffLogin, onAdminLogin, disabled = false }) => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-between p-8 bg-white max-w-md mx-auto relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      {/* Admin/Staff Login (top-right, old style) */}
      <div className="absolute top-0 right-0 p-4 sm:p-6 z-10">
        <button 
          onClick={onAdminLogin}
          disabled={disabled}
          className="px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-black/10 text-textSecondary font-bold text-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Admin / Staff
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <Logo size="xl" className="mb-6 sm:mb-8" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-textMain leading-tight">
          Fast meals.<br />Zero chaos.
        </h1>
        <p className="mt-4 sm:mt-6 text-textSecondary text-base sm:text-lg md:text-xl px-4 sm:px-6">
          Order your favorite college meals in seconds. No queues, just food.
        </p>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={onStaffLogin}
          disabled={disabled}
          className="w-full bg-black text-white font-black py-5 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] text-lg"
        >
          Continue with Google
        </button>
        <button
          onClick={onStart}
          disabled={disabled}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-primary/20 min-h-[56px] text-lg"
        >
          Start Ordering
          <ArrowRight className="ml-2 w-6 h-6" />
        </button>
        <p className="text-center text-sm text-textSecondary mt-6">
          Designed for Day Scholars @ Campus
        </p>
      </div>
    </div>
  );
};

export default WelcomeView;
