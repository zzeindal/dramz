"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import Button from "@/components/ui/button/Button"
import { apiDelete, apiGet, apiPut } from "@/lib/api"

type FAQ = {
  _id: string
  id?: string
  question: string
  answer: string
  order?: number
  isVisible?: boolean
}

export default function FAQListPage() {
  const [items, setItems] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await apiGet<FAQ[]>("/admin/faq")
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

  const remove = async (id: string) => {
    if (!confirm("Удалить FAQ?")) return
    try {
      setError(null)
      await apiDelete(`/admin/faq/${id}`)
      load()
    } catch (e: any) {
      setError(e?.message || "Не удалось удалить FAQ")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <Link href="/faq/new">
          <Button size="sm">Создать FAQ</Button>
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
                <th className="py-3 pr-4">Порядок</th>
                <th className="py-3 pr-4">Вопрос</th>
                <th className="py-3 pr-4">Ответ</th>
                <th className="py-3 pr-4">Видимость</th>
                <th className="py-3 pr-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map(faq => {
                const id = faq.id || faq._id || ""
                return (
                  <tr key={id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 pr-4">{faq.order ?? "-"}</td>
                    <td className="py-3 pr-4 max-w-md truncate">{faq.question}</td>
                    <td className="py-3 pr-4 max-w-md truncate">{faq.answer}</td>
                    <td className="py-3 pr-4">{faq.isVisible ? "Да" : "Нет"}</td>
                    <td className="py-3 pr-4 space-x-2">
                      <Link href={`/faq/${id}/edit`}>
                        <Button size="sm" variant="outline">Редактировать</Button>
                      </Link>
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

