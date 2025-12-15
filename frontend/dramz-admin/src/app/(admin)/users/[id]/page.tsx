"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { apiGet, apiPost, getAuth } from "@/lib/api"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"

type User = {
  _id: string
  id?: string
  username?: string
  telegramId?: number
  balance?: number
  purchases?: { seriesId: string; title?: string; price?: number }[]
  referrals?: { id: string; username?: string }[]
  invitedBy?: { id?: string; username?: string } | null
}

type UserStats = {
  registeredAt?: string
  lastActiveAt?: string
  purchasesSum?: number
  referrals?: { id: string; username?: string }[]
  crowns?: number
  invitedBy?: { id?: string; username?: string } | null
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | "">("")
  const [description, setDescription] = useState("")
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const u = await apiGet<User>(`/admin/users/${id}`)
      setUser(u)
      const s = await apiGet<UserStats>(`/admin/users/${id}/statistics`)
      setStats(s)
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
  }, [id])

  const changeBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    setTxMsg(null)
    if (amount === "" || Number.isNaN(amount)) return
    setWorking(true)
    try {
      const auth = getAuth()
      await apiPost(`/admin/users/${id}/balance`, {
        amount: Number(amount),
        description,
        // userId: auth.admin?.id || ""
      })
      setTxMsg("Баланс обновлен")
      setAmount("")
      setDescription("")
      load()
    } catch (e: any) {
      setTxMsg(e.message || "Ошибка")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-8">
      {loading ? (
        <p>Загрузка...</p>
      ) : error ? (
        <p className="text-error-500">{error}</p>
      ) : user ? (
        <>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-xl font-semibold">{user.username || "-"}</div>
            <div className="text-sm text-gray-500">ID: {user.id || user._id}</div>
            <div className="text-sm text-gray-500">Telegram: {user.telegramId || "-"}</div>
            <div className="text-sm">Баланс: {user.balance ?? 0}</div>
            <div className="text-sm">Покупок: {user.purchases?.length ?? 0}</div>
            <div className="text-sm">Рефералов: {user.referrals?.length ?? 0}</div>
            <div className="text-sm">Пригласил: {user.invitedBy?.username || "-"}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <h3 className="mb-4 text-lg font-semibold">Изменить баланс</h3>
              <form onSubmit={changeBalance} className="space-y-4">
                <div>
                  <Label>Сумма (положительное начисляет, отрицательное списывает)</Label>
                  <Input type="number" placeholder="100" onChange={e => setAmount(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Описание</Label>
                  <Input placeholder="Причина" onChange={e => setDescription(e.target.value)} />
                </div>
                {txMsg && <p>{txMsg}</p>}
                <Button size="sm" disabled={working}>{working ? "Сохранение..." : "Применить"}</Button>
              </form>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <h3 className="mb-4 text-lg font-semibold">Статистика</h3>
              {stats ? (
                <div className="text-sm space-y-2">
                  <div>Дата регистрации: {stats.registeredAt || "-"}</div>
                  <div>Последняя активность: {stats.lastActiveAt || "-"}</div>
                  <div>Сумма покупок: {stats.purchasesSum ?? 0}</div>
                  <div>Валюта (короны): {stats.crowns ?? user.balance ?? 0}</div>
                  <div>Рефералов: {stats.referrals?.length ?? user.referrals?.length ?? 0}</div>
                  <div>Пригласил: {stats.invitedBy?.username || user.invitedBy?.username || "-"}</div>
                </div>
              ) : (
                <p>Нет данных</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}


