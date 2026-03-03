"use client";

import { useState } from "react";
import { 
  Search, 
  BookOpen, 
  Trophy, 
  Lock, 
  CheckCircle2,
  Clock,
  Star,
  Filter
} from "lucide-react";

interface Quest {
  id: string;
  title: string;
  completed: boolean;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Anfänger" | "Fortgeschritten" | "Experte";
  totalQuests: number;
  completedQuests: number;
  quests: Quest[];
  isLocked: boolean;
  estimatedTime: string;
  xpReward: number;
  badge?: string;
}

const learningPaths: LearningPath[] = [
  {
    id: "1",
    title: "Die Torte - Brüche verstehen",
    description: "Lerne die Grundlagen der Bruchrechnung mit praktischen Beispielen aus dem Alltag.",
    category: "Mathematik",
    difficulty: "Anfänger",
    totalQuests: 8,
    completedQuests: 8,
    quests: [
      { id: "1-1", title: "Was sind Brüche?", completed: true },
      { id: "1-2", title: "Brüche im Alltag", completed: true },
      { id: "1-3", title: "Zähler und Nenner", completed: true },
      { id: "1-4", title: "Gleichwertige Brüche", completed: true },
      { id: "1-5", title: "Brüche erweitern", completed: true },
      { id: "1-6", title: "Brüche kürzen", completed: true },
      { id: "1-7", title: "Brüche vergleichen", completed: true },
      { id: "1-8", title: "Die Torte teilen", completed: true },
    ],
    isLocked: false,
    estimatedTime: "2 Stunden",
    xpReward: 500,
    badge: "Bruch-Meister",
  },
  {
    id: "2",
    title: "Python Basics - Programmieren lernen",
    description: "Erste Schritte in der Programmierung mit Python. Von Variablen bis zu Schleifen.",
    category: "Programmieren",
    difficulty: "Anfänger",
    totalQuests: 12,
    completedQuests: 5,
    quests: [
      { id: "2-1", title: "Installation & Setup", completed: true },
      { id: "2-2", title: "Variablen und Datentypen", completed: true },
      { id: "2-3", title: "Rechnen mit Python", completed: true },
      { id: "2-4", title: "Strings und Text", completed: true },
      { id: "2-5", title: "Listen erstellen", completed: true },
      { id: "2-6", title: "If-Bedingungen", completed: false },
      { id: "2-7", title: "For-Schleifen", completed: false },
      { id: "2-8", title: "While-Schleifen", completed: false },
      { id: "2-9", title: "Funktionen schreiben", completed: false },
      { id: "2-10", title: "Module importieren", completed: false },
      { id: "2-11", title: "Fehler behandeln", completed: false },
      { id: "2-12", title: "Projekt: Taschenrechner", completed: false },
    ],
    isLocked: false,
    estimatedTime: "4 Stunden",
    xpReward: 800,
  },
  {
    id: "3",
    title: "Laser-Cutting Grundlagen",
    description: "Lerne den Umgang mit dem Lasercutter - von der Vorbereitung bis zum fertigen Werkstück.",
    category: "Maker Skills",
    difficulty: "Fortgeschritten",
    totalQuests: 10,
    completedQuests: 8,
    quests: [
      { id: "3-1", title: "Sicherheitseinweisung", completed: true },
      { id: "3-2", title: "Materialien kennenlernen", completed: true },
      { id: "3-3", title: "Inkscape Basics", completed: true },
      { id: "3-4", title: "Vektorgrafiken erstellen", completed: true },
      { id: "3-5", title: "Schnitt vs. Gravur", completed: true },
      { id: "3-6", title: "Einstellungen optimieren", completed: true },
      { id: "3-7", title: "Erstes Projekt lasern", completed: true },
      { id: "3-8", title: "Komplexe Formen", completed: true },
      { id: "3-9", title: "3D-Objekte konstruieren", completed: false },
      { id: "3-10", title: "Abschlussprojekt", completed: false },
    ],
    isLocked: false,
    estimatedTime: "6 Stunden",
    xpReward: 1200,
    badge: "Laser-Profi",
  },
  {
    id: "4",
    title: "Chemie im Alltag",
    description: "Entdecke chemische Reaktionen in deinem täglichen Leben und führe spannende Experimente durch.",
    category: "Naturwissenschaften",
    difficulty: "Anfänger",
    totalQuests: 15,
    completedQuests: 0,
    quests: [
      { id: "4-1", title: "Was ist Chemie?", completed: false },
      { id: "4-2", title: "Atome und Moleküle", completed: false },
      { id: "4-3", title: "Säuren und Basen", completed: false },
      { id: "4-4", title: "pH-Wert messen", completed: false },
      { id: "4-5", title: "Oxidation", completed: false },
      { id: "4-6", title: "Backpulver-Vulkan", completed: false },
      { id: "4-7", title: "Kristalle züchten", completed: false },
      { id: "4-8", title: "Indikatoren herstellen", completed: false },
      { id: "4-9", title: "Elektrolyse", completed: false },
      { id: "4-10", title: "Polymere", completed: false },
      { id: "4-11", title: "Slime herstellen", completed: false },
      { id: "4-12", title: "Katalysatoren", completed: false },
      { id: "4-13", title: "Exotherme Reaktionen", completed: false },
      { id: "4-14", title: "Endotherme Reaktionen", completed: false },
      { id: "4-15", title: "Abschlussprojekt", completed: false },
    ],
    isLocked: false,
    estimatedTime: "5 Stunden",
    xpReward: 950,
  },
  {
    id: "5",
    title: "3D-Druck Masterclass",
    description: "Von der Idee zum fertigen 3D-Druck. Lerne Modellierung, Slicing und Drucktechniken.",
    category: "Maker Skills",
    difficulty: "Fortgeschritten",
    totalQuests: 14,
    completedQuests: 0,
    quests: [
      { id: "5-1", title: "3D-Drucker verstehen", completed: false },
      { id: "5-2", title: "Filament-Typen", completed: false },
      { id: "5-3", title: "Tinkercad Einführung", completed: false },
      { id: "5-4", title: "Erstes Modell erstellen", completed: false },
      { id: "5-5", title: "Fusion 360 Basics", completed: false },
      { id: "5-6", title: "Parametrisches Design", completed: false },
      { id: "5-7", title: "STL-Export", completed: false },
      { id: "5-8", title: "Slicer-Software", completed: false },
      { id: "5-9", title: "Druckeinstellungen", completed: false },
      { id: "5-10", title: "Support-Strukturen", completed: false },
      { id: "5-11", title: "Fehlersuche", completed: false },
      { id: "5-12", title: "Nachbearbeitung", completed: false },
      { id: "5-13", title: "Multi-Material-Druck", completed: false },
      { id: "5-14", title: "Abschlussprojekt", completed: false },
    ],
    isLocked: true,
    estimatedTime: "8 Stunden",
    xpReward: 1500,
    badge: "3D-Guru",
  },
  {
    id: "6",
    title: "Arduino Elektronik Basics",
    description: "Baue deine ersten elektronischen Schaltungen und programmiere Mikrocontroller.",
    category: "Elektronik",
    difficulty: "Fortgeschritten",
    totalQuests: 16,
    completedQuests: 0,
    quests: [
      { id: "6-1", title: "Was ist Arduino?", completed: false },
      { id: "6-2", title: "Elektronik Grundlagen", completed: false },
      { id: "6-3", title: "LED blinken lassen", completed: false },
      { id: "6-4", title: "Widerstände berechnen", completed: false },
      { id: "6-5", title: "Taster und Schalter", completed: false },
      { id: "6-6", title: "Serielle Kommunikation", completed: false },
      { id: "6-7", title: "Sensoren auslesen", completed: false },
      { id: "6-8", title: "Motoren steuern", completed: false },
      { id: "6-9", title: "LCD-Display", completed: false },
      { id: "6-10", title: "Servo-Motoren", completed: false },
      { id: "6-11", title: "Ultraschall-Sensor", completed: false },
      { id: "6-12", title: "Temperatur messen", completed: false },
      { id: "6-13", title: "RGB-LEDs", completed: false },
      { id: "6-14", title: "Buzzer und Töne", completed: false },
      { id: "6-15", title: "Bibliotheken nutzen", completed: false },
      { id: "6-16", title: "Abschlussprojekt: Smart Home", completed: false },
    ],
    isLocked: true,
    estimatedTime: "10 Stunden",
    xpReward: 1800,
    badge: "Arduino-Master",
  },
];

