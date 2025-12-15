"use client"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import DnDFile from "@/components/upload/DnDFile"
import { apiGet, apiPost, apiUpload } from "@/lib/api"

type Series = {
  id: string
  _id?: string
  title: string
  coverUrl?: string
}

type ProgressItem = { audio: string; subtitle: string }
type ProgressData = { uploaded: ProgressItem[]; remaining: ProgressItem[]; isComplete: boolean }
type UploadResponse = {
  success: boolean
  message: string
  seriesId: string
  episodeNumber: number
  uploaded: ProgressItem
  nextStep?: { message: string; audio: string; subtitle: string }
}

const ORDER: ProgressItem[] = [
  { audio: "russian", subtitle: "none" },
  { audio: "russian", subtitle: "russian" },
  { audio: "russian", subtitle: "english" },
  { audio: "russian", subtitle: "portuguese" },
  { audio: "russian", subtitle: "hindi" },
  { audio: "russian", subtitle: "turkish" },
  { audio: "english", subtitle: "none" },
  { audio: "english", subtitle: "english" },
  { audio: "english", subtitle: "russian" },
  { audio: "english", subtitle: "portuguese" },
  { audio: "english", subtitle: "hindi" },
  { audio: "english", subtitle: "turkish" }
]

const label = (p: ProgressItem) => {
  const a = p.audio === "russian" ? "Русская" : "Английская"
  const s =
    p.subtitle === "none"
      ? "без субтитров"
      : p.subtitle === "russian"
      ? "русские субтитры"
      : p.subtitle === "english"
      ? "английские субтитры"
      : p.subtitle === "portuguese"
      ? "португальские субтитры"
      : p.subtitle === "hindi"
      ? "субтитры хинди"
      : "турецкие субтитры"
  return `${a} озвучка • ${s}`
}

