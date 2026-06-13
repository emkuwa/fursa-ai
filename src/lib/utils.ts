import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDateShort(date)
}

export function daysUntil(date: string | Date): number {
  const now = new Date()
  const d = new Date(date)
  return Math.ceil((d.getTime() - now.getTime()) / 86400000)
}

export function deadlineColor(days: number): string {
  if (days < 0) return 'text-red-600'
  if (days <= 7) return 'text-red-500'
  if (days <= 30) return 'text-amber-500'
  return 'text-green-500'
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '...'
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    scholarship: 'Scholarship',
    foreign_job: 'Foreign Job',
    grant: 'Grant',
    tender: 'Tender',
    fellowship: 'Fellowship',
    startup_funding: 'Startup Funding',
    competition: 'Competition',
    internship: 'Internship',
    exchange_program: 'Exchange Program',
  }
  return labels[category] || category
}

export function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    scholarship: 'bg-blue-100 text-blue-800',
    foreign_job: 'bg-green-100 text-green-800',
    grant: 'bg-purple-100 text-purple-800',
    tender: 'bg-orange-100 text-orange-800',
    fellowship: 'bg-pink-100 text-pink-800',
    startup_funding: 'bg-yellow-100 text-yellow-800',
    competition: 'bg-red-100 text-red-800',
    internship: 'bg-teal-100 text-teal-800',
    exchange_program: 'bg-indigo-100 text-indigo-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

export function difficultyLabel(score: number): string {
  if (score >= 80) return 'Hard'
  if (score >= 50) return 'Medium'
  return 'Easy'
}

export function difficultyColor(score: number): string {
  if (score >= 80) return 'text-red-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-green-600'
}

export function urgencyLabel(days: number): string {
  if (days < 0) return 'Expired'
  if (days === 0) return 'Due Today'
  if (days <= 7) return `Due in ${days} days`
  if (days <= 30) return `Due in ${days} days`
  return `${Math.floor(days / 30)} months left`
}

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
