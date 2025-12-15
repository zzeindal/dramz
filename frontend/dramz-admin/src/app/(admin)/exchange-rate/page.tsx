"use client"

import { useEffect, useMemo, useState } from "react"
import { apiGet, apiPut } from "@/lib/api"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"

type ExchangeRate = {
  _id: string
  rubPerCrown: number
  usdPerCrown: number
  telegramStarPerCrown: number
  isActive: boolean
  changedBy?: string
  createdAt?: string
  updatedAt?: string
}

type UpdateBody = {
  rubPerCrown?: number
  usdPerCrown?: number
  telegramStarPerCrown?: number
}

export default function ExchangeRatePage() {
  const [current, setCurrent] = useState<ExchangeRate | null>(null)
  const [history, setHistory] = useState<ExchangeRate[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rub, setRub] = useState<string>("")
  const [usd, setUsd] = useState<string>("")
  const [tg, setTg] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const c = await apiGet<ExchangeRate>("/admin/exchange-rate")
      setCurrent(c)
      const h = await apiGet<ExchangeRate[]>("/admin/exchange-rate/history")
      setHistory(h)
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const body: UpdateBody = {}
    if (rub.trim() !== "" && !Number.isNaN(Number(rub))) body.rubPerCrown = Number(rub)
    if (usd.trim() !== "" && !Number.isNaN(Number(usd))) body.usdPerCrown = Number(usd)
    if (tg.trim() !== "" && !Number.isNaN(Number(tg))) body.telegramStarPerCrown = Number(tg)
    if (Object.keys(body).length === 0) {
      setMsg("Укажите хотя бы одно поле")
      return
    }
    setSaving(true)
    try {
      const updated = await apiPut<ExchangeRate>("/admin/exchange-rate", body)
      setMsg("Курс успешно обновлен")
      setRub("")
      setUsd("")
      setTg("")
      setCurrent(updated)
      // Reload history to include the new record
      const h = await apiGet<ExchangeRate[]>("/admin/exchange-rate/history")
      setHistory(h)
    } catch (e: any) {
      setMsg(e.message || "Ошибка обновления")
    } finally {
      setSaving(false)
    }
  }

  const sortedHistory = useMemo(() => {
    if (!history) return null
    return [...history].sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bd - ad
    })
  }, [history])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Exchange Rate</h1>

      {loading ? (
        <p>Загрузка...</p>
      ) : error ? (
        <p className="text-error-500">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <h3 className="mb-4 text-lg font-semibold">Текущий курс</h3>
              {current ? (
                <div className="space-y-2 text-sm">
                  <div>RUB за корону: <span className="font-medium">{current.rubPerCrown}</span></div>
                  <div>USD за корону: <span className="font-medium">{current.usdPerCrown}</span></div>
                  <div>Telegram Stars за корону: <span className="font-medium">{current.telegramStarPerCrown}</span></div>
                  <div className="text-gray-500">Изменил: {current.changedBy || "-"}</div>
                  <div className="text-gray-500">Обновлено: {current.updatedAt ? new Date(current.updatedAt).toLocaleString() : "-"}</div>
                </div>
              ) : (
                <p>Нет данных</p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <h3 className="mb-4 text-lg font-semibold">Обновить курс</h3>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label>RUB за корону</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder={current ? String(current.rubPerCrown) : "1"}
                    value={rub}
                    onChange={(e) => setRub(e.target.value)}
                  />
                </div>
                <div>
                  <Label>USD за корону</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder={current ? String(current.usdPerCrown) : "0.01"}
                    value={usd}
                    onChange={(e) => setUsd(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Telegram Stars за корону</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder={current ? String(current.telegramStarPerCrown) : "1"}
                    value={tg}
                    onChange={(e) => setTg(e.target.value)}
                  />
                </div>
                {msg && <p className="text-sm">{msg}</p>}
                <Button size="sm" disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</Button>
              </form>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold">История курсов</h3>
            {!sortedHistory ? (
              <p>Загрузка...</p>
            ) : sortedHistory.length === 0 ? (
              <p>Пусто</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-800">
                    <tr className="text-gray-500">
                      <th className="py-2 pr-4">Дата</th>
                      <th className="py-2 pr-4">RUB</th>
                      <th className="py-2 pr-4">USD</th>
                      <th className="py-2 pr-4">TG Stars</th>
                      <th className="py-2 pr-4">Активен</th>
                      <th className="py-2 pr-4">Изменил</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.map((r) => (
                      <tr key={r._id} className="border-b border-gray-100 dark:border-gray-900">
                        <td className="py-2 pr-4">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                        <td className="py-2 pr-4">{r.rubPerCrown}</td>
                        <td className="py-2 pr-4">{r.usdPerCrown}</td>
                        <td className="py-2 pr-4">{r.telegramStarPerCrown}</td>
                        <td className="py-2 pr-4">{r.isActive ? "Да" : "Нет"}</td>
                        <td className="py-2 pr-4">{r.changedBy || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


