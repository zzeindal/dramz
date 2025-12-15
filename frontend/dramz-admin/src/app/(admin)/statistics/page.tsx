"use client"
import { useEffect, useState } from "react"
import { apiGet } from "@/lib/api"
import DatePicker from "@/components/form/date-picker"

type GlobalStats = {
  users: { total: number; inRange?: number }
  views: { total: number }
  revenue: { total: number }
  viewsByEpisode: { seriesId: string; seriesTitle: string; episodeNumber: number; views: number }[]
}

export default function StatisticsPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [data, setData] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const q: any = {}
      if (startDate) q.startDate = startDate
      if (endDate) q.endDate = endDate
      const res = await apiGet<GlobalStats>("/admin/statistics", q)
      setData(res)
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Статистика</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
        <div>
          <DatePicker
            id="start-date"
            label="Начальная дата"
            placeholder="Выберите дату"
            onChange={(dates, currentDateString) => {
              if (currentDateString) {
                setStartDate(currentDateString)
              }
            }}
          />
        </div>
        <div>
          <DatePicker
            id="end-date"
            label="Конечная дата"
            placeholder="Выберите дату"
            onChange={(dates, currentDateString) => {
              if (currentDateString) {
                setEndDate(currentDateString)
              }
            }}
          />
        </div>
        <div className="flex items-end">
          <button onClick={load} className="px-5 py-3.5 text-sm rounded-lg bg-brand-500 text-white">Применить</button>
        </div>
      </div>
      {error && <p className="text-error-500">{error}</p>}
      {loading ? (
        <p>Загрузка...</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500">Пользователи</div>
              <div className="text-2xl font-semibold">{data.users.total}</div>
              {typeof data.users.inRange === "number" && <div className="text-sm text-gray-500">За период: {data.users.inRange}</div>}
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500">Просмотры</div>
              <div className="text-2xl font-semibold">{data.views.total}</div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500">Доходы (короны)</div>
              <div className="text-2xl font-semibold">{data.revenue.total}</div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold">Популярность серий</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 pr-4">Сериал</th>
                    <th className="py-3 pr-4">Серия</th>
                    <th className="py-3 pr-4">Просмотры</th>
                  </tr>
                </thead>
                <tbody>
                  {data.viewsByEpisode.map((v, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 pr-4">
                        <a className="text-brand-500" href={`/statistics/series/${v.seriesId}`}>{v.seriesTitle}</a>
                      </td>
                      <td className="py-3 pr-4">{v.episodeNumber}</td>
                      <td className="py-3 pr-4">{v.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}


