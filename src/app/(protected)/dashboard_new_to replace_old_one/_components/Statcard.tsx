import Link from "next/link"




// Stat Card Component
export default function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  secondline,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtitle: string
  secondline?: string
  color: 'cyan' | 'blue' | 'yellow' | 'green'
}) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-400/30 shadow-cyan-500/20',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-400/30 shadow-blue-500/20',
    yellow:
      'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30 shadow-yellow-500/20',
    green:
      'from-green-500/20 to-green-600/20 border-green-400/30 shadow-green-500/20',
  }

  const iconColorClasses = {
    cyan: 'text-cyan-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
  }

  const cardContent = (
    <div
      className={`bg-linear-to-br ${colorClasses[color]} rounded-lg p-5 border-2 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
        <div className="text-right">
          <p className="text-3xl font-bold text-white pixel-text">{value}</p>
        </div>
      </div>
      <p className="text-white font-semibold mb-1 pixel-text">{label}</p>
      <p className="text-gray-300 text-sm pixel-text">{subtitle}</p>
      <p className="text-gray-300 text-sm pixel-text">{secondline}</p>
    </div>
  )

  return cardContent
}
