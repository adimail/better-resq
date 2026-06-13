import { Waves, Flame, Tornado, CloudLightning } from 'lucide-react'

export const DisasterCategories = () => {
  const categories = [
    { name: 'Floods', icon: Waves, color: 'text-blue-500' },
    { name: 'Earthquakes', icon: Tornado, color: 'text-amber-600' },
    { name: 'Fires', icon: Flame, color: 'text-orange-500' },
    {
      name: 'Storms',
      icon: CloudLightning,
      color: 'text-slate-600 dark:text-slate-400',
    },
  ]

  return (
    <div className="px-4">
      <h2 className="text-sm font-black uppercase tracking-tight text-text-muted mb-3">
        Alert Categories
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center gap-3 p-3 bg-surface border border-[var(--color-border)] rounded-lg"
          >
            <cat.icon className={`w-6 h-6 ${cat.color}`} />
            <span className="text-xs font-black uppercase tracking-tight">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
