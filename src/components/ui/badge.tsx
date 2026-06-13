import { cn, categoryColor, categoryLabel } from '@/lib/utils'

interface BadgeProps {
  category: string
  className?: string
}

export function Badge({ category, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', categoryColor(category), className)}>
      {categoryLabel(category)}
    </span>
  )
}
