import { Navigate, useParams } from 'react-router-dom';
import { getCategoryById } from '@/data/categories';
import { SKILL_FOR_LEVEL } from '@/data/topics';

// Categories are no longer a screen — topics are. This keeps every old
// /category/:id link working: a bookmark, a back-stack entry, or the
// home-screen shortcut of a PWA installed before the redesign. Without it those
// would land on the catch-all and silently bounce to Home.
export default function CategoryRedirect() {
  const { id } = useParams<{ id: string }>();
  const category = getCategoryById(id ?? '');
  const firstLevel = category?.levels[0];
  const skillId = firstLevel ? SKILL_FOR_LEVEL.get(firstLevel.id) : undefined;

  return <Navigate to={skillId ? `/topic/${skillId}` : '/'} replace />;
}
