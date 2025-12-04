'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const { resetPassword } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      toast({
        title: 'エラー',
        description: error.message,
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    setIsSent(true)
    setIsLoading(false)
  }

  // 送信完了画面
  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            メールを送信しました
          </h2>
          
          <p className="text-gray-600 mb-8">
            <span className="font-semibold text-gray-900">{email}</span> に
            パスワードリセット用のリンクを送信しました。
            メールを確認してください。
          </p>

          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ログインに戻る
              </Button>
            </Link>
            
            <button
              onClick={() => setIsSent(false)}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              別のメールアドレスで試す
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md">
        {/* 戻るリンク */}
        <Link 
          href="/login" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          ログインに戻る
        </Link>

        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-10 w-10 text-blue-600" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            パスワードをリセット
          </h2>
          <p className="mt-2 text-gray-600">
            登録したメールアドレスを入力してください
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

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                送信中...
              </>
            ) : (
              'リセットメールを送信'
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          メールが届かない場合は、迷惑メールフォルダを確認してください。
        </p>
      </div>
    </div>
  )
}
