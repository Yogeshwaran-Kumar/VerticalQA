import { useState, useMemo } from 'react'
import { AgentSession, RoomInfo } from '../types'
import {
    KpiCard,
    AgentStatusPanel,
    SentimentChart,
    ConversationCard,
    ConversationDetailPanel,
} from '../components/supervisor'

interface SupervisorDashboardProps {
    userName: string
    rooms: RoomInfo[]
    agents: AgentSession[]
    onLogout: () => void
    onMonitorRoom: (roomId: string) => void
    onStopMonitoring: () => void
    monitoredRoomId: string | null
}

function formatMMSS(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60)
    const s = Math.floor(totalSeconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SupervisorDashboard({ userName, rooms, agents, onLogout, onMonitorRoom, onStopMonitoring, monitoredRoomId }: SupervisorDashboardProps) {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

    const activeRooms = useMemo(() => rooms.filter(r => r.status === 'active'), [rooms])
    const activeCount = useMemo(() => activeRooms.length, [activeRooms])
    const waitingCount = useMemo(() => rooms.filter(r => r.status === 'waiting').length, [rooms])
    const highRiskCount = useMemo(() => activeRooms.filter(r => r.escalationRisk === 'high').length, [activeRooms])

    const avgDuration = useMemo(() => {
        if (activeRooms.length === 0) return '00:00'
        const now = Date.now()
        const totalSeconds = activeRooms.reduce((sum, r) => {
            const ms = now - new Date(r.startTime).getTime()
            return sum + (isNaN(ms) || ms < 0 ? 0 : ms / 1000)
        }, 0)
        return formatMMSS(totalSeconds / activeRooms.length)
    }, [activeRooms])

    const sentimentCounts = useMemo(() => ({
        positive: activeRooms.filter(r => r.sentiment === 'positive').length,
        neutral: activeRooms.filter(r => r.sentiment === 'neutral').length,
        negative: activeRooms.filter(r => r.sentiment === 'negative').length,
    }), [activeRooms])

    const selectedRoom = useMemo(() => rooms.find(r => r.roomId === selectedRoomId) ?? null, [rooms, selectedRoomId])

    const handleRoomSelect = (roomId: string) => {
        setSelectedRoomId(roomId)
        onMonitorRoom(roomId)
    }

    useState(() => {
        return () => {
            onStopMonitoring()
        }
    })

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-brand-500 overflow-x-hidden">
            {/* Dark Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-accent-600 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Mission Control</h1>
                                <p className="text-sm text-brand-600 font-medium">Supervisor: {userName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold transition-all shadow-sm"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
                {/* KPI Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <KpiCard label="Active Sessions" value={activeCount} icon="phone" color="blue" />
                    <KpiCard label="Queued" value={waitingCount} icon="clock" color="purple" />
                    <KpiCard label="Escalation Risk" value={highRiskCount} icon="warning" color="red" />
                    <KpiCard label="Avg Duration" value={avgDuration} icon="timer" color="green" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Hand: Stats */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <AgentStatusPanel agents={agents} rooms={rooms} />
                        <SentimentChart
                            positive={sentimentCounts.positive}
                            neutral={sentimentCounts.neutral}
                            negative={sentimentCounts.negative}
                        />
                    </div>

                    {/* Middle: Active Streams */}
                    <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-280px)] transcript-container pr-2">
                        {activeRooms.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 py-32 rounded-2xl border border-dashed border-gray-300 bg-white">
                                <div className="p-4 rounded-full bg-gray-50 border border-gray-100 mb-4 animate-pulse-slow">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 font-medium tracking-wide">Awaiting Uplink...</p>
                            </div>
                        ) : (
                            activeRooms.map((room, i) => (
                                <div key={room.roomId} className="animate-slide-up hover:-translate-y-1 transition-transform" style={{animationDelay: `${i * 100}ms`}}>
                                    <ConversationCard
                                        room={room}
                                        isSelected={selectedRoomId === room.roomId}
                                        onClick={() => handleRoomSelect(room.roomId)}
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    {/* Right Hand: Deep Dive Panel */}
                    <div className="lg:col-span-5 min-h-[400px]">
                        {monitoredRoomId && selectedRoomId === monitoredRoomId && (
                            <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                    </div>
                                    <span className="font-semibold text-blue-700 tracking-wide text-sm uppercase">Live Tap Active</span>
                                </div>
                                <span className="text-xs text-blue-500/70 font-mono">{monitoredRoomId}</span>
                            </div>
                        )}
                        <ConversationDetailPanel room={selectedRoom} />
                    </div>
                </div>
            </main>
        </div>
    )
}

export default SupervisorDashboard
