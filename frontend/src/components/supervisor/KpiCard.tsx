import React from 'react'

type IconType = 'phone' | 'clock' | 'warning' | 'timer'
type ColorType = 'purple' | 'blue' | 'red' | 'green'

interface KpiCardProps {
    label: string
    value: number | string
    icon: IconType
    color: ColorType
}

const colorClasses: Record<ColorType, { bg: string; text: string }> = {
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
}

function PhoneIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
        </svg>
    )
}

function ClockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 5a1 1 0 10-2 0v5a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L13 11.586V7z" clipRule="evenodd" />
        </svg>
    )
}

function WarningIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    )
}

function TimerIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 2a1 1 0 000 2h1v1.07A9 9 0 1021 12h-1a1 1 0 100 2 7 7 0 11-7-7V5h1a1 1 0 100-2h-4zm5 9a1 1 0 00-1-1h-3V7a1 1 0 10-2 0v4a1 1 0 001 1h4a1 1 0 001-1z" clipRule="evenodd" />
        </svg>
    )
}

const icons: Record<IconType, React.ReactElement> = {
    phone: <PhoneIcon />,
    clock: <ClockIcon />,
    warning: <WarningIcon />,
    timer: <TimerIcon />,
}

export function KpiCard({ label, value, icon, color }: KpiCardProps) {
    const { bg, text } = colorClasses[color]

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`${bg} ${text} rounded-full p-3 flex-shrink-0`}>
                {icons[icon]}
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-sm text-gray-500 mt-1 truncate">{label}</p>
            </div>
        </div>
    )
}

export default KpiCard
