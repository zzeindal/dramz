"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDropzone } from "react-dropzone"

type DnDFileProps = {
  onFile: (file: File) => void
  accept?: Record<string, string[]>
  maxSizeBytes?: number
  disabled?: boolean
  title?: string
  description?: string
  browseLabel?: string
  className?: string
  showPreview?: boolean
  value?: File | null
  resetKey?: number | string
}

export default function DnDFile({
  onFile,
  accept,
  maxSizeBytes,
  disabled,
  title = "Перетащите файл сюда",
  description = "Или нажмите, чтобы выбрать файл",
  browseLabel = "Выбрать файл",
  className,
  showPreview = true,
  value,
  resetKey
}: DnDFileProps) {
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fileToUse = value ?? localFile

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const f = acceptedFiles?.[0]
      if (!f) return
      if (maxSizeBytes && f.size > maxSizeBytes) return
      setLocalFile(f)
      const url = URL.createObjectURL(f)
      setPreviewUrl(url)
      onFile(f)
    },
    [onFile, maxSizeBytes]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    accept,
    disabled
  })

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value)
      setPreviewUrl(url)
    } else if (value === null) {
      setPreviewUrl(null)
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if (resetKey !== undefined) {
      setLocalFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const isImage = useMemo(() => {
    const type = fileToUse?.type || ""
    return type.startsWith("image/")
  }, [fileToUse])

  const isVideo = useMemo(() => {
    const type = fileToUse?.type || ""
    return type.startsWith("video/")
  }, [fileToUse])

  const fileLabel = useMemo(() => {
    if (!fileToUse) return ""
    const mb = fileToUse.size / (1024 * 1024)
    const sizeText = mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.ceil(fileToUse.size / 1024)} KB`
    return `${fileToUse.name} • ${sizeText}`
  }, [fileToUse])

  return (
    <>
      <div
        {...getRootProps()}
        className={`transition border border-dashed rounded-xl cursor-pointer p-7 lg:p-10 ${
          isDragActive ? "border-brand-500 bg-gray-100 dark:bg-[#0D0920]" : "border-gray-300 bg-gray-50 dark:border-gray-800 dark:bg-[#0D0920]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className || ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className="mb-[22px] flex justify-center">
            <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-[#0D0920] dark:text-white">
              <svg className="fill-current" width="29" height="28" viewBox="0 0 29 28" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                />
              </svg>
            </div>
          </div>
          <h4 className="mb-2 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
            {isDragReject ? "Неверный тип файла" : isDragActive ? "Отпустите файл" : title}
          </h4>
          <span className="mb-2 text-sm text-gray-500 dark:text-white/70">{description}</span>
          <span className="font-medium underline text-theme-sm text-brand-500">{browseLabel}</span>
        </div>
      </div>
      {showPreview && fileToUse && (
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-700 dark:text-white/80">{fileLabel}</div>
          {isImage && previewUrl && (
            <img src={previewUrl} alt="preview" className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-800 object-contain" />
          )}
          {isVideo && previewUrl && (
            <video
              src={previewUrl}
              controls
              muted
              preload="metadata"
              className="w-full max-w-xl rounded-lg border border-gray-200 dark:border-gray-800"
            />
          )}
        </div>
      )}
    </>
  )
}


