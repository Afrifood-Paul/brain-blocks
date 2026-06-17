
import boardludo from '@/pages/boardludo/boardludo'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/boardludo')({
  component: boardludo,
})

