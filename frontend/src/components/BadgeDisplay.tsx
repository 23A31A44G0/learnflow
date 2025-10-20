import React, { useState } from 'react';
import { useGamification } from '../context/GamificationContext';

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlocked?: boolean;
    unlockedAt?: string;
  }>;
}

const BadgeModal: React.FC<BadgeModalProps> = ({ isOpen, onClose, badges }) => {
  if (!isOpen) return null;

  const categories = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  const categoryNames = {
    milestone: '🎯 Milestones',
    performance: '⭐ Performance',
    streak: '🔥 Consistency',
    metacognitive: '🧠 Self-Awareness',
    feature: '🗺️ Explorer'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Badge Collection</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(categories).map(([category, categoryBadges]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {categoryNames[category as keyof typeof categoryNames] || category}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        badge.unlocked
                          ? 'border-yellow-300 bg-yellow-50 shadow-md'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-4xl mb-2 ${badge.unlocked ? '' : 'grayscale'}`}>
                          {badge.icon}
                        </div>
                        <h4 className={`font-semibold text-sm ${
                          badge.unlocked ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {badge.name}
                        </h4>
                        <p className={`text-xs mt-1 ${
                          badge.unlocked ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {badge.description}
                        </p>
                        {badge.unlocked && badge.unlockedAt && (
                          <p className="text-xs text-yellow-600 mt-2">
                            Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const BadgeDisplay: React.FC = () => {
  const { stats, badges, loading } = useGamification();
  const [showModal, setShowModal] = useState(false);

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-12 h-12 bg-gray-200 rounded-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const unlockedBadges = badges.filter(badge => badge.unlocked);
  const recentBadges = unlockedBadges
    .sort((a, b) => new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime())
    .slice(0, 4);

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Badges</h3>
          <span className="text-sm text-gray-600">
            {unlockedBadges.length}/{badges.length}
          </span>
        </div>
        
        <div className="flex gap-2 mb-3">
          {recentBadges.length > 0 ? (
            recentBadges.map((badge) => (
              <div
                key={badge.id}
                className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-yellow-300 shadow-sm"
                title={badge.name}
              >
                <span className="text-lg">{badge.icon}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                <span className="text-lg">🏆</span>
              </div>
              <span className="text-sm">Complete activities to earn badges!</span>
            </div>
          )}
          
          {/* Fill remaining slots */}
          {recentBadges.length > 0 && recentBadges.length < 4 && (
            [...Array(4 - recentBadges.length)].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border-2 border-gray-200 border-dashed"
              >
                <span className="text-gray-300">?</span>
              </div>
            ))
          )}
        </div>

        <div className="text-center">
          <span className="text-xs text-gray-500 hover:text-gray-700">
            Click to view all badges →
          </span>
        </div>
      </div>

      <BadgeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        badges={badges}
      />
    </>
  );
};

export default BadgeDisplay;
