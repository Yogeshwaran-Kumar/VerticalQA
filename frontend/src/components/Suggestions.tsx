interface SuggestionsProps {
    suggestion: string
    botSpeaking?: boolean
}

function Suggestions({ suggestion, botSpeaking = false }: SuggestionsProps) {
    const copySuggestion = () => {
        if (suggestion) {
            navigator.clipboard.writeText(suggestion)
            alert('Suggestion copied to clipboard!')
        }
    }

    return (
        <div className={`rounded-lg shadow-md p-6 border-2 transition-all duration-500 ${botSpeaking ? 'bg-gradient-to-r from-indigo-900 to-purple-900 border-indigo-400 shadow-indigo-500/50' : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'}`}>
            {botSpeaking && (
                <div className="flex items-center gap-2 mb-4 animate-pulse">
                    <span className="text-xl">🤖</span>
                    <span className="text-sm font-bold text-indigo-200 uppercase tracking-wider">Bot is speaking to you (Private)</span>
                    <div className="flex gap-1 ml-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${botSpeaking ? 'bg-indigo-500' : 'bg-purple-600'}`}>
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${botSpeaking ? 'text-white' : 'text-gray-800'}`}>AI Suggestion</h3>
                    {suggestion ? (
                        <p className={`leading-relaxed ${botSpeaking ? 'text-indigo-100' : 'text-gray-700'}`}>{suggestion}</p>
                    ) : (
                        <p className={`italic ${botSpeaking ? 'text-indigo-300' : 'text-gray-400'}`}>
                            Listening to conversation... AI suggestions will appear here.
                        </p>
                    )}
                </div>
            </div>

            {suggestion && (
                <div className={`mt-4 pt-4 border-t ${botSpeaking ? 'border-indigo-700' : 'border-purple-200'}`}>
                    <div className="flex gap-2">
                        <button
                            onClick={copySuggestion}
                            className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </button>
                        <button className="px-3 py-1 bg-white text-purple-600 border border-purple-300 rounded-md text-sm font-medium hover:bg-purple-50 transition-colors flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Use Template
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Suggestions
