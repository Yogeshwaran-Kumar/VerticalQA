import { RoomInfo } from '../../types'
import Insights from '../Insights'
import Transcript from '../Transcript'

interface ConversationDetailPanelProps {
    room: RoomInfo | null
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function computeDuration(room: RoomInfo): string {
    if (room.callDurationSeconds !== undefined) {
        return formatDuration(room.callDurationSeconds)
    }
    if (room.startTime) {
        const ms = Date.now() - new Date(room.startTime).getTime()
        if (!isNaN(ms) && ms >= 0) {
            return formatDuration(Math.floor(ms / 1000))
        }
    }
    return '--:--'
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-5 text-gray-400 p-8 pt-16">
            <div className="relative animate-pulse-slow">
                <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full"></div>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-600 relative z-10">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>
            <p className="text-sm font-medium tracking-wide">Select a stream to intercept audio & metrics</p>
        </div>
    )
}

export function ConversationDetailPanel({ room }: ConversationDetailPanelProps) {
    if (!room) {
        return (
            <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm">
                <EmptyState />
            </div>
        )
    }

    const messages = room.messages ?? []
    const duration = computeDuration(room)
    const isHighRisk = room.escalationRisk === 'high'

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative">
            {/* Escalation alert banner */}
            {isHighRisk && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm font-medium flex-shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-400/10 blur-lg rounded-full animate-pulse"></div>
                    <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                        />
                    </svg>
                    High Escalation Risk — Immediate attention required
                </div>
            )}

            {/* Header with customer/agent info */}
            <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-gray-50">
                <p className="font-bold text-gray-800 text-lg">{room.customerName}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    {room.agentName ?? 'Waiting for agent'}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Advanced Analytics Injection */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                    <Insights
                        sentiment={room.sentiment || 'neutral'}
                        escalationRisk={room.escalationRisk || 'low'}
                        escalationScore={room.escalationScore || 0}
                        voiceEmotion={room.voiceEmotion || 'neutral'}
                        intent={room.intent || ''}
                        toxicityFlag={room.toxicityFlag}
                        suggestion={room.suggestion}
                        className="h-auto border-none shadow-none p-0 bg-transparent"
                    />
                </div>

                {/* Unified Transcript Section */}
                <div className="bg-white border-t border-gray-100 flex-1">
                    <Transcript messages={messages} />
                </div>
            </div>

            {/* Summary footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 flex-shrink-0 bg-gray-50">
                <span className="font-medium tracking-wide text-gray-500 uppercase">{messages.length} {messages.length === 1 ? 'Pulse' : 'Pulses'}</span>
                <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">{duration}</span>
            </div>
        </div>
    )
}

export default ConversationDetailPanel
