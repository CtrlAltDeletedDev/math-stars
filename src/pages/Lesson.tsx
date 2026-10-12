import { Navigate, useParams } from 'react-router-dom';
import { LESSONS_BY_ID } from '@/data/learn';

// The old slide-lesson route. Slides now play in the narrated lesson player
// (src/pages/Learn.tsx); this keeps any saved link or bookmark working.
export default function Lesson() {
  const { categoryId = '', levelId = '' } = useParams<{ categoryId: string; levelId: string }>();
  const id = `read-${levelId}`;
  if (LESSONS_BY_ID.has(id)) return <Navigate to={`/learn/${id}`} replace />;
  return <Navigate to={`/game/${categoryId}/${levelId}`} replace />;
}
