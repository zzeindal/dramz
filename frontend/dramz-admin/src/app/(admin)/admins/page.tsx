"use client"
import { useState } from "react"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Button from "@/components/ui/button/Button"
import { apiPost } from "@/lib/api"

export default function AdminsPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    try {
      const res = await apiPost<{ success: boolean; message: string }>("/auth/admin", { username, password })
      setMsg(res.message || "Успешно")
      setUsername("")
      setPassword("")
    } catch (e: any) {
      setMsg(e.message || "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-6">Создать администратора</h2>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <Label>Логин</Label>
          <Input placeholder="admin2" onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <Label>Пароль</Label>
          <Input type="password" placeholder="password123" onChange={e => setPassword(e.target.value)} />
        </div>
        {msg && <p>{msg}</p>}
        <Button size="sm">{loading ? "Создание..." : "Создать"}</Button>
      </form>
    </div>
  )
}


