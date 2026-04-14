interface TopBarProps {
    isRecording: boolean
    connectionStatus: 'disconnected' | 'connecting' | 'connected'
    conversationId: string | null
    darkMode: boolean
    onToggleDarkMode: () => void
}

function TopBar({ isRecording, connectionStatus, conversationId, darkMode, onToggleDarkMode }: TopBarProps) {
    return (
        <header className={`backdrop-blur-xl border-b ${darkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
                            <img src="/Vertical QA Logo.png" alt="Vertical QA" className="w-10 h-10 object-contain" />
                        </div>
                        <div>
                            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                AI Call Monitor
                            </h1>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Real-time conversation intelligence
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isRecording && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md ${darkMode ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50/80 border border-red-200/50'}`}>
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className={`text-sm font-semibold ${darkMode ? 'text-red-300' : 'text-red-600'}`}>RECORDING</span>
                            </div>
                        )}

                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md ${darkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-50/80 border border-gray-200/50'}`}>
                            <div
                                className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                                    ? 'bg-green-500'
                                    : connectionStatus === 'connecting'
                                        ? 'bg-yellow-500 animate-pulse'
                                        : 'bg-red-500'
                                    }`}
                            ></div>
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {connectionStatus === 'connected'
                                    ? 'Connected'
                                    : connectionStatus === 'connecting'
                                        ? 'Connecting...'
                                        : 'Disconnected'}
                            </span>
                        </div>

                        {conversationId && (
                            <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md ${darkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-50/80 border border-gray-200/50'}`}>
                                <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    ID: {conversationId.substring(0, 8)}
                                </span>
                            </div>
                        )}

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={onToggleDarkMode}
                            className={`p-2 rounded-lg backdrop-blur-md transition-colors ${darkMode ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50' : 'bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/50'}`}
                            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {darkMode ? (
                                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default TopBar
