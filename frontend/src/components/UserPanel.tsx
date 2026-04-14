import { User, UserRole, RoomState } from '../types'

// Derive call status from room state
type CallStatus = 'idle' | 'waiting' | 'active' | 'ended'

function deriveCallStatus(roomState: RoomState | null): CallStatus {
    if (!roomState) return 'idle'
    if (roomState.status === 'waiting') return 'waiting'
    if (roomState.status === 'active') return 'active'
    return 'ended'
}

// Sub-component: UserInfo
interface UserInfoProps {
    name: string
    role: UserRole
}

function UserInfo({ name, role }: UserInfoProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                <img src="/Vertical QA Logo.png" alt="VQA" className="w-10 h-10 object-contain" />
            </div>
            <div>
                <div className="font-semibold text-gray-800">{name}</div>
                <div className="text-xs text-gray-500 capitalize flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        {role === 'customer' ? (
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        ) : (
                            <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        )}
                    </svg>
                    <span>{role}</span>
                </div>
            </div>
        </div>
    )
}

// Sub-component: CallStatus
interface CallStatusProps {
    status: CallStatus
    roomId?: string
}

function CallStatus({ status, roomId }: CallStatusProps) {
    const statusColors = {
        idle: 'bg-gray-400',
        waiting: 'bg-yellow-500',
        active: 'bg-green-500',
        ended: 'bg-red-500'
    }

    return (
        <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}></span>
            <span className="text-sm text-gray-600 capitalize">{status}</span>
            {roomId && status === 'active' && (
                <span className="text-xs text-gray-400 ml-2">
                    Room: {roomId.substring(0, 8)}
                </span>
            )}
        </div>
    )
}

// Sub-component: MakeCallButton
interface MakeCallButtonProps {
    onClick: () => void
    disabled: boolean
    disabledReason?: string
}

function MakeCallButton({ onClick, disabled, disabledReason }: MakeCallButtonProps) {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                disabled={disabled}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${disabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-98'
                    }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Make a Call</span>
            </button>
            {disabled && disabledReason && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {disabledReason}
                </div>
            )}
        </div>
    )
}

// Sub-component: QuickActions
interface QuickActionsProps {
    userRole: UserRole
    isCallActive: boolean
    onEndCall: () => void
    onViewHistory: () => void
    onToggleAvailability?: () => void
    isAvailable?: boolean
}

function QuickActions({
    userRole,
    isCallActive,
    onEndCall,
    onViewHistory,
    onToggleAvailability,
    isAvailable = true
}: QuickActionsProps) {
    return (
        <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Actions</div>

            {isCallActive && (
                <button
                    onClick={onEndCall}
                    className="w-full py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                    <span>End Call</span>
                </button>
            )}

            <button
                onClick={onViewHistory}
                className="w-full py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View History</span>
            </button>

            {userRole === 'agent' && onToggleAvailability && (
                <button
                    onClick={onToggleAvailability}
                    className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${isAvailable
                        ? 'bg-green-50 hover:bg-green-100 text-green-600'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                        }`}
                >
                    <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
                </button>
            )}
        </div>
    )
}

// Main UserPanel Component
interface UserPanelProps {
    user: User
    roomState: RoomState | null
    onMakeCall: () => void
    onEndCall: () => void
    connectionStatus: 'disconnected' | 'connecting' | 'connected'
    onToggleAvailability?: () => void
    isAvailable?: boolean
}

function UserPanel({
    user,
    roomState,
    onMakeCall,
    onEndCall,
    connectionStatus: _connectionStatus,
    onToggleAvailability,
    isAvailable = true
}: UserPanelProps) {
    const callStatus = deriveCallStatus(roomState)
    const isCallActive = callStatus === 'active' || callStatus === 'waiting'

    const getDisabledReason = (): string | undefined => {
        if (callStatus === 'active') return 'Already in an active call'
        if (callStatus === 'waiting') return 'Waiting for connection...'
        return undefined
    }

    const handleViewHistory = () => {
        // Placeholder - could navigate to history page or show modal
        console.log('View History clicked')
    }

    return (
        <div className="backdrop-blur-xl bg-white/80 border border-gray-200/50 rounded-xl shadow-lg p-5 space-y-5">
            {/* User Info Section */}
            <UserInfo name={user.name} role={user.role} />

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Call Status Section */}
            <CallStatus status={callStatus} roomId={roomState?.roomId} />

            {/* Make a Call Button - Only for customers */}
            {!isCallActive && user.role === 'customer' && (
                <MakeCallButton
                    onClick={onMakeCall}
                    disabled={isCallActive}
                    disabledReason={getDisabledReason()}
                />
            )}

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Quick Actions */}
            <QuickActions
                userRole={user.role}
                isCallActive={isCallActive}
                onEndCall={onEndCall}
                onViewHistory={handleViewHistory}
                onToggleAvailability={onToggleAvailability}
                isAvailable={isAvailable}
            />
        </div>
    )
}

export default UserPanel