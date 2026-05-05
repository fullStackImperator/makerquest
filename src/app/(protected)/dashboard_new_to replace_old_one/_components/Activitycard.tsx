// components/activity-card.tsx
"use client";

import { useState, useEffect } from "react";
import { Trophy, Clock, Zap, Book, Star, Zap as ZapIcon, Route } from "lucide-react";

const iconMap = {
  book: Book,
  star: Star,
  zap: ZapIcon,
  route: Route,  // Füge weitere Icons hinzu
};

interface ActivityCardProps {
  title: string;
  icon: keyof typeof iconMap;  // String statt Component
  items: Array<{ title: string; subtitle: string; status: string }>;
}

export function ActivityCard({ title, icon, items }: ActivityCardProps) {
  const Icon = iconMap[icon];
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxVisible = 3;
  const hasMoreItems = items.length > maxVisible;

  useEffect(() => {
    if (!hasMoreItems) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex + maxVisible > items.length) {
          return 0;
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [items.length, hasMoreItems]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-green-400 text-xs">✓</span>;
      case "badge":
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case "progress":
        return <Clock className="w-4 h-4 text-blue-400" />;
      case "sprint":
        return <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />;
      case "new":
        return <span className="text-red-400 text-xs font-bold">NEU</span>;
      case "scheduled":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const visibleItems = hasMoreItems
    ? items.slice(currentIndex, currentIndex + maxVisible)
    : items;

  return (
    <div className="bg-[#1a1d3d]/60 backdrop-blur-sm rounded-lg p-5 border-2 border-cyan-400/20 hover:border-cyan-400/40 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-bold pixel-text">{title}</h3>
        </div>
        {hasMoreItems && (
          <div className="flex items-center gap-1">
            {items.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index >= currentIndex && index < currentIndex + maxVisible
                    ? "bg-cyan-400"
                    : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 overflow-hidden">
        {visibleItems.map((item, index) => (
          <div
            key={currentIndex + index}
            className="flex items-start justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer group animate-slide-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate pixel-text group-hover:text-cyan-300 transition-colors">
                {item.title}
              </p>
              <p className="text-gray-400 text-xs truncate pixel-text">
                {item.subtitle}
              </p>
            </div>
            <div className="ml-2 flex-shrink-0">
              {getStatusBadge(item.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}