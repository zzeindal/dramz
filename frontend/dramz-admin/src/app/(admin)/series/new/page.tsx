"use client"
import { useState } from "react"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Button from "@/components/ui/button/Button"
import { apiUpload } from "@/lib/api"
import { useRouter } from "next/navigation"
import { compressImage } from "@/lib/image"
import DnDFile from "@/components/upload/DnDFile"

export default function NewSeriesPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<number | "">("")
  const [cover, setCover] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title || !description || !price || !cover) {
      setError("Заполните все поля")
      return
    }
    setLoading(true)
    try {
      let fileToSend = cover
      if (cover.size > 1024 * 1024) {
        fileToSend = await compressImage(cover, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 })
      }
      if (fileToSend.size > 5 * 1024 * 1024) {
        setError("Изображение слишком большое, максимум 5MB")
        setLoading(false)
        return
      }
      const fd = new FormData()
      fd.append("title", title)
      fd.append("description", description)
      fd.append("price", String(price))
      fd.append("cover", fileToSend)
      await apiUpload("/admin/series", fd)
      router.replace("/series")
    } catch (e: any) {
      setError(e.message || "Ошибка создания")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold">Создать сериал</h2>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <Label>Название</Label>
          <Input placeholder="Название" onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Описание</Label>
          <input
            onChange={e => setDescription(e.target.value)}
            placeholder="Описание"
            className="h-28 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-[#0D0920] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-[#0D0920] dark:text-white/90 dark:focus:border-brand-800"
          />
        </div>
        <div>
          <Label>Цена</Label>
          <Input type="number" placeholder="0" onChange={e => setPrice(Number(e.target.value))} />
        </div>
        <div>
          <Label>Обложка</Label>
          <DnDFile
            onFile={file => setCover(file)}
            accept={{ "image/*": [] }}
            maxSizeBytes={5 * 1024 * 1024}
            title="Перетащите обложку сюда"
            description="PNG, JPG, WebP до 5MB"
            browseLabel="Загрузить изображение"
          />
        </div>
        {error && <p className="text-error-500">{error}</p>}
        <Button size="sm">{loading ? "Сохранение..." : "Создать"}</Button>
      </form>
    </div>
  )
}


