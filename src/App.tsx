import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import CharacterSelect from './pages/CharacterSelect';
import Category from './pages/Category';
import Game from './pages/Game';
import Celebration from './pages/Celebration';
import Badges from './pages/Badges';
import Shop from './pages/Shop';
import Parent from './pages/Parent';
import Stickers from './pages/Stickers';
import Story from './pages/Story';
import Flashcard from './pages/Flashcard';
import Worksheet from './pages/Worksheet';
import DailyGame from './pages/DailyGame';
import MasterGame from './pages/MasterGame';
import Lesson from './pages/Lesson';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/character-select" element={<CharacterSelect />} />
      <Route path="/category/:id" element={<Category />} />
      <Route path="/game/daily/challenge" element={<DailyGame />} />
      <Route path="/game/master/:categoryId" element={<MasterGame />} />
      <Route path="/game/:categoryId/:levelId" element={<Game />} />
      <Route path="/celebration/:categoryId/:levelId" element={<Celebration />} />
      <Route path="/lesson/:categoryId/:levelId" element={<Lesson />} />
      <Route path="/badges" element={<Badges />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/parent" element={<Parent />} />
      <Route path="/stickers" element={<Stickers />} />
      <Route path="/story/:categoryId" element={<Story />} />
      <Route path="/flashcard/:categoryId/:levelId" element={<Flashcard />} />
      <Route path="/worksheet" element={<Worksheet />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
