"use client"
import { useEffect, useState } from "react"
import Button from "@/components/ui/button/Button"
import { apiGet, apiPost } from "@/lib/api"

type Completion = {
  _id: string
  id?: string
  taskId: string
  task?: {
    title: string
    description: string
    reward: number
  }
  userId: string
  user?: {
    username?: string
    telegramId?: number
  }
  status: string
  note?: string
  createdAt?: string
}

function CompletionItem({ completion, onModerate }: { completion: Completion; onModerate: (id: string, status: "completed" | "rejected", note: string) => Promise<void> }) {
  const id = completion.id || completion._id || ""
  const [note, setNote] = useState("")
  const [moderating, setModerating] = useState(false)

  const handleModerate = async (status: "completed" | "rejected") => {
    setModerating(true)
    try {
      await onModerate(id, status, note)
      setNote("")
    } finally {
      setModerating(false)
    }
  }

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="space-y-3">
        <div>
          <div className="font-medium text-lg">{completion.task?.title || "Задание"}</div>
          <div className="text-sm text-gray-500">{completion.task?.description}</div>
        </div>
        <div className="text-sm">
          <div>Пользователь: {completion.user?.username || completion.user?.telegramId || completion.userId}</div>
          <div>Награда: {completion.task?.reward || 0} корон</div>
          {completion.createdAt && (
            <div>Дата: {new Date(completion.createdAt).toLocaleString()}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Примечание</label>
          <textarea
            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D0920] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            rows={2}
            placeholder="Примечание (опционально)"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button
            size="sm"
            onClick={() => handleModerate("completed")}
            disabled={moderating}
          >
            {moderating ? "Обработка..." : "Одобрить"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleModerate("rejected")}
            disabled={moderating}
          >
            {moderating ? "Обработка..." : "Отклонить"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PendingTasksPage() {
  const [items, setItems] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await apiGet<Completion[]>("/admin/tasks/completions/pending")
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

  const moderate = async (completionId: string, status: "completed" | "rejected", note: string) => {
    try {
      await apiPost(`/admin/tasks/completions/${completionId}/moderate`, { status, note })
      load()
    } catch (e: any) {
      setError(e.message || "Ошибка модерации")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Модерация заданий</h2>
      </div>
      {error && <p className="text-error-500">{error}</p>}
      {loading ? (
        <p>Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Нет заданий на модерацию</p>
      ) : (
        <div className="space-y-4">
          {items.map(completion => (
            <CompletionItem key={completion.id || completion._id} completion={completion} onModerate={moderate} />
          ))}
        </div>
      )}
    </div>
  )
}

