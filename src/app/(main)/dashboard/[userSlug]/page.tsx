import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Route } from 'lucide-react'
import StatCard from '../_components/Statcard'

export default async function DashboardPage() {
  const features = [
    {
      title: 'Test titel',
      description: '',
      icon: '',
    },
  ]

  return (
    <>
      <section className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="text-4xl mb-4">
              <Route />
            </div>
            <CardTitle>Lernpfade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{} abgeschlossen</p>
          </CardContent>
        </Card>

        <StatCard
          icon={Route}
          label="Lernpfade"
          value="12"
          subtitle="x abgeschlossen"
          color="cyan"
        />

        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
        <div className="bg-muted/50 aspect-video rounded-xl">Lernpfade </div>
        <div className="bg-muted/50 aspect-video rounded-xl">
          Aktive Quests{' '}
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl">Badges </div>
        <div className="bg-muted/50 aspect-video rounded-xl">Highscore </div>
      </section>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl">Lernpfade </div>
        <div className="bg-muted/50 aspect-video rounded-xl">Fächer </div>
        <div className="bg-muted/50 aspect-video rounded-xl">In Progress </div>
      </div>

      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
    </>
  )
}
