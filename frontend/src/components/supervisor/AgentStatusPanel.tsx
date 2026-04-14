import type { AgentSession, RoomInfo } from '../../types'

interface AgentStatusPanelProps {
    agents: AgentSession[]
    rooms: RoomInfo[]
}

function StatusDot({ status }: { status: 'online' | 'offline' | 'in-call' }) {
    const color =
        status === 'online' || status === 'in-call'
            ? 'bg-green-500'
            : 'bg-gray-400'
    return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
}

function statusLabel(agentStatus: 'online' | 'offline', inCall: boolean): string {
    if (inCall) return 'In Call'
    return agentStatus === 'online' ? 'Online' : 'Offline'
}

export function AgentStatusPanel({ agents, rooms }: AgentStatusPanelProps) {
    const activeRooms = rooms.filter(r => r.status === 'active')

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Agent Status
            </h2>

            {agents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No agents available</p>
            ) : (
                <ul className="space-y-3">
                    {agents.map(agent => {
                        const activeRoom = activeRooms.find(r => r.roomId === agent.roomId) ?? null
                        const inCall = activeRoom !== null
                        const label = statusLabel(agent.status, inCall)
                        const dotStatus = inCall ? 'in-call' : agent.status

                        return (
                            <li key={agent.userId} className="flex items-center gap-3">
                                <StatusDot status={dotStatus} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {agent.name}
                                    </p>
                                    {inCall && activeRoom ? (
                                        <p className="text-xs text-gray-500 truncate">
                                            {label} · {activeRoom.customerName}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500">{label}</p>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

export default AgentStatusPanel
