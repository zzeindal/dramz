"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiDelete, apiGet, apiPost, apiPut, apiUpload } from "@/lib/api"
import Link from "next/link"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"

type Series = {
  id: string
  _id?: string
  title: string
  description: string
  price: number
  isVisible?: boolean
  coverUrl?: string
}

type ProgressItem = { audio: string; subtitle: string }

export default function SeriesDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [newEpisode, setNewEpisode] = useState<number | "">("")
  const [uploadEpisode, setUploadEpisode] = useState<number | "">("")
  const [audio, setAudio] = useState("russian")
  const [subtitle, setSubtitle] = useState("none")
  const [video, setVideo] = useState<File | null>(null)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [progressEpisode, setProgressEpisode] = useState<number | "">("")
  const [progressData, setProgressData] = useState<{ uploaded: ProgressItem[]; remaining: ProgressItem[]; isComplete: boolean } | null>(null)
  const [working, setWorking] = useState(false)

  const id = params.id

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await apiGet<Series>(`/admin/series/${id}`)
      setItem(data)
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
  }, [id])

  const toggleVisibility = async () => {
    try {
      setMsg(null)
      await apiPut(`/admin/series/${id}/toggle-visibility`)
      load()
    } catch (e: any) {
      setMsg(e?.message || "Не удалось обновить видимость")
    }
  }

  const remove = async () => {
    if (!confirm("Удалить сериал?")) return
    try {
      setMsg(null)
      await apiDelete(`/admin/series/${id}`)
      router.replace("/series")
    } catch (e: any) {
      setMsg(e?.message || "Не удалось удалить сериал")
    }
  }

  const createEpisode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEpisode) return
    setWorking(true)
    try {
      await apiPost(`/admin/series/${id}/episodes`, { episodeNumber: Number(newEpisode) })
      setNewEpisode("")
      load()
    } catch (e: any) {
      const message =
        e?.message ||
        (e?.status === 409 ? "Серия с таким номером уже существует" : e?.status === 500 ? "Внутренняя ошибка сервера" : "Не удалось создать серию")
      setMsg(message)
    } finally {
      setWorking(false)
    }
  }

  const uploadMedia = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadMsg(null)
    if (!uploadEpisode || !video) return
    if (video.size > 500 * 1024 * 1024) {
      setUploadMsg("Файл слишком большой, максимум 500MB")
      return
    }
    setWorking(true)
    try {
      const fd = new FormData()
      fd.append("episodeNumber", String(uploadEpisode))
      fd.append("audioLanguage", audio)
      fd.append("subtitleLanguage", subtitle)
      fd.append("video", video)
      const res = await apiUpload<{ message?: string; next?: any }>(`/admin/series/${id}/episodes/upload`, fd)
      setUploadMsg(res?.message || "Загружено")
      setVideo(null)
    } catch (e: any) {
      setUploadMsg(e.message || "Ошибка загрузки")
    } finally {
      setWorking(false)
    }
  }

  const loadProgress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!progressEpisode) return
    const data = await apiGet<{ uploaded: ProgressItem[]; remaining: ProgressItem[]; isComplete: boolean }>(`/admin/series/${id}/episodes/${progressEpisode}/progress`)
    setProgressData(data)
  }

  return (
    <div className="space-y-8">
      {loading ? (
        <p>Загрузка...</p>
      ) : error ? (
        <p className="text-error-500">{error}</p>
      ) : item ? (
        <>
          <div className="flex items-start gap-6">
            {item.coverUrl && <img src={item.coverUrl} alt={item.title} className="w-40 h-28 object-cover rounded" />}
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">{item.title}</h2>
              <p className="text-gray-500 dark:text-white">{item.description}</p>
              <p>Цена: {item.price}</p>
              <p>Видимость: {item.isVisible ? "Да" : "Нет"}</p>
              <div className="flex gap-2 pt-2">
                <Link href={`/series/${id}/edit`}>
                  <Button size="sm" variant="outline">Редактировать</Button>
                </Link>
                <Button size="sm" variant="outline" onClick={toggleVisibility}>Переключить видимость</Button>
                <Button size="sm" variant="outline" onClick={remove}>Удалить</Button>
              </div>
              {msg && <p className="text-error-500 text-sm pt-1">{msg}</p>}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold">Управление сериями</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-white/80">Загружайте серии с подсказками и прогрессом по всем комбинациям озвучки и субтитров</p>
            <Link href={`/series/${id}/episodes`}>
              <Button size="sm">Открыть управление сериями</Button>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}


