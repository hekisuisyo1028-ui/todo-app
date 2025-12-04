import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, addDays, startOfWeek, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'yyyy年M月d日（E）'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr, { locale: ja })
}

export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getWeekDates(baseDate: Date): Date[] {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 }) // Monday start
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function isTodayDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isToday(d)
}

export function getDateLabel(date: string | Date): string {
  if (isTodayDate(date)) {
    return '今日'
  }
  return formatDate(date, 'M/d（E）')
}
