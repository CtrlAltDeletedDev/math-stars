import { Navigate, Route, Routes } from 'react-router-dom';
// Bundled, not fetched: the app has to work offline from the home screen, and
// a font CDN is a request to a third party every time she opens it.
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/atkinson-hyperlegible/latin-400.css';
import '@fontsource/atkinson-hyperlegible/latin-700.css';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useLearner } from './store';
import Home from './screens/Home';
import Walk from './screens/Walk';
import GrownUps from './screens/GrownUps';
import More from './screens/More';
import Start from './screens/Start';
import Lesson from './screens/Lesson';
import Gallery from '@/learn/models/gallery';

// The new Math Stars: five screens.
//
//   /next             her path and one Go button
//   /next/walk        ten plain sums on a number pad, then the end of the walk
//   /next/grown-ups   the grown-ups screen, behind a PIN
//   /next/more        the door to clocks, money, shapes and stories
//   /next/start       first run: pick a friend
//
// Everything reads one learner (core/learner.ts) through the store; nothing
// here keeps its own copy of her progress.

export default function NextApp() {
  const learner = useLearner();
  const needsStart = !learner.profile.characterId;
  return (
    <ErrorBoundary>
      <Routes>
        <Route index element={needsStart ? <Navigate to="start" replace /> : <Home />} />
        <Route path="walk" element={needsStart ? <Navigate to="../start" replace /> : <Walk />} />
        <Route path="grown-ups" element={<GrownUps />} />
        <Route path="more" element={<More />} />
        <Route path="start" element={<Start />} />
        <Route path="lesson/:lessonId" element={needsStart ? <Navigate to="../start" replace /> : <Lesson />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="*" element={<Navigate to="/next" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
