"use client";

import { useState } from "react";
import { 
  Trophy, 
  Award, 
  Star, 
  Target,
  Lock,
  CheckCircle2,
  Filter,
  Search,
  Medal,
  Crown,
  Zap,
  Flame,
  BookOpen
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "Lernpfade" | "Quests" | "Streak" | "Punkte" | "Special";
  icon: "trophy" | "medal" | "star" | "crown" | "flame" | "zap" | "book";
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  xpReward: number;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  maxProgress?: number;
}

const achievements: Achievement[] = [
  // Unlocked Achievements
  {
    id: "1",
    title: "Erste Schritte",
    description: "Schließe deinen ersten Quest ab",
    category: "Quests",
    icon: "star",
    rarity: "Common",
    xpReward: 50,
    unlocked: true,
    unlockedDate: "01.01.2026",
    progress: 1,
    maxProgress: 1,
  },
  {
    id: "2",
    title: "Bruch-Meister",
    description: "Schließe den Lernpfad 'Die Torte' komplett ab",
    category: "Lernpfade",
    icon: "trophy",
    rarity: "Rare",
    xpReward: 500,
    unlocked: true,
    unlockedDate: "01.01.2026",
    progress: 8,
    maxProgress: 8,
  },
  {
    id: "3",
    title: "Laser-Profi",
    description: "Meistere alle Laser-Cutting Grundlagen",
    category: "Lernpfade",
    icon: "medal",
    rarity: "Epic",
    xpReward: 1000,
    unlocked: true,
    unlockedDate: "20.12.2025",
    progress: 3,
    maxProgress: 3,
  },
  {
    id: "4",
    title: "BRM Pro Einsteiger",
    description: "Meistere 10 Quests im BRM Pro Lernpfad",
    category: "Special",
    icon: "crown",
    rarity: "Rare",
    xpReward: 750,
    unlocked: true,
    unlockedDate: "20.12.2025",
    progress: 10,
    maxProgress: 10,
  },
  {
    id: "5",
    title: "Wissenshungrig",
    description: "Absolviere 5 verschiedene Lernpfade",
    category: "Lernpfade",
    icon: "book",
    rarity: "Epic",
    xpReward: 1200,
    unlocked: true,
    unlockedDate: "15.12.2025",
    progress: 5,
    maxProgress: 5,
  },
  
  // In Progress
  {
    id: "6",
    title: "Quest-Meister",
    description: "Schließe 50 Quests ab",
    category: "Quests",
    icon: "trophy",
    rarity: "Rare",
    xpReward: 800,
    unlocked: false,
    progress: 32,
    maxProgress: 50,
  },
  {
    id: "7",
    title: "Streak Warrior",
    description: "Erreiche eine 30-Tage Lern-Streak",
    category: "Streak",
    icon: "flame",
    rarity: "Epic",
    xpReward: 1500,
    unlocked: false,
    progress: 12,
    maxProgress: 30,
  },
  {
    id: "8",
    title: "Python Guru",
    description: "Schließe alle Python Lernpfade ab",
    category: "Lernpfade",
    icon: "medal",
    rarity: "Epic",
    xpReward: 2000,
    unlocked: false,
    progress: 1,
    maxProgress: 3,
  },
  
  // Locked
  {
    id: "9",
    title: "Punktesammler",
    description: "Erreiche 10.000 XP",
    category: "Punkte",
    icon: "star",
    rarity: "Rare",
    xpReward: 1000,
    unlocked: false,
    progress: 0,
    maxProgress: 10000,
  },
  {
    id: "10",
    title: "Maker Legend",
    description: "Meistere alle Maker Skills Lernpfade",
    category: "Lernpfade",
    icon: "crown",
    rarity: "Legendary",
    xpReward: 5000,
    unlocked: false,
    progress: 2,
    maxProgress: 5,
  },
  {
    id: "11",
    title: "Speed Runner",
    description: "Schließe 10 Quests an einem Tag ab",
    category: "Quests",
    icon: "zap",
    rarity: "Epic",
    xpReward: 1200,
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: "12",
    title: "Perfektionist",
    description: "Erreiche 100% in 10 Lernpfaden",
    category: "Lernpfade",
    icon: "trophy",
    rarity: "Legendary",
    xpReward: 3000,
    unlocked: false,
    progress: 3,
    maxProgress: 10,
  },
  {
    id: "13",
    title: "Early Bird",
    description: "Lerne 7 Tage in Folge vor 8 Uhr morgens",
    category: "Streak",
    icon: "star",
    rarity: "Rare",
    xpReward: 500,
    unlocked: false,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: "14",
    title: "Night Owl",
    description: "Lerne 7 Tage in Folge nach 22 Uhr",
    category: "Streak",
    icon: "star",
    rarity: "Rare",
    xpReward: 500,
    unlocked: false,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: "15",
    title: "Jahrhundert-Genie",
    description: "Erreiche Level 100",
    category: "Special",
    icon: "crown",
    rarity: "Legendary",
    xpReward: 10000,
    unlocked: false,
    progress: 99,
    maxProgress: 100,
  },
  {
    id: "16",
    title: "Adlerauge",
    description: "Finde alle versteckte Easter Eggs in den Lernpfaden",
    category: "Special",
    icon: "crown",
    rarity: "Legendary",
    xpReward: 2000,
    unlocked: false,
    progress: 0,
    maxProgress: 6,
  }
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "trophy": return Trophy;
    case "medal": return Medal;
    case "star": return Star;
    case "crown": return Crown;
    case "flame": return Flame;
    case "zap": return Zap;
    case "book": return BookOpen;
    default: return Award;
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "Common":
      return "from-gray-500 to-gray-600 border-gray-400/50";
    case "Rare":
      return "from-blue-500 to-blue-600 border-blue-400/50";
    case "Epic":
      return "from-purple-500 to-purple-600 border-purple-400/50";
    case "Legendary":
      return "from-yellow-500 to-orange-500 border-yellow-400/50";
    default:
      return "from-gray-500 to-gray-600 border-gray-400/50";
  }
};

