import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import CharacterSelect from './pages/CharacterSelect';
import Category from './pages/Category';
import Game from './pages/Game';
import Celebration from './pages/Celebration';
import Badges from './pages/Badges';
import Shop from './pages/Shop';
import Parent from './pages/Parent';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/character-select" element={<CharacterSelect />} />
      <Route path="/category/:id" element={<Category />} />
      <Route path="/game/:categoryId/:levelId" element={<Game />} />
      <Route path="/celebration/:categoryId/:levelId" element={<Celebration />} />
      <Route path="/badges" element={<Badges />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/parent" element={<Parent />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
