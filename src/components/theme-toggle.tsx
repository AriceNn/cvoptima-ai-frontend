// src/components/theme-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes" // Tema durumunu yöneten hook

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme() // Temayı değiştirecek fonksiyon

  return (
    <DropdownMenu>
      {/* Tetikleyici Buton (asChild ile) */}
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {/* Mevcut temaya göre ikon değişir (CSS ile) */}
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Temayı değiştir</span>
        </Button>
      </DropdownMenuTrigger>
      {/* Açılır Menü İçeriği */}
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Açık
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Koyu
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          Sistem
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}