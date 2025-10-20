// Simple confetti animation utility
export const triggerConfetti = (element?: HTMLElement) => {
  const targetElement = element || document.body;
  
  // Create confetti container
  const confettiContainer = document.createElement('div');
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '100%';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = '9999';
  
  // Confetti colors
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  
  // Create confetti pieces
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'absolute';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationName = 'confetti-fall';
    confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
    confetti.style.animationTimingFunction = 'linear';
    confetti.style.animationIterationCount = '1';
    confetti.style.opacity = '0.8';
    
    confettiContainer.appendChild(confetti);
  }
  
  // Add CSS animation if not already added
  if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = `
      @keyframes confetti-fall {
        to {
          transform: translateY(100vh) rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  targetElement.appendChild(confettiContainer);
  
  // Remove confetti after animation
  setTimeout(() => {
    confettiContainer.remove();
  }, 5000);
};

// Badge unlock animation
export const triggerBadgeAnimation = (badgeName: string, badgeIcon: string) => {
  const notification = document.createElement('div');
  notification.className = 'badge-notification';
  notification.innerHTML = `
    <div class="badge-notification-content">
      <div class="badge-icon-large">${badgeIcon}</div>
      <div class="badge-info">
        <h3>Badge Unlocked!</h3>
        <p>${badgeName}</p>
      </div>
    </div>
  `;
  
  // Add styles if not already added
  if (!document.getElementById('badge-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'badge-notification-styles';
    style.textContent = `
      .badge-notification {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 1rem;
        z-index: 10000;
        animation: badge-popup 3s ease-in-out forwards;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      }
      
      .badge-notification-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .badge-icon-large {
        font-size: 3rem;
        animation: badge-bounce 2s infinite;
      }
      
      .badge-info h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: bold;
      }
      
      .badge-info p {
        margin: 0;
        font-size: 1rem;
        opacity: 0.9;
      }
      
      @keyframes badge-popup {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        30% { transform: translate(-50%, -50%) scale(1); }
        90% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      }
      
      @keyframes badge-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Remove notification after animation
  setTimeout(() => {
    notification.remove();
  }, 3000);
};

// Points animation
export const triggerPointsAnimation = (points: number, element?: HTMLElement) => {
  const targetElement = element || document.body;
  
  const pointsElement = document.createElement('div');
  pointsElement.textContent = `+${points} XP`;
  pointsElement.style.position = 'fixed';
  pointsElement.style.top = '20%';
  pointsElement.style.left = '50%';
  pointsElement.style.transform = 'translateX(-50%)';
  pointsElement.style.color = '#4CAF50';
  pointsElement.style.fontSize = '1.5rem';
  pointsElement.style.fontWeight = 'bold';
  pointsElement.style.zIndex = '9998';
  pointsElement.style.animation = 'points-float 2s ease-out forwards';
  pointsElement.style.pointerEvents = 'none';
  
  // Add CSS animation if not already added
  if (!document.getElementById('points-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'points-animation-styles';
    style.textContent = `
      @keyframes points-float {
        0% {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        100% {
          opacity: 0;
          transform: translateX(-50%) translateY(-50px);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  targetElement.appendChild(pointsElement);
  
  // Remove element after animation
  setTimeout(() => {
    pointsElement.remove();
  }, 2000);
};

// Level up animation
export const triggerLevelUpAnimation = (newLevel: number) => {
  const notification = document.createElement('div');
  notification.className = 'level-up-notification';
  notification.innerHTML = `
    <div class="level-up-content">
      <div class="level-up-icon">🎉</div>
      <div class="level-up-info">
        <h3>Level Up!</h3>
        <p>You reached Level ${newLevel}</p>
      </div>
    </div>
  `;
  
  // Add styles if not already added
  if (!document.getElementById('level-up-styles')) {
    const style = document.createElement('style');
    style.id = 'level-up-styles';
    style.textContent = `
      .level-up-notification {
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%) scale(0);
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 1rem;
        z-index: 10000;
        animation: level-up-popup 2.5s ease-in-out forwards;
        box-shadow: 0 15px 30px rgba(0,0,0,0.2);
      }
      
      .level-up-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .level-up-icon {
        font-size: 2rem;
      }
      
      .level-up-info h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.25rem;
        font-weight: bold;
      }
      
      .level-up-info p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.9;
      }
      
      @keyframes level-up-popup {
        0% { transform: translateX(-50%) scale(0); opacity: 0; }
        15% { transform: translateX(-50%) scale(1.1); opacity: 1; }
        25% { transform: translateX(-50%) scale(1); }
        85% { transform: translateX(-50%) scale(1); opacity: 1; }
        100% { transform: translateX(-50%) scale(0.9); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Remove notification after animation
  setTimeout(() => {
    notification.remove();
  }, 2500);
  
  // Trigger confetti for level up
  setTimeout(() => {
    triggerConfetti();
  }, 500);
};
