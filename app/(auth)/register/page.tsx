'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, CheckSquare } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'エラー',
        description: 'パスワードが一致しません。',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'エラー',
        description: 'パスワードは6文字以上で入力してください。',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      toast({
        title: '登録エラー',
        description: error.message,
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    toast({
      title: '登録完了',
      description: '確認メールを送信しました。メールを確認してください。',
    })
    
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* 左側：ブランドエリア */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <CheckSquare className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">Daily TODO</h1>
        </div>
        
        <div>
          <h2 className="text-4xl font-light leading-tight mb-4 text-white/95">
            今日から始める<br />
            効率的なタスク管理
          </h2>
          <p className="text-white/70">
            無料で始めて、毎日の生産性を向上させましょう
          </p>
          <div className="mt-8 flex gap-2">
            <div className="w-3 h-1.5 rounded-full bg-white/40" />
            <div className="w-12 h-1.5 rounded-full bg-white/80" />
            <div className="w-3 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
        
        <p className="text-white/50 text-sm">
          © 2024 Daily TODO. All rights reserved.
        </p>
      </div>

      {/* 右側：登録フォーム */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 戻るリンク */}
          <Link 
            href="/login" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ログインに戻る
          </Link>

          {/* モバイル用ロゴ */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Daily TODO</h1>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              アカウント作成
            </h2>
            <p className="mt-2 text-gray-600">
              無料で始めましょう
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
                className="h-12 rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                パスワード（確認）
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="もう一度入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  登録中...
                </>
              ) : (
                'アカウントを作成'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            登録することで、利用規約とプライバシーポリシーに同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  )
}