export default function EpisodesManagerPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEpisode, setNewEpisode] = useState<number | "">("")
  const [episodeNumber, setEpisodeNumber] = useState<number | "">("")
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [working, setWorking] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [serverNext, setServerNext] = useState<{ message: string; audio: string; subtitle: string } | null>(null)

  const id = params.id

  const nextRequired = useMemo(() => {
    if (!progress || progress.isComplete) return null
    if (progress.remaining?.length) return progress.remaining[0]
    for (const p of ORDER) {
      const done = progress.uploaded?.some(u => u.audio === p.audio && u.subtitle === p.subtitle)
      if (!done) return p
    }
    return null
  }, [progress])

  const loadSeries = async () => {
    setError(null)
    setLoading(true)
    try {
      const s = await apiGet<Series>(`/admin/series/${id}`)
      setSeries(s)
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить")
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async (ep: number) => {
    setMsg(null)
    try {
      const data = await apiGet<ProgressData>(`/admin/series/${id}/episodes/${ep}/progress`)
      setProgress(data)
    } catch (e: any) {
      if (e?.status === 404) {
        setProgress(null)
        setMsg("Серия не найдена")
      } else {
        setProgress(null)
        setMsg(e?.message || "Ошибка загрузки прогресса")
      }
    }
  }

  useEffect(() => {
    if (id) loadSeries()
  }, [id])

  const onCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEpisode) return
    setWorking(true)
    try {
      await apiPost(`/admin/series/${id}/episodes`, { episodeNumber: Number(newEpisode) })
      setEpisodeNumber(Number(newEpisode))
      await loadProgress(Number(newEpisode))
      setNewEpisode("")
    } catch (e: any) {
      const message =
        e?.message ||
        (e?.status === 409 ? "Серия с таким номером уже существует" : e?.status === 500 ? "Внутренняя ошибка сервера" : "Не удалось создать серию")
      setMsg(message)
    } finally {
      setWorking(false)
    }
  }

  const onSelectEpisode = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!episodeNumber) return
    await loadProgress(Number(episodeNumber))
  }

  const onDropVideo = async (file: File) => {
    if (!episodeNumber || !nextRequired) return
    if (file.size > 500 * 1024 * 1024) {
      setMsg("Файл слишком большой, максимум 500MB")
      return
    }
    setWorking(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append("episodeNumber", String(episodeNumber))
      fd.append("audioLanguage", nextRequired.audio)
      fd.append("subtitleLanguage", nextRequired.subtitle)
      fd.append("video", file)
      const res = await apiUpload<UploadResponse>(`/admin/series/${id}/episodes/upload`, fd)
      setMsg(res?.message || "Загружено")
      setServerNext(res.nextStep || null)
      if (progress) {
        const key = (p: ProgressItem) => `${p.audio}|${p.subtitle}`
        const existing = new Set(progress.uploaded.map(key))
        if (!existing.has(key(res.uploaded))) {
          const uploaded = [...progress.uploaded, res.uploaded]
          const remaining = ORDER.filter(p => !uploaded.some(u => u.audio === p.audio && u.subtitle === p.subtitle))
          const isComplete = remaining.length === 0 || !res.nextStep
          setProgress({ uploaded, remaining, isComplete })
        } else {
          setProgress({
            uploaded: progress.uploaded,
            remaining: ORDER.filter(p => !progress.uploaded.some(u => u.audio === p.audio && u.subtitle === p.subtitle)),
            isComplete: ORDER.every(p => progress.uploaded.some(u => u.audio === p.audio && u.subtitle === p.subtitle)) && !res.nextStep
          })
        }
      } else {
        await loadProgress(Number(episodeNumber))
      }
      setResetKey(k => k + 1)
    } catch (e: any) {
      setMsg(e.message || "Ошибка загрузки")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-8">
      {loading ? (
        <p>Загрузка...</p>
      ) : error ? (
        <p className="text-error-500">{error}</p>
      ) : series ? (
        <>
          <div className="flex items-start gap-6">
            {series.coverUrl && <img src={series.coverUrl} alt={series.title} className="w-40 h-28 object-cover rounded" />}
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">{series.title}</h2>
              <div className="flex gap-2 pt-2">
                <Link href={`/series/${series.id || series._id}`}>
                  <Button size="sm" variant="outline">К сериалу</Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <h3 className="mb-4 text-lg font-semibold">Создать новую серию</h3>
              <form onSubmit={onCreateEpisode} className="space-y-4">
                <div>
                  <Label>Номер серии</Label>
                  <Input type="number" placeholder="1" onChange={e => setNewEpisode(Number(e.target.value))} />
                </div>
                <Button size="sm" disabled={working}>{working ? "Сохранение..." : "Создать серию"}</Button>
              </form>
              {msg && <p className="mt-2 text-sm text-error-500">{msg}</p>}
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <h3 className="mb-4 text-lg font-semibold">Выбрать серию для загрузки</h3>
              <form onSubmit={onSelectEpisode} className="flex items-end gap-4">
                <div className="w-40">
                  <Label>Номер серии</Label>
                  <Input type="number" placeholder="1" onChange={e => setEpisodeNumber(Number(e.target.value))} />
                </div>
                <Button size="sm">Открыть</Button>
              </form>
              {msg && <p className="mt-2 text-sm text-error-500">{msg}</p>}
            </div>
          </div>

          {episodeNumber && (
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Загрузка серии {episodeNumber}</h3>
                {progress && (
                  <div className="text-sm text-gray-500">
                    {progress.isComplete ? "Серия завершена" : `Загружено ${progress.uploaded.length} из 12`}
                  </div>
                )}
              </div>
              {progress && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Шаги</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                      {ORDER.map((p, idx) => {
                        const done = progress.uploaded.some(u => u.audio === p.audio && u.subtitle === p.subtitle)
                        const isNext = nextRequired && nextRequired.audio === p.audio && nextRequired.subtitle === p.subtitle
                        return (
                          <li key={idx} className={`${
                            done ? "text-green-600" : isNext ? "text-brand-600" : "text-gray-700 dark:text-white"
                          }`}>
                            {label(p)}
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Загрузить видео</h4>
                    {progress.isComplete ? (
                      <p className="text-sm text-green-600">Все комбинации загружены</p>
                    ) : (
                      <>
                        <div className="mb-3 text-sm">
                          Следующая комбинация: <span className="font-medium">{nextRequired ? label(nextRequired) : "-"}</span>
                        </div>
                        {serverNext && (
                          <div className="mb-3 text-sm text-gray-600 dark:text-white/80">
                            Подсказка: {serverNext.message}
                          </div>
                        )}
                        <DnDFile
                          onFile={onDropVideo}
                          accept={{ "video/*": [] }}
                          maxSizeBytes={500 * 1024 * 1024}
                          disabled={working}
                          title="Перетащите видео сюда"
                          description="Или нажмите, чтобы выбрать файл .mp4, .mov и др."
                          browseLabel="Загрузить видео"
                          resetKey={resetKey}
                        />
                        {msg && <p className="mt-3 text-sm">{msg}</p>}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}


