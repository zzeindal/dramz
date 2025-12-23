"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import { apiPost } from "@/lib/api"

export default function CreateTaskPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [reward, setReward] = useState<number | "">("")
  const [type, setType] = useState("manual")
  const [link, setLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim() || !description.trim() || reward === "" || Number.isNaN(Number(reward))) {
      setError("Все поля обязательны")
      return
    }
    setLoading(true)
    try {
      const body: any = {
        title,
        description,
        reward: Number(reward),
        type
      }
      if (link.trim()) {
        // Валидация ссылки - только HTTP/HTTPS URLs
        const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
        if (!urlPattern.test(link.trim())) {
          setError("Некорректная ссылка. Используйте только HTTP/HTTPS URLs")
          setLoading(false)
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
          setLoading(false)
          return
        }
        body.link = link.trim()
      }
      await apiPost("/admin/tasks", body)
      router.push("/tasks")
    } catch (e: any) {
      setError(e.message || "Ошибка создания")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">Создать задание</h2>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <Label>Название *</Label>
          <Input
            placeholder="Сделать репост в Instagram"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label>Описание *</Label>
          <textarea
            className="w-full px-4 py-3 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D0920] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Сделайте репост нашей публикации в Instagram и получите награду"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label>Награда (короны) *</Label>
          <Input
            type="number"
            placeholder="50"
            value={reward}
            onChange={e => setReward(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Тип *</Label>
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
        {error && <p className="text-error-500">{error}</p>}
        <div className="flex gap-3">
          <Button size="sm" type="submit" disabled={loading}>
            {loading ? "Создание..." : "Создать"}
          </Button>
          <Button size="sm" variant="outline" type="button" onClick={() => router.back()}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  )
}

