'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Lock, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { updatePassword } = useAuth()
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

    const { error } = await updatePassword(password)

    if (error) {
      toast({
        title: 'エラー',
        description: error.message,
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    setIsSuccess(true)
    setIsLoading(false)
  }

  // 成功画面
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            パスワードを変更しました
          </h2>
          
          <p className="text-gray-600 mb-8">
            新しいパスワードでログインできます。
          </p>

          <Button 
            onClick={() => router.push('/login')}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            ログインへ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="h-10 w-10 text-blue-600" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            新しいパスワードを設定
          </h2>
          <p className="mt-2 text-gray-600">
            6文字以上のパスワードを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              新しいパスワード
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
            className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                変更中...
              </>
            ) : (
              'パスワードを変更'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
