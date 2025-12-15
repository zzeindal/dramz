"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import Button from "@/components/ui/button/Button"
import { apiDelete, apiGet, apiPut } from "@/lib/api"

type Series = {
  id: string
  _id?: string
  title: string
  description: string
  price: number
  isVisible?: boolean
  coverImage?: string
}

export default function SeriesListPage() {
  const [items, setItems] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await apiGet<Series[]>("/admin/series")
      setItems(data)
    } catch (e: any) {
      setError(e.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleVisibility = async (sid: string) => {
    try {
      setError(null)
      await apiPut(`/admin/series/${sid}/toggle-visibility`)
      load()
    } catch (e: any) {
      setError(e?.message || "Не удалось обновить видимость")
    }
  }

  const remove = async (sid: string) => {
    if (!confirm("Удалить сериал?")) return
    try {
      setError(null)
      await apiDelete(`/admin/series/${sid}`)
      load()
    } catch (e: any) {
      setError(e?.message || "Не удалось удалить сериал")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Сериалы</h2>
        <Link href="/series/new">
          <Button size="sm">Создать сериал</Button>
        </Link>
      </div>
      {error && <p className="text-error-500">{error}</p>}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                <th className="py-3 pr-4">Обложка</th>
                <th className="py-3 pr-4">Название</th>
                <th className="py-3 pr-4">Цена</th>
                <th className="py-3 pr-4">Видимость</th>
                <th className="py-3 pr-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map(s => {
                const id = s.id || s._id || ""
                return (
                  <tr key={id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 pr-4">
                      {s.coverImage ? (
                        <img src={`https://api.dramz.fun/` + s.coverImage} alt={s.title} className="w-16 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-10 bg-gray-100 dark:bg-[#0D0920] rounded" />
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Link className="text-brand-500" href={`/series/${id}`}>{s.title}</Link>
                    </td>
                    <td className="py-3 pr-4">{s.price}</td>
                    <td className="py-3 pr-4">{s.isVisible ? "Да" : "Нет"}</td>
                    <td className="py-3 pr-4 space-x-2">
                      <Link href={`/series/${id}/edit`}>
                        <Button size="sm" variant="outline">Редактировать</Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => toggleVisibility(id)}>
                        Переключить
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(id)}>
                        Удалить
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


