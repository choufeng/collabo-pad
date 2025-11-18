'use client'

import { useState, useCallback } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export default function Board() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [nodeId, setNodeId] = useState(1)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${nodeId}`,
      type: 'default',
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: { label: `Node ${nodeId}` },
    }
    setNodes((nds) => nds.concat(newNode))
    setNodeId((id) => id + 1)
  }, [nodeId, setNodes])

  return (
    <div className="w-screen h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      
      <button
        onClick={addNode}
        className="absolute top-4 left-4 z-10 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-lg transition-colors duration-200"
      >
        创建节点
      </button>
    </div>
  )
}
