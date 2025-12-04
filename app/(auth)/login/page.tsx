'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckSquare } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      toast({
        title: 'ログインエラー',
        description: 'メールアドレスまたはパスワードが正しくありません。',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* 左側：ブランドエリア */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <CheckSquare className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">Daily TODO</h1>
        </div>
        
        <div>
          <h2 className="text-4xl font-light leading-tight mb-4 text-white/95">
            シンプルで使いやすい<br />
            毎日のタスク管理
          </h2>
          <p className="text-white/70">
            タスクを整理して、生産性を向上させましょう
          </p>
          <div className="mt-8 flex gap-2">
            <div className="w-12 h-1.5 rounded-full bg-white/80" />
            <div className="w-3 h-1.5 rounded-full bg-white/40" />
            <div className="w-3 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
        
        <p className="text-white/50 text-sm">
          © 2024 Daily TODO. All rights reserved.
        </p>
      </div>

      {/* 右側：ログインフォーム */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* モバイル用ロゴ */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Daily TODO</h1>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              おかえりなさい
            </h2>
            <p className="mt-2 text-gray-600">
              アカウントにログインしてください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  パスワード
                </Label>
                <Link 
                  href="/reset-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  パスワードを忘れた方
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ログイン中...
                </>
              ) : (
                'ログイン'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link 
                href="/register" 
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                新規登録
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
