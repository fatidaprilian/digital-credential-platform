'use client';

import { Shield, X } from 'lucide-react';

interface AlertProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

export function Alert({ message, type, onClose }: AlertProps) {
  const isError = type === 'error';
  const baseBg = isError ? 'bg-red-500/20' : 'bg-green-500/20';
  const border = isError ? 'border-red-500/50' : 'border-green-500/50';
  const textColor = isError ? 'text-red-200' : 'text-green-200';
  const iconColor = isError ? 'text-red-400' : 'text-green-400';
  const title = isError ? 'Terjadi Kesalahan' : 'Berhasil';

  return (
    <div className={`fixed top-5 right-5 max-w-sm w-full ${baseBg} border ${border} rounded-xl p-4 z-50 shadow-lg backdrop-blur-sm`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Shield className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-semibold ${textColor}`}>{title}</h3>
          <p className={`mt-1 text-sm ${textColor}/80`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            type="button"
            onClick={onClose}
            className={`-mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 ${isError ? 'focus:ring-offset-red-500/20 focus:ring-red-600' : 'focus:ring-offset-green-500/20 focus:ring-green-600'}`}
          >
            <span className="sr-only">Tutup</span>
            <X className="h-4 w-4 text-[#EEEEEE]/70" />
          </button>
        </div>
      </div>
    </div>
  );
}