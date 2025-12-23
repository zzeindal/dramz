"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import { apiPost } from "@/lib/api"

export default function CreateFAQPage() {
  const router = useRouter()
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [order, setOrder] = useState<number | "">("")
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!question.trim() || !answer.trim()) {
      setError("Вопрос и ответ обязательны")
      return
    }
    setLoading(true)
    try {
      const body: any = { question, answer, isVisible }
      if (order !== "" && !Number.isNaN(Number(order))) {
        body.order = Number(order)
      }
      await apiPost("/admin/faq", body)
      router.push("/faq")
    } catch (e: any) {
      setError(e.message || "Ошибка создания")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">Создать FAQ</h2>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <Label>Вопрос *</Label>
          <Input
            placeholder="Как купить сериал?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
        </div>
        <div>
          <Label>Ответ *</Label>
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

