import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Hue",
  description: "A minimal color-based chat application",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' style='stop-color:%23ff6b6b;stop-opacity:1' /><stop offset='25%25' style='stop-color:%234ecdc4;stop-opacity:1' /><stop offset='50%25' style='stop-color:%2345b7d1;stop-opacity:1' /><stop offset='75%25' style='stop-color:%23f9ca24;stop-opacity:1' /><stop offset='100%25' style='stop-color:%23f0932b;stop-opacity:1' /></linearGradient></defs><circle cx='50' cy='50' r='45' fill='url(%23grad)' stroke='%23ffffff' strokeWidth='3'/><circle cx='50' cy='50' r='25' fill='%23ffffff' opacity='0.9'/></svg>",
        type: "image/svg+xml",
      },
    ],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
