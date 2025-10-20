import React from 'react';
import { isFrontendOnlyDeployment } from '../services/api.frontend-only';

const FrontendOnlyBanner: React.FC = () => {
  if (!isFrontendOnlyDeployment) return null;
  
  return (
    <div id="frontend-only-banner" className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 fixed bottom-0 right-0 left-0 z-50 shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold">Frontend-Only Demo Mode</p>
          <p className="text-sm">
            Running without a backend. API features are simulated with mock data.
            <span className="block text-xs mt-1">
              Deploy a backend and update REACT_APP_API_URL to enable full functionality.
            </span>
          </p>
        </div>
        <button 
          onClick={() => {
            const banner = document.getElementById('frontend-only-banner');
            if (banner) {
              banner.style.display = 'none';
            }
          }}
          className="text-yellow-700 hover:text-yellow-900"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default FrontendOnlyBanner;