import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const Footer: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <footer className={`mt-auto border-t transition-colors ${
      isDark 
        ? 'bg-gray-900 border-gray-700 text-gray-300' 
        : 'bg-white border-gray-200 text-gray-600'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <p className="text-sm">
            © 2024 GB Coder. Created by Girish Lade in Mumbai, India. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;