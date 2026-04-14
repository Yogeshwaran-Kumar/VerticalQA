import { useState } from 'react'
import { UserRole } from '../types'

interface RoleSelectionProps {
    onRoleSelect: (role: UserRole, name: string, roomId: string) => void
}

function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
    const [name, setName] = useState('')
    const [roomId, setRoomId] = useState('production-alpha')
    const [isRegistering] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedRole && name.trim() && roomId.trim()) {
            onRoleSelect(selectedRole, name.trim(), roomId.trim())
        }
    }

    const roles = [
        {
            id: 'customer' as UserRole,
            title: 'Customer',
            icon: (
                <svg className="w-16 h-16 text-brand-500 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            description: 'Initiate a support call with an agent.',
            color: 'ring-brand-500/50 hover:bg-brand-50'
        },
        {
            id: 'agent' as UserRole,
            title: 'Agent',
            icon: (
                <svg className="w-16 h-16 text-accent-500 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            ),
            description: 'Receive calls and get AI guidance.',
            color: 'ring-accent-500/50 hover:bg-accent-50'
        },
        {
            id: 'supervisor' as UserRole,
            title: 'Supervisor',
            icon: (
                <svg className="w-16 h-16 text-gray-800 dark:text-gray-200 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            description: 'Monitor all live sessions and metrics.',
            color: 'ring-gray-800/50 hover:bg-gray-100 dark:hover:bg-dark-panel'
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Background Decorators */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-400/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-400/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-5xl w-full z-10 animate-fade-in relative">
                <div className="text-center mb-12">
                    <div className="inline-block p-4 glass-panel rounded-[2rem] mb-6 animate-slide-up">
                        <img src="/Vertical QA Logo.png" alt="Vertical QA" className="w-20 h-20 object-contain drop-shadow-lg" />
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        Vertical <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-600">QA</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '150ms' }}>
                        {isRegistering ? 'Complete your registration to join.' : 'Select a portal to enter the production environment.'}
                    </p>
                </div>

                {!selectedRole ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {roles.map((role, i) => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`group glass-panel rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ring-1 ring-transparent hover:${role.color}`}
                                style={{ animationDelay: `${200 + i * 100}ms` }}
                            >
                                <div className="mb-6 p-5 rounded-2xl bg-gray-50/50 shadow-inner group-hover:bg-white transition-colors">
                                    {role.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-gray-900 group-hover:to-gray-600">
                                    {role.title}
                                </h3>
                                <p className="text-gray-500 font-medium">
                                    {role.description}
                                </p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel rounded-3xl p-8 max-w-md mx-auto shadow-2xl animate-slide-up bg-white/90">
                        <div className="text-center mb-8">
                            <div className="inline-block mb-4 p-4 rounded-full bg-gray-50 shadow-inner">
                                {roles.find(r => r.id === selectedRole)?.icon}
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                {roles.find(r => r.id === selectedRole)?.title} Login
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Jane Doe"
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all shadow-sm"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Session / Room ID
                                </label>
                                <input
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    placeholder="e.g. production-alpha"
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all shadow-sm"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-2 font-medium">
                                    All participants must use the exact same ID to connect.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole(null)}
                                    className="flex-1 px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all border border-gray-200 shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    Enter Room
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RoleSelection

