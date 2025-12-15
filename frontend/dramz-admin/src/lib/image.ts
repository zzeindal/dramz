export const compressImage = (file: File, opts?: { maxWidth?: number; maxHeight?: number; quality?: number }): Promise<File> => {
  const maxWidth = opts?.maxWidth ?? 1280
  const maxHeight = opts?.maxHeight ?? 1280
  const quality = opts?.quality ?? 0.8
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        b => {
          URL.revokeObjectURL(url)
          if (!b) {
            reject(new Error('Failed to compress'))
            return
          }
          const ext = file.type.includes('png') ? 'image/png' : 'image/jpeg'
          const out = new File([b], file.name.replace(/\.[^.]+$/, '') + (ext === 'image/png' ? '.png' : '.jpg'), { type: ext })
          resolve(out)
        },
        file.type.includes('png') ? 'image/png' : 'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load error'))
    }
    img.src = url
  })
}


