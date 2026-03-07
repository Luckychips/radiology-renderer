import type { ReactNode } from 'react'

interface BaseIconProps {
    iconColor?: string
    iconSize?: string
    children: ReactNode
}

export default function BaseIcon({ iconColor = 'white', iconSize = 'size-6', children }: BaseIconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
             stroke="currentColor"
             className={iconSize}
             style={{ color: iconColor }}>
            {children}
        </svg>
    )
}
