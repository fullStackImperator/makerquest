import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Book, Route, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
import StatCard from '../_components/Statcard'
import StarfieldBackground from '@/components/ui/Starfieldbackground'
import {ActivityCard} from '../_components/Activitycard'

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
      <StarfieldBackground/>

      <section className="grid auto-rows-min gap-4 md:grid-cols-4">
        {/* <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="text-4xl mb-4">
              <Route />
            </div>
            <CardTitle>Lernpfade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{} abgeschlossen</p>
          </CardContent>
        </Card> */}

        <StatCard
          icon={Route}
          label="Lernpfade"
          value="12"
          subtitle="x abgeschlossen"
          color="cyan"
        />

        <StatCard
          icon={Target}
          label="Aktive Quests"
          value="10"
          subtitle="x abgeschlossen" 
          secondline='x verfügbar'
          color="blue"
        />

        <StatCard
          icon={Trophy}
          label="Badges"
          value="69"
          subtitle="x werden überprüft"
          color="yellow"
        />
        
        <StatCard
          icon={TrendingUp}
          label="Level"
          value="12"
          subtitle="x/99 XP"
          color="green"
        />

        {/* {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))} */}
      </section>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <ActivityCard
          title="Lernpfade"
          icon="route"
          items={[
            { title: 'Lernpfad 1', subtitle: 'In Bearbeitung', status: 'progress' },
            { title: 'Lernpfad 2', subtitle: 'Abgeschlossen (Wird überprüft)', status: 'completed' },
            { title: 'Lernpfad 3', subtitle: 'Badge erhalten', status: 'badge' }, 
            { title: 'Lernpfad 4', subtitle: 'Badge erhalten', status: 'badge' }, 
            { title: 'Lernpfad 5', subtitle: 'Badge erhalten', status: 'badge' }, 
            { title: 'Lernpfad 6', subtitle: 'Badge erhalten', status: 'badge' }, 
          ]}
        />

        <ActivityCard
          title="Fächer"
          icon="book"
          items={[
            { title: 'Fach 1', subtitle: 'x% abgeschlossen', status: 'progress' },
            { title: 'Fach 2', subtitle: 'x% abgeschlossen', status: 'progress' },
            { title: 'Fach 3', subtitle: 'x% abgeschlossen', status: 'progress' }, 
          ]}
        />

        <ActivityCard
          title="In Progress"
          icon="zap"
          items={[
            { title: 'Quest x', subtitle: 'Fast Fertig', status: 'sprint' },
            { title: 'Quest y', subtitle: '45% abgeschlossen', status: 'progress' },
            { title: 'Quest z', subtitle: 'Neu verfügbar', status: 'new' }, 
          ]}
        />
      </div>

      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">Benachrichtigungen</div> 
    </>
  )
}
