import type { ComponentType, SVGProps } from 'react'
import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { BasketIcon, BookIcon, GearIcon, SparkIcon } from './icons'

type Tab = {
  to: string
  labelKey: 'nav.ingredients' | 'nav.meals' | 'nav.ai' | 'nav.settings'
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const tabs: Tab[] = [
  { to: '/ingredients', labelKey: 'nav.ingredients', Icon: BasketIcon },
  { to: '/meals', labelKey: 'nav.meals', Icon: BookIcon },
  { to: '/ai', labelKey: 'nav.ai', Icon: SparkIcon },
  { to: '/settings', labelKey: 'nav.settings', Icon: GearIcon },
]

export default function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <ul className="mx-auto flex max-w-xl">
        {tabs.map(({ to, labelKey, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-1 text-xs ${
                  isActive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <Icon />
              <span>{t(labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
