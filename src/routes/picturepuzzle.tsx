import PicturePuzzle from '@/pages/picturepuzzle/PicturePuzzle'
import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/router/guards'
import { ProtectedRoute } from '@/router/ProtectedRoute'

export const Route = createFileRoute('/picturepuzzle')({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <PicturePuzzle />
    </ProtectedRoute>
  ),
})