const getRarityBadgeColor = (rarity: string) => {
  switch (rarity) {
    case "Common":
      return "bg-gray-500/20 text-gray-300 border-gray-400/30";
    case "Rare":
      return "bg-blue-500/20 text-blue-300 border-blue-400/30";
    case "Epic":
      return "bg-purple-500/20 text-purple-300 border-purple-400/30";
    case "Legendary":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-400/30";
  }
};

export default function BadgesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");
  const [selectedRarity, setSelectedRarity] = useState<string>("Alle");
  const [showOnlyLocked, setShowOnlyLocked] = useState(false);

  const categories = ["Alle", "Lernpfade", "Quests", "Streak", "Punkte", "Special"];
  const rarities = ["Alle", "Common", "Rare", "Epic", "Legendary"];

  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const progressPercentage = Math.round((unlockedAchievements / totalAchievements) * 100);
  const totalXPEarned = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Alle" || achievement.category === selectedCategory;
    const matchesRarity = selectedRarity === "Alle" || achievement.rarity === selectedRarity;
    const matchesLockFilter = !showOnlyLocked || !achievement.unlocked;
    
    return matchesSearch && matchesCategory && matchesRarity && matchesLockFilter;
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 pixel-text">
            Auszeichnungen & Erfolge
          </h1>
          <p className="text-cyan-300 pixel-text">
            Sammle Badges und zeige deine Erfolge!
          </p>
        </div>

        {/* Overall Progress Card */}
        <div className="mb-8 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border-2 border-cyan-400/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white pixel-text mb-1">
                Gesamtfortschritt
              </h2>
              <p className="text-cyan-300 pixel-text text-sm">
                {unlockedAchievements} von {totalAchievements} freigeschaltet
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-cyan-400 pixel-text">
                {progressPercentage}%
              </div>
              <p className="text-yellow-400 text-sm pixel-text mt-1">
                {totalXPEarned.toLocaleString()} XP verdient
              </p>
            </div>
          </div>
          
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/5 rounded-lg p-3 border border-cyan-400/20">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-xs pixel-text">Common</span>
              </div>
              <p className="text-white font-bold pixel-text">
                {achievements.filter(a => a.rarity === "Common" && a.unlocked).length}/
                {achievements.filter(a => a.rarity === "Common").length}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-blue-400/20">
              <div className="flex items-center gap-2 mb-1">
                <Medal className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-xs pixel-text">Rare</span>
              </div>
              <p className="text-white font-bold pixel-text">
                {achievements.filter(a => a.rarity === "Rare" && a.unlocked).length}/
                {achievements.filter(a => a.rarity === "Rare").length}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-purple-400/20">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-xs pixel-text">Epic</span>
              </div>
              <p className="text-white font-bold pixel-text">
                {achievements.filter(a => a.rarity === "Epic" && a.unlocked).length}/
                {achievements.filter(a => a.rarity === "Epic").length}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-yellow-400/20">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-xs pixel-text">Legendary</span>
              </div>
              <p className="text-white font-bold pixel-text">
                {achievements.filter(a => a.rarity === "Legendary" && a.unlocked).length}/
                {achievements.filter(a => a.rarity === "Legendary").length}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Auszeichnungen durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#1a1d3d]/80 backdrop-blur-sm border-2 border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/60 focus:shadow-lg focus:shadow-cyan-500/20 transition-all pixel-text"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-semibold pixel-text">Filter:</span>
            </div>

            {/* Show Only Locked Toggle */}
            <button
              onClick={() => setShowOnlyLocked(!showOnlyLocked)}
              className={`px-4 py-2 rounded-lg border-2 transition-all pixel-text text-sm flex items-center gap-2 ${
                showOnlyLocked
                  ? "bg-red-500/30 border-red-400 text-red-300"
                  : "bg-white/5 border-gray-600 text-gray-300 hover:border-cyan-400/50"
              }`}
            >
              <Lock className="w-4 h-4" />
              Nur nicht freigeschaltete
            </button>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all pixel-text text-sm ${
                    selectedCategory === category
                      ? "bg-cyan-500/30 border-cyan-400 text-cyan-300"
                      : "bg-white/5 border-gray-600 text-gray-300 hover:border-cyan-400/50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Rarity Filter */}
            <div className="flex flex-wrap gap-2">
              {rarities.map((rarity) => (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all pixel-text text-sm ${
                    selectedRarity === rarity
                      ? "bg-cyan-500/30 border-cyan-400 text-cyan-300"
                      : "bg-white/5 border-gray-600 text-gray-300 hover:border-cyan-400/50"
                  }`}
                >
                  {rarity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-400 pixel-text text-sm">
          {filteredAchievements.length} {filteredAchievements.length === 1 ? "Auszeichnung" : "Auszeichnungen"} gefunden
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const Icon = getIconComponent(achievement.icon);
            const hasProgress = achievement.progress !== 0;
            const progressPercent = hasProgress && achievement.progress !== undefined
              ? Math.round((achievement.progress / achievement.maxProgress!) * 100)
              : 0;

            return (
              <div
                key={achievement.id}
                className={`relative bg-[#1a1d3d]/80 backdrop-blur-sm rounded-xl border-2 transition-all duration-300 overflow-hidden group ${
                  achievement.unlocked
                    ? "border-cyan-400/30 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105"
                    : "border-gray-600/30 opacity-75"
                }`}
              >
                {/* Unlocked Glow Effect */}
                {achievement.unlocked && (
                  <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${getRarityColor(achievement.rarity)} opacity-20 blur-xl`} />
                )}

                {/* Locked Overlay */}
                {!achievement.unlocked && !hasProgress && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <Lock className="w-12 h-12 text-gray-500" />
                  </div>
                )}

                <div className="relative p-6">
                  {/* Icon Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center shadow-lg relative`}>
                      <Icon className="w-8 h-8 text-white" />
                      {achievement.unlocked && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#1a1d3d]">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded border-2 ${getRarityBadgeColor(achievement.rarity)} pixel-text text-xs`}>
                      {achievement.rarity}
                    </span>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-xl font-bold text-white mb-2 pixel-text group-hover:text-cyan-300 transition-colors">
                    {achievement.title}
                  </h3>
                  <p className="text-gray-400 text-sm pixel-text mb-4">
                    {achievement.description}
                  </p>

                  {/* Category Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg pixel-text text-xs">
                      {achievement.category}
                    </span>
                  </div>

                  {/* Progress Bar (if in progress) */}
                  {hasProgress && achievement.progress !== undefined && !achievement.unlocked && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold pixel-text text-sm">Fortschritt</span>
                        <span className="text-cyan-300 pixel-text text-sm">
                          {achievement.progress.toLocaleString()}/{achievement.maxProgress!.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} transition-all duration-500`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-right text-cyan-300 text-xs mt-1 pixel-text">{progressPercent}%</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-4 border-t-2 border-cyan-400/20 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-yellow-400 pixel-text text-sm">
                      <Star className="w-4 h-4" />
                      +{achievement.xpReward} XP
                    </div>
                    {achievement.unlocked && achievement.unlockedDate && (
                      <div className="text-gray-400 pixel-text text-xs">
                        {achievement.unlockedDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 pixel-text text-lg">Keine Auszeichnungen gefunden</p>
            <p className="text-gray-500 pixel-text text-sm mt-2">
              Versuche andere Filter oder Suchbegriffe
            </p>
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .pixel-text {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}