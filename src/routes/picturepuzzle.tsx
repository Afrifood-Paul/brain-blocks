import PicturePuzzle from '@/pages/picturepuzzle/PicturePuzzle'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/picturepuzzle')({
  component: PicturePuzzle,
})


