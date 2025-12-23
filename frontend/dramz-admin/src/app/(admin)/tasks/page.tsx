"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import Button from "@/components/ui/button/Button"
import { apiDelete, apiGet } from "@/lib/api"

type Task = {
  _id: string
  id?: string
  title: string
  description: string
  reward: number
  type: string
  link?: string
  isActive?: boolean
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case "manual":
      return "Ручной"
    case "like_series":
      return "Лайкнуть сериал"
    case "watch_series":
      return "Посмотреть сериал"
    case "invite_referral":
      return "Пригласить реферала"
    default:
      return type
  }
}

export default function TasksListPage() {
  const [items, setItems] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await apiGet<Task[]>("/admin/tasks")
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
    if (!confirm("Удалить задание?")) return
    try {
      setError(null)
      await apiDelete(`/admin/tasks/${id}`)
      load()
    } catch (e: any) {
      setError(e?.message || "Не удалось удалить задание")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Задания</h2>
        <div className="flex gap-3">
          <Link href="/tasks/pending">
            <Button size="sm" variant="outline">Модерация</Button>
          </Link>
          <Link href="/tasks/new">
            <Button size="sm">Создать задание</Button>
          </Link>
        </div>
      </div>
      {error && <p className="text-error-500">{error}</p>}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                <th className="py-3 pr-4">Название</th>
                <th className="py-3 pr-4">Описание</th>
                <th className="py-3 pr-4">Награда</th>
                <th className="py-3 pr-4">Тип</th>
                <th className="py-3 pr-4">Активно</th>
                <th className="py-3 pr-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map(task => {
                const id = task.id || task._id || ""
                return (
                  <tr key={id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 pr-4 font-medium">{task.title}</td>
                    <td className="py-3 pr-4 max-w-md truncate">{task.description}</td>
                    <td className="py-3 pr-4">{task.reward}</td>
                    <td className="py-3 pr-4">{getTypeLabel(task.type)}</td>
                    <td className="py-3 pr-4">{task.isActive ? "Да" : "Нет"}</td>
                    <td className="py-3 pr-4 space-x-2">
                      <Link href={`/tasks/${id}/edit`}>
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

