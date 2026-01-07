'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface WishListSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function WishListSearch({
  value,
  onChange,
  placeholder = 'このリスト内を検索...',
}: WishListSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 rounded-xl border-slate-200 focus:border-purple-400"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange('')}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
