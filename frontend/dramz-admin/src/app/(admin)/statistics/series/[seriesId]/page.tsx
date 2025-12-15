"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { apiGet } from "@/lib/api"
import DatePicker from "@/components/form/date-picker"

type SeriesStats = {
  series: { id: string; title: string }
  views: { total: number; byEpisode: Record<string, number> }
  purchases: { count: number; revenue: number }
}

export default function SeriesStatsPage() {
  const params = useParams<{ seriesId: string }>()
  const seriesId = params.seriesId
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [data, setData] = useState<SeriesStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const q: any = {}
      if (startDate) q.startDate = startDate
      if (endDate) q.endDate = endDate
      const res = await apiGet<SeriesStats>(`/admin/statistics/series/${seriesId}`, q)
      setData(res)
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (seriesId) load()
  }, [seriesId])

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Статистика по сериалу</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
        <div>
          <DatePicker
            id="start-date-series"
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
            id="end-date-series"
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
              <div className="text-sm text-gray-500">Сериал</div>
              <div className="text-2xl font-semibold">{data.series.title}</div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500">Просмотры</div>
              <div className="text-2xl font-semibold">{data.views.total}</div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500">Доход</div>
              <div className="text-2xl font-semibold">{data.purchases.revenue}</div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold">Просмотры по сериям</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 pr-4">Серия</th>
                    <th className="py-3 pr-4">Просмотры</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.views.byEpisode).map(([ep, count]) => (
                    <tr key={ep} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 pr-4">{ep}</td>
                      <td className="py-3 pr-4">{count as number}</td>
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


