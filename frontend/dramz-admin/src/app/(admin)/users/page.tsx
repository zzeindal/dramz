"use client"
import { useState } from "react"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Button from "@/components/ui/button/Button"
import { apiGet } from "@/lib/api"
import Link from "next/link"

type UserSearchResult = {
  found: boolean
  user: {
    telegramId: number
    username?: string
    displayName?: string
    crowns: number
    registeredAt: string
    lastActivityAt: string
  }
  purchases: any[]
  totalSpent: number
  referredBy: { id?: string; username?: string } | null
  referrals: any[]
}

export default function UsersSearchPage() {
  const [q, setQ] = useState("")
  const [result, setResult] = useState<UserSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const data = await apiGet<UserSearchResult>("/admin/users/search", { query: q })
      setResult(data)
    } catch (e: any) {
      setError(e.message || "Не найдено")
    } finally {
      setLoading(false)
    }
  }
  console.log(result)
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Поиск пользователя</h2>
      <form onSubmit={search} className="flex gap-3 items-end max-w-xl">
        <div className="flex-1">
          <Label>Telegram ID или username</Label>
          <Input placeholder="123456789 или username" onChange={e => setQ(e.target.value)} />
        </div>
        <Button size="sm">{loading ? "Поиск..." : "Найти"}</Button>
      </form>
      {error && <p className="text-error-500">{error}</p>}
      {result && result.found && result.user && (
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="text-lg font-medium">{result.user.displayName || result.user.username || "-"}</div>
              {result.user.username && result.user.displayName && (
                <div className="text-sm text-gray-500">Username: {result.user.username}</div>
              )}
              <div className="text-sm text-gray-500">Telegram ID: {result.user.telegramId}</div>
              <div className="text-sm">Crowns: {result.user.crowns}</div>
              <div className="text-sm">Total Spent: {result.totalSpent}</div>
              <div className="text-sm">Purchases: {result.purchases?.length ?? 0}</div>
              <div className="text-sm">Referrals: {result.referrals?.length ?? 0}</div>
              <div className="text-sm">Referred By: {result.referredBy?.username || "-"}</div>
              <div className="text-sm text-gray-500">
                Registered: {new Date(result.user.registeredAt).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                Last Activity: {new Date(result.user.lastActivityAt).toLocaleString()}
              </div>
            </div>
            <Link href={`/users/${result.user._id}`}>
              <Button size="sm">Открыть</Button>
            </Link>
          </div>
        </div>
      )}
      {result && !result.found && (
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500">Пользователь не найден</p>
        </div>
      )}
    </div>
  )
}


