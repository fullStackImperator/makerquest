import LMSDashboard from "@/components/dashboard";
import { 
  BookOpen, 
  Target, 
  Trophy, 
  TrendingUp,
  Clock,
  Star,
  Zap
} from "lucide-react";

export default function DashboardPage() {
  return (
    <LMSDashboard>
      <div className="space-y-6">
        
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-linear-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border-2 border-cyan-400/30">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 pixel-text">
              Willkommen zurück, !
            </h1>
            <p className="text-cyan-200 pixel-text">
              Status: <span className="text-yellow-300"></span> 
            </p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 text-6xl text-cyan-400/20 font-bold">+</div>
          <div className="absolute bottom-4 right-12 text-4xl text-cyan-400/20 font-bold">+</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Lernpfade"
            value="12"
            subtitle="x abgeschlossen"
            color="cyan"
          />
          <StatCard
            icon={Target}
            label="Aktive Quests"
            value="8"
            subtitle="x neue heute"
            color="blue"
          />
          <StatCard
            icon={Trophy}
            label="Badges"
            value="47"
            subtitle="Level-Up bereit"
            color="yellow"
          />
          <StatCard
            icon={TrendingUp}
            label="Highscore"
            value="99999"
            subtitle="+69 diese Woche"
            color="green"
          />
        </div>

        {/* Recent Activity Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learning Paths */}
          <ActivityCard
            title="Lernpfade"
            icon={BookOpen}
            items={[
              { title: "Quest beendet", subtitle: "Brüche 1", status: "completed" },
              { title: "Quest beendet", subtitle: "Geburtstagskarte", status: "completed" },
              { title: "Badge erhalten", subtitle: "BRM Pro Einsteiger", status: "badge" },
            ]}
          />

          {/* Subjects */}
          <ActivityCard
            title="Fächer"
            icon={Star}
            items={[
              { title: "Mathematik", subtitle: "% abgeschlossen", status: "progress" },
              { title: "Physik", subtitle: "% abgeschlossen", status: "progress" },
              { title: "Chemie", subtitle: "% abgeschlossen", status: "progress" },
            ]}
          />

          {/* In Progress */}
          <ActivityCard
            title="In Progress"
            icon={Zap}
            items={[
              { title: "Laser-Cutting 5", subtitle: "Fast fertig!", status: "active" },
              { title: "Python Basics", subtitle: "45% abgeschlossen", status: "progress" },
              { title: "Design Thinking", subtitle: "Startet morgen", status: "scheduled" },
            ]}
          />
        </div>
      </div>
    </LMSDashboard>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  color 
}: { 
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle: string;
  color: "cyan" | "blue" | "yellow" | "green";
}) {
  const colorClasses = {
    cyan: "from-cyan-500/20 to-cyan-600/20 border-cyan-400/30 shadow-cyan-500/20",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-400/30 shadow-blue-500/20",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-400/30 shadow-yellow-500/20",
    green: "from-green-500/20 to-green-600/20 border-green-400/30 shadow-green-500/20",
  };

  const iconColorClasses = {
    cyan: "text-cyan-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    green: "text-green-400",
  };

  return (
    <div className={`bg-linear-to-br ${colorClasses[color]} rounded-lg p-5 border-2 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer`}>
      <div className="flex items-start justify-between mb-3">
        <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
        <div className="text-right">
          <p className="text-3xl font-bold text-white pixel-text">{value}</p>
        </div>
      </div>
      <p className="text-white font-semibold mb-1 pixel-text">{label}</p>
      <p className="text-gray-300 text-sm pixel-text">{subtitle}</p>
    </div>
  );
}

// Activity Card Component
function ActivityCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ElementType;
  items: Array<{ title: string; subtitle: string; status: string }>;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-green-400 text-xs">✓</span>;
      case "badge":
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case "progress":
        return <Clock className="w-4 h-4 text-blue-400" />;
      case "active":
        return <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />;
      case "new":
        return <span className="text-red-400 text-xs font-bold">NEU</span>;
      case "scheduled":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#1a1d3d]/60 backdrop-blur-sm rounded-lg p-5 border-2 border-cyan-400/20 hover:border-cyan-400/40 transition-all">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-bold pixel-text">{title}</h3>
      </div>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate pixel-text group-hover:text-cyan-300 transition-colors">
                {item.title}
              </p>
              <p className="text-gray-400 text-xs truncate pixel-text">
                {item.subtitle}
              </p>
            </div>
            <div className="ml-2 shrink-0">
              {getStatusBadge(item.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
