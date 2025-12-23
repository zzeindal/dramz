"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import { apiGet, apiPut } from "@/lib/api"

type FAQ = {
  _id: string
  id?: string
  question: string
  answer: string
  order?: number
  isVisible?: boolean
}

export default function EditFAQPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const [faq, setFaq] = useState<FAQ | null>(null)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [order, setOrder] = useState<number | "">("")
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await apiGet<FAQ>(`/admin/faq/${id}`)
      setFaq(data)
      setQuestion(data.question)
      setAnswer(data.answer)
      setOrder(data.order ?? "")
      setIsVisible(data.isVisible ?? true)
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
      const body: any = {}
      if (question.trim()) body.question = question
      if (answer.trim()) body.answer = answer
      if (order !== "" && !Number.isNaN(Number(order))) {
        body.order = Number(order)
      }
      body.isVisible = isVisible
      await apiPut(`/admin/faq/${id}`, body)
      router.push("/faq")
    } catch (e: any) {
      setError(e.message || "Ошибка обновления")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Загрузка...</p>
  }

  if (error && !faq) {
    return <p className="text-error-500">{error}</p>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">Редактировать FAQ</h2>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <Label>Вопрос</Label>
          <Input
            placeholder="Как купить сериал?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
        </div>
        <div>
          <Label>Ответ</Label>
          <textarea
            className="w-full px-4 py-3 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D0920] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Для покупки сериала необходимо иметь достаточное количество корон на балансе..."
            rows={6}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
          />
        </div>
        <div>
          <Label>Порядок отображения</Label>
          <Input
            type="number"
            placeholder="1"
            value={order}
            onChange={e => setOrder(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isVisible"
            checked={isVisible}
            onChange={e => setIsVisible(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <Label htmlFor="isVisible" className="mb-0">Видимый</Label>
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

