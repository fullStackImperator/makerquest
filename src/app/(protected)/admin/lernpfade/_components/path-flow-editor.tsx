'use client'

import {
  addEdge,
  Background,
  Connection,
  Controls,
  Handle,
  type Edge,
  MiniMap,
  type Node,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  saveLearningPathFlow,
  type FlowPayload,
  type FlowNodeData,
} from '../_actions/learning-path-actions'

type QuestOption = { id: string; title: string }

function QuestNode({
  id,
  data,
  selected,
}: {
  id: string
  data: FlowNodeData & { onBonusChange?: (nodeId: string, v: number) => void }
  selected?: boolean
}) {
  return (
    <div
      className={`rounded-lg border bg-card px-3 py-2 shadow-sm min-w-[180px] ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <p className="text-xs font-medium leading-tight line-clamp-2">{data.title}</p>
      <div className="mt-2 flex items-center gap-2">
        <Label className="text-[10px] text-muted-foreground">Bonus XP</Label>
        <Input
          type="number"
          min={0}
          className="h-7 w-16 text-xs"
          value={data.bonusXp}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            data.onBonusChange?.(id, Number.isNaN(v) ? 0 : v)
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  )
}

const nodeTypes = { quest: QuestNode }

function FlowInner({
  pathId,
  initialFlow,
  questOptions,
  onSaved,
}: {
  pathId: string
  initialFlow: FlowPayload
  questOptions: QuestOption[]
  onSaved?: () => void
}) {
  const { screenToFlowPosition } = useReactFlow()

  const initialNodes = useMemo(
    () =>
      (initialFlow.nodes ?? []).map((n) => ({
        ...n,
        type: 'quest',
      })) as Node[],
    [initialFlow.nodes],
  )
  const initialEdges = useMemo(
    () => (initialFlow.edges ?? []) as Edge[],
    [initialFlow.edges],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const updateBonus = useCallback(
    (nodeId: string, bonusXp: number) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  bonusXp,
                },
              }
            : n,
        ),
      )
    },
    [setNodes],
  )

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onBonusChange: updateBonus,
        },
      })),
    )
  }, [setNodes, updateBonus])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/json')
      if (!raw) return
      const quest: QuestOption = JSON.parse(raw)
      const pos = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      const newId = crypto.randomUUID()
      const newNode: Node = {
        id: newId,
        type: 'quest',
        position: pos,
        data: {
          courseId: quest.id,
          title: quest.title,
          bonusXp: 0,
          onBonusChange: updateBonus,
        },
      }

      // Do not call setEdges inside setNodes — batched updates can duplicate edges (two outgoing → "Verzweigungen").
      let sourceId: string | null = null
      setNodes((prev) => {
        const last = prev[prev.length - 1]
        sourceId = last?.id ?? null
        return [...prev, newNode]
      })
      if (sourceId) {
        const sId: string = sourceId
        setEdges((eds) => {
          if (eds.some((e) => e.source === sId && e.target === newId)) {
            return eds
          }
          return [
            ...eds,
            {
              id: `e-${sId}-${newId}`,
              source: sId,
              target: newId,
            },
          ]
        })
      }
    },
    [screenToFlowPosition, setNodes, setEdges, updateBonus],
  )

  const handleSave = async () => {
    const payload: FlowPayload = {
      nodes: nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: {
          courseId: (n.data as FlowNodeData).courseId,
          title: (n.data as FlowNodeData).title,
          bonusXp: (n.data as FlowNodeData).bonusXp ?? 0,
        },
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    }

    const result = await saveLearningPathFlow(pathId, payload)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Lernpfad gespeichert')
    onSaved?.()
  }

  return (
    <div className="flex h-[min(720px,75vh)] flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {questOptions.map((q) => (
          <div
            key={q.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                'application/json',
                JSON.stringify(q),
              )
              e.dataTransfer.effectAllowed = 'move'
            }}
            className="cursor-grab rounded-md border bg-muted/50 px-2 py-1 text-xs"
          >
            {q.title}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Quests auf die Fläche ziehen. Erste Kette: automatisch verbunden. Weitere
        Knoten an den letzten angebunden.
      </p>
      <div className="min-h-0 flex-1 rounded-lg border" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <Button type="button" onClick={handleSave}>
        Schritte speichern
      </Button>
    </div>
  )
}

export function PathFlowEditor(props: {
  pathId: string
  initialFlow: FlowPayload
  questOptions: QuestOption[]
  onSaved?: () => void
}) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  )
}