export default function LernpfadePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Alle");

  const categories = ["Alle", ...Array.from(new Set(learningPaths.map(path => path.category)))];
  const difficulties = ["Alle", "Anfänger", "Fortgeschritten", "Experte"];

  const filteredPaths = learningPaths.filter(path => {
    const matchesSearch = path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         path.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Alle" || path.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "Alle" || path.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Anfänger":
        return "text-green-400 bg-green-500/20 border-green-400/30";
      case "Fortgeschritten":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-400/30";
      case "Experte":
        return "text-red-400 bg-red-500/20 border-red-400/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-400/30";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Lernpfade durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#1a1d3d]/80 backdrop-blur-sm border-2 border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/60 focus:shadow-lg focus:shadow-cyan-500/20 transition-all pixel-text"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-semibold pixel-text">Filter:</span>
            </div>
            
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

            <div className="flex flex-wrap gap-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all pixel-text text-sm ${
                    selectedDifficulty === difficulty
                      ? "bg-cyan-500/30 border-cyan-400 text-cyan-300"
                      : "bg-white/5 border-gray-600 text-gray-300 hover:border-cyan-400/50"
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 text-gray-400 pixel-text text-sm">
          {filteredPaths.length} {filteredPaths.length === 1 ? "Lernpfad" : "Lernpfade"} gefunden
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPaths.map((path) => {
            const progress = getProgressPercentage(path.completedQuests, path.totalQuests);
            const isCompleted = progress === 100;

            return (
              <div
                key={path.id}
                className={`relative bg-[#1a1d3d]/80 backdrop-blur-sm rounded-xl border-2 transition-all duration-300 overflow-hidden group ${
                  path.isLocked
                    ? "border-gray-600/30 opacity-60"
                    : "border-cyan-400/30 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105 cursor-pointer"
                }`}
              >
                {path.isLocked && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300 pixel-text text-sm">Noch nicht verfügbar</p>
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 pixel-text text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      Abgeschlossen
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <BookOpen className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                      <span className={`px-2 py-1 rounded border ${getDifficultyColor(path.difficulty)} pixel-text text-xs`}>
                        {path.difficulty}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 pixel-text group-hover:text-cyan-300 transition-colors">
                      {path.title}
                    </h3>
                    <p className="text-gray-400 text-sm pixel-text line-clamp-2">
                      {path.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg pixel-text text-xs">
                      {path.category}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold pixel-text text-sm">Fortschritt</span>
                      <span className="text-cyan-300 pixel-text text-sm">
                        {path.completedQuests}/{path.totalQuests} Quests
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 relative"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </div>
                    </div>
                    <p className="text-right text-cyan-300 text-xs mt-1 pixel-text">{progress}%</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-white font-semibold pixel-text text-sm mb-2">Quests:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {path.quests.slice(0, 5).map((quest) => (
                        <div key={quest.id} className="flex items-center gap-2 text-sm">
                          {quest.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-600 flex-shrink-0" />
                          )}
                          <span className={`pixel-text text-xs truncate ${quest.completed ? "text-gray-500 line-through" : "text-gray-300"}`}>
                            {quest.title}
                          </span>
                        </div>
                      ))}
                      {path.quests.length > 5 && (
                        <p className="text-gray-500 text-xs pixel-text">... und {path.quests.length - 5} weitere</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-cyan-400/20 flex items-center justify-between text-xs pixel-text">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-4 h-4" />
                      {path.estimatedTime}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4" />
                      {path.xpReward} XP
                    </div>
                  </div>

                  {path.badge && (
                    <div className="mt-3 flex items-center gap-2 bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 pixel-text text-xs">Badge: {path.badge}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPaths.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 pixel-text text-lg">Keine Lernpfade gefunden</p>
            <p className="text-gray-500 pixel-text text-sm mt-2">
              Versuche andere Suchbegriffe oder Filter
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.5);
          border-radius: 10px;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

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

        /*
      `}</style>
    </div>
  );
}