interface InsightsProps {
    sentiment: 'positive' | 'neutral' | 'negative'
    escalationRisk: 'low' | 'medium' | 'high'
    escalationScore?: number
    voiceEmotion?: string
    intent?: string
    toxicityFlag?: boolean
    suggestion?: string
    botSpeaking?: boolean
    className?: string
}

function Insights({
    sentiment,
    escalationRisk,
    escalationScore = 0,
    voiceEmotion = 'neutral',
    intent,
    toxicityFlag,
    suggestion,
    botSpeaking = false,
    className = '',
}: InsightsProps) {
    const sentimentColor = {
        positive: 'bg-green-50 text-green-700 border-green-200',
        neutral: 'bg-gray-50 text-gray-700 border-gray-200',
        negative: 'bg-red-50 text-red-700 border-red-200',
    }[sentiment]

    const riskColor = {
        low: 'bg-green-50 text-green-700 border-green-200',
        medium: 'bg-orange-50 text-orange-700 border-orange-200',
        high: 'bg-red-50 text-red-700 border-red-300',
    }[escalationRisk]

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 flex flex-col ${className || 'h-[600px]'}`}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-800">Call Intelligence</h2>
                {toxicityFlag && (
                    <span className="animate-pulse px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        Toxicity Detected
                    </span>
                )}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                {/* AI Agent Suggestion / Bot Speaker */}
                {(suggestion || botSpeaking) && (
                    <div className={`w-full p-5 rounded-xl border-2 transition-all duration-500 shadow-sm ${botSpeaking ? 'bg-gradient-to-r from-indigo-900 to-purple-900 border-indigo-400' : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'}`}>
                        {botSpeaking && (
                            <div className="flex items-center gap-2 mb-3 animate-pulse">
                                <span className="text-xl">🤖</span>
                                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Bot is speaking to you (Private)</span>
                                <div className="flex gap-1 ml-2">
                                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${botSpeaking ? 'text-indigo-200' : 'text-purple-400'}`}>
                            Live AI Suggestion
                        </label>
                        <p className={`font-medium ${botSpeaking ? 'text-white' : 'text-purple-900'}`}>{suggestion || 'Listening...'}</p>
                    </div>
                )}

                {/* Intent Block */}
                <div className="group">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Intent</label>
                    <div className={`w-full p-4 rounded-xl border transition-all ${intent ? 'bg-purple-50/50 border-purple-100 text-purple-900 shadow-sm' : 'bg-gray-50/50 border-dashed border-gray-200 text-gray-400 italic'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${intent ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <span className="font-medium text-base capitalize">{intent ? intent.replace(/_/g, ' ') : 'Listening...'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Sentiment Block */}
                    <div className="group">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sentiment</label>
                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${sentimentColor}`}>
                            <span className="text-2xl">{sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😠' : '😐'}</span>
                            <span className="font-medium text-sm capitalize">{sentiment}</span>
                        </div>
                    </div>

                    {/* Emotion Block */}
                    <div className="group">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Voice Emotion</label>
                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 text-blue-900 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                            <span className="text-2xl">{voiceEmotion === 'happiness' ? '😃' : voiceEmotion === 'sadness' ? '😢' : voiceEmotion === 'anger' ? '😡' : voiceEmotion === 'fear' ? '😨' : voiceEmotion === 'disgust' ? '🤢' : '😌'}</span>
                            <span className="font-medium text-sm capitalize">{voiceEmotion}</span>
                        </div>
                    </div>
                </div>

                {/* Escalation Risk Block */}
                <div className="group pt-2">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Escalation Risk</label>
                    <div className={`w-full p-4 rounded-xl border transition-all shadow-sm ${riskColor} ${escalationRisk === 'high' ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold capitalize flex items-center gap-2">
                                {escalationRisk === 'high' && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                                {escalationRisk} Risk
                            </span>
                            <span className="text-sm font-bold opacity-70">{Math.round((escalationScore || 0) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                            <div className="h-full bg-current rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.round((escalationScore || 0) * 100)}%` }} />
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    )
}

export default Insights
