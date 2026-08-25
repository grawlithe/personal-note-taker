import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate when scrolled to top
    if (containerRef.current && containerRef.current.scrollTop <= 0 && !isRefreshing) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;

    if (delta > 0) {
      // Apply resistance curve for natural feel
      const dampened = Math.min(delta * 0.45, MAX_PULL);
      setPullDistance(dampened);
      setShowIndicator(true);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (touchStartY.current === null) return;
    touchStartY.current = null;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(50); // Hold at indicator position

      try {
        await onRefresh();
      } catch (err) {
        console.error('Refresh failed:', err);
      }

      // Short delay for visual feedback
      await new Promise(r => setTimeout(r, 400));
      setIsRefreshing(false);
    }

    setPullDistance(0);
    setTimeout(() => setShowIndicator(false), 300);
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = pullDistance * 3;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative flex-1 overflow-y-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull-to-Refresh Indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-300 ease-out"
        style={{
          height: showIndicator || isRefreshing ? `${pullDistance}px` : '0px',
          opacity: showIndicator || isRefreshing ? progress : 0,
          transition: pullDistance === 0 ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors duration-200 ${
              progress >= 1 || isRefreshing
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <RefreshCw
              className={`w-4.5 h-4.5 transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: isRefreshing ? undefined : `rotate(${rotation}deg)` }}
            />
          </div>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {isRefreshing ? 'Refreshing...' : progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
};
