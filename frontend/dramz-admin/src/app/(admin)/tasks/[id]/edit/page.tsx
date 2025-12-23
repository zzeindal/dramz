"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import { apiGet, apiPut } from "@/lib/api"

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

export default function EditTaskPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const [task, setTask] = useState<Task | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [reward, setReward] = useState<number | "">("")
  const [type, setType] = useState("manual")
  const [link, setLink] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await apiGet<Task>(`/admin/tasks/${id}`)
      setTask(data)
      setTitle(data.title)
      setDescription(data.description)
      setReward(data.reward)
      setType(data.type)
      setLink(data.link || "")
      setIsActive(data.isActive ?? true)
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const body: any = {
        title,
        description,
        reward: Number(reward),
        type,
        isActive
      }
      if (link.trim()) {
        // Валидация ссылки - только HTTP/HTTPS URLs
        const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
        if (!urlPattern.test(link.trim())) {
          setError("Некорректная ссылка. Используйте только HTTP/HTTPS URLs")
          setSaving(false)
          return
        }
        // Блокировка опасных протоколов и паттернов
        const dangerousPatterns = [
          /javascript:|data:|vbscript:|file:|ftp:/i,
          /\.\.\/|\.\.\\|eval\(|exec\(|spawn\(/i,
          /<script|<\/script>/i,
        ]
        if (dangerousPatterns.some(pattern => pattern.test(link))) {
          setError("Ссылка содержит недопустимые символы")
          setSaving(false)
          return
        }
        body.link = link.trim()
      }
      await apiPut(`/admin/tasks/${id}`, body)
      router.push("/tasks")
    } catch (e: any) {
      setError(e.message || "Ошибка обновления")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Загрузка...</p>
  }

  if (error && !task) {
    return <p className="text-error-500">{error}</p>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">Редактировать задание</h2>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <Label>Название</Label>
          <Input
            placeholder="Сделать репост в Instagram"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label>Описание</Label>
          <textarea
            className="w-full px-4 py-3 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D0920] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Сделайте репост нашей публикации в Instagram и получите награду"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label>Награда (короны)</Label>
          <Input
            type="number"
            placeholder="50"
            value={reward}
            onChange={e => setReward(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Тип</Label>
          <select
            className="w-full px-4 py-3 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D0920] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="manual">Ручной</option>
            <option value="like_series">Лайкнуть сериал</option>
            <option value="watch_series">Посмотреть сериал</option>
            <option value="invite_referral">Пригласить реферала</option>
          </select>
        </div>
        <div>
          <Label>Ссылка</Label>
          <Input
            type="url"
            placeholder="https://instagram.com/p/example"
            value={link}
            onChange={e => setLink(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <Label htmlFor="isActive" className="mb-0">Активно</Label>
        </div>
        {error && <p className="text-error-500">{error}</p>}
        <div className="flex gap-3">
          <Button size="sm" type="submit" disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          <Button size="sm" variant="outline" type="button" onClick={() => router.back()}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  )
}

