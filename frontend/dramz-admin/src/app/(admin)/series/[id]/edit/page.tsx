"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiGet, apiUpload } from "@/lib/api"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Button from "@/components/ui/button/Button"
import DnDFile from "@/components/upload/DnDFile"

type Series = {
  id: string
  _id?: string
  title: string
  description: string
  price: number
  isVisible?: boolean
  coverUrl?: string
}

export default function EditSeriesPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<Series | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<number | "">("")
  const [isVisible, setIsVisible] = useState<boolean | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const id = params.id

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Series>(`/admin/series/${id}`)
        setItem(data)
        setTitle(data.title)
        setDescription(data.description)
        setPrice(data.price)
        setIsVisible(data.isVisible ?? null)
      } catch (e: any) {
        setError(e.message || "Не удалось загрузить")
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      if (title) fd.append("title", title)
      if (description) fd.append("description", description)
      if (price !== "" && !Number.isNaN(price)) fd.append("price", String(price))
      if (typeof isVisible === "boolean") fd.append("isVisible", JSON.stringify(isVisible))
      if (cover) fd.append("cover", cover)
      await apiUpload(`/admin/series/${id}`, fd, 'PUT')
      router.replace(`/series/${id}`)
    } catch (e: any) {
      setError(e.message || "Не удалось сохранить")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Загрузка...</p>
  if (error) return <p className="text-error-500">{error}</p>
  if (!item) return null

  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold">Редактировать сериал</h2>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <Label>Название</Label>
          <Input defaultValue={item.title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Описание</Label>
          <input
            defaultValue={item.description}
            onChange={e => setDescription(e.target.value)}
            className="h-28 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-[#0D0920] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-[#0D0920] dark:text-white/90 dark:focus:border-brand-800"
          />
        </div>
        <div>
          <Label>Цена</Label>
          <Input type="number" defaultValue={item.price} onChange={e => setPrice(Number(e.target.value))} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={!!isVisible} onChange={e => setIsVisible(e.target.checked)} />
          <span>Видим в мини-приложении</span>
        </div>
        <div>
          <Label>Новая обложка</Label>
          <DnDFile
            onFile={file => setCover(file)}
            accept={{ "image/*": [] }}
            maxSizeBytes={5 * 1024 * 1024}
            title="Перетащите новую обложку сюда"
            description="PNG, JPG, WebP до 5MB"
            browseLabel="Загрузить изображение"
          />
        </div>
        {error && <p className="text-error-500">{error}</p>}
        <Button size="sm">{saving ? "Сохранение..." : "Сохранить"}</Button>
      </form>
    </div>
  )
}


