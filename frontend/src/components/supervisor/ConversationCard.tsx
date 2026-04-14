import { RoomInfo } from '../../types'
import { RiskBadge } from './RiskBadge'
import { SentimentBadge } from './SentimentBadge'

interface ConversationCardProps {
    room: RoomInfo
    isSelected: boolean
    onClick: () => void
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

export function ConversationCard({ room, isSelected, onClick }: ConversationCardProps) {
    const duration = computeDuration(room)
    const agentLabel = room.agentName ?? 'Waiting for agent'

    const borderClass = isSelected
        ? 'border-brand-500 bg-brand-900/20 shadow-[0_0_15px_rgba(14,165,233,0.15)] transform scale-[1.02]'
        : 'border-dark-border/50 bg-dark-panel/40 hover:bg-dark-panel hover:border-dark-border'

    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-xl border-2 p-4 transition-colors ${borderClass}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-semibold text-gray-100 truncate">{room.customerName}</p>
                    <p className="text-sm text-gray-400 truncate mt-0.5">{agentLabel}</p>
                </div>
                <span className="text-xs text-brand-400 font-mono flex-shrink-0 mt-0.5">{duration}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
                <RiskBadge risk={room.escalationRisk} />
                <SentimentBadge sentiment={room.sentiment} />
            </div>
        </button>
    )
}

export default ConversationCard
