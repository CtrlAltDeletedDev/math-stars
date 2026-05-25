import { Question } from '@/types';

export const NUMBER_BONDS_5: Question[] = [
  { id: 'nb5-2+x', type: 'number_bond', prompt: '2 + ? = 5', promptEmoji: '🖐️', correctAnswer: '3', choices: ['3', '2', '4', '1'], difficulty: 1 },
  { id: 'nb5-3+x', type: 'number_bond', prompt: '3 + ? = 5', promptEmoji: '🖐️', correctAnswer: '2', choices: ['2', '3', '1', '4'], difficulty: 1 },
  { id: 'nb5-4+x', type: 'number_bond', prompt: '4 + ? = 5', promptEmoji: '🖐️', correctAnswer: '1', choices: ['1', '2', '0', '3'], difficulty: 1 },
  { id: 'nb5-1+x', type: 'number_bond', prompt: '1 + ? = 5', promptEmoji: '🖐️', correctAnswer: '4', choices: ['4', '3', '5', '2'], difficulty: 1 },
  { id: 'nb5-0+x', type: 'number_bond', prompt: '0 + ? = 5', promptEmoji: '🖐️', correctAnswer: '5', choices: ['5', '4', '6', '3'], difficulty: 1 },
  { id: 'nb5-x+2', type: 'number_bond', prompt: '? + 2 = 5', promptEmoji: '🖐️', correctAnswer: '3', choices: ['3', '2', '4', '1'], difficulty: 1 },
  { id: 'nb5-x+3', type: 'number_bond', prompt: '? + 3 = 5', promptEmoji: '🖐️', correctAnswer: '2', choices: ['2', '3', '1', '4'], difficulty: 1 },
  { id: 'nb5-x+1', type: 'number_bond', prompt: '? + 1 = 5', promptEmoji: '🖐️', correctAnswer: '4', choices: ['4', '3', '5', '2'], difficulty: 1 },
  { id: 'nb5-x+4', type: 'number_bond', prompt: '? + 4 = 5', promptEmoji: '🖐️', correctAnswer: '1', choices: ['1', '2', '0', '3'], difficulty: 1 },
  { id: 'nb5-x+5', type: 'number_bond', prompt: '? + 5 = 5', promptEmoji: '🖐️', correctAnswer: '0', choices: ['0', '1', '2', '3'], difficulty: 2 },
  { id: 'nb5-birds', type: 'number_bond', prompt: '5 birds: 2 fly away. How many stay?', promptEmoji: '🐦', correctAnswer: '3', choices: ['3', '2', '4', '1'], difficulty: 1 },
  { id: 'nb5-fingers', type: 'number_bond', prompt: '5 fingers: 3 are up. How many are down?', promptEmoji: '✋', correctAnswer: '2', choices: ['2', '3', '1', '4'], difficulty: 1 },
  { id: 'nb5-cookies', type: 'number_bond', prompt: '5 cookies: you eat 4. How many left?', promptEmoji: '🍪', correctAnswer: '1', choices: ['1', '2', '0', '3'], difficulty: 1 },
  { id: 'nb5-stars', type: 'number_bond', prompt: '5 stars: 1 is yellow. How many are not?', promptEmoji: '⭐', correctAnswer: '4', choices: ['4', '3', '5', '2'], difficulty: 1 },
];

export const NUMBER_BONDS_10: Question[] = [
  { id: 'nb10-1+x', type: 'number_bond', prompt: '1 + ? = 10', promptEmoji: '🔟', correctAnswer: '9', choices: ['9', '8', '7', '11'], difficulty: 1 },
  { id: 'nb10-2+x', type: 'number_bond', prompt: '2 + ? = 10', promptEmoji: '🔟', correctAnswer: '8', choices: ['8', '9', '7', '12'], difficulty: 1 },
  { id: 'nb10-3+x', type: 'number_bond', prompt: '3 + ? = 10', promptEmoji: '🔟', correctAnswer: '7', choices: ['7', '8', '6', '13'], difficulty: 1 },
  { id: 'nb10-4+x', type: 'number_bond', prompt: '4 + ? = 10', promptEmoji: '🔟', correctAnswer: '6', choices: ['6', '7', '5', '14'], difficulty: 1 },
  { id: 'nb10-5+x', type: 'number_bond', prompt: '5 + ? = 10', promptEmoji: '🔟', correctAnswer: '5', choices: ['5', '6', '4', '15'], difficulty: 1 },
  { id: 'nb10-6+x', type: 'number_bond', prompt: '6 + ? = 10', promptEmoji: '🔟', correctAnswer: '4', choices: ['4', '5', '3', '16'], difficulty: 1 },
  { id: 'nb10-7+x', type: 'number_bond', prompt: '7 + ? = 10', promptEmoji: '🔟', correctAnswer: '3', choices: ['3', '4', '2', '17'], difficulty: 1 },
  { id: 'nb10-8+x', type: 'number_bond', prompt: '8 + ? = 10', promptEmoji: '🔟', correctAnswer: '2', choices: ['2', '3', '1', '18'], difficulty: 1 },
  { id: 'nb10-9+x', type: 'number_bond', prompt: '9 + ? = 10', promptEmoji: '🔟', correctAnswer: '1', choices: ['1', '2', '0', '19'], difficulty: 1 },
  { id: 'nb10-10+x', type: 'number_bond', prompt: '10 + ? = 10', promptEmoji: '🔟', correctAnswer: '0', choices: ['0', '1', '2', '10'], difficulty: 2 },
  { id: 'nb10-x+3', type: 'number_bond', prompt: '? + 3 = 10', promptEmoji: '🔟', correctAnswer: '7', choices: ['7', '8', '6', '13'], difficulty: 1 },
  { id: 'nb10-x+6', type: 'number_bond', prompt: '? + 6 = 10', promptEmoji: '🔟', correctAnswer: '4', choices: ['4', '5', '3', '16'], difficulty: 1 },
  { id: 'nb10-x+8', type: 'number_bond', prompt: '? + 8 = 10', promptEmoji: '🔟', correctAnswer: '2', choices: ['2', '3', '1', '18'], difficulty: 1 },
  { id: 'nb10-x+9', type: 'number_bond', prompt: '? + 9 = 10', promptEmoji: '🔟', correctAnswer: '1', choices: ['1', '2', '0', '19'], difficulty: 1 },
  { id: 'nb10-x+5', type: 'number_bond', prompt: '? + 5 = 10', promptEmoji: '🔟', correctAnswer: '5', choices: ['5', '6', '4', '15'], difficulty: 1 },
  { id: 'nb10-apples', type: 'number_bond', prompt: '10 apples: 4 are red. How many are green?', promptEmoji: '🍎', correctAnswer: '6', choices: ['6', '5', '7', '4'], difficulty: 1 },
  { id: 'nb10-stickers', type: 'number_bond', prompt: 'You need 10 stickers. You have 7. How many more?', promptEmoji: '⭐', correctAnswer: '3', choices: ['3', '4', '2', '7'], difficulty: 1 },
  { id: 'nb10-fingers', type: 'number_bond', prompt: '10 fingers total. 6 are up. How many are down?', promptEmoji: '🙌', correctAnswer: '4', choices: ['4', '5', '3', '6'], difficulty: 1 },
];

export const NUMBER_BONDS_20: Question[] = [
  { id: 'nb20-10+x', type: 'number_bond', prompt: '10 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '10', choices: ['10', '11', '9', '12'], difficulty: 2 },
  { id: 'nb20-12+x', type: 'number_bond', prompt: '12 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '8', choices: ['8', '9', '7', '12'], difficulty: 2 },
  { id: 'nb20-15+x', type: 'number_bond', prompt: '15 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '5', choices: ['5', '6', '4', '15'], difficulty: 2 },
  { id: 'nb20-18+x', type: 'number_bond', prompt: '18 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '2', choices: ['2', '3', '1', '18'], difficulty: 2 },
  { id: 'nb20-14+x', type: 'number_bond', prompt: '14 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '6', choices: ['6', '7', '5', '14'], difficulty: 2 },
  { id: 'nb20-11+x', type: 'number_bond', prompt: '11 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '9', choices: ['9', '10', '8', '11'], difficulty: 2 },
  { id: 'nb20-16+x', type: 'number_bond', prompt: '16 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '4', choices: ['4', '5', '3', '16'], difficulty: 2 },
  { id: 'nb20-13+x', type: 'number_bond', prompt: '13 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '7', choices: ['7', '8', '6', '13'], difficulty: 2 },
  { id: 'nb20-17+x', type: 'number_bond', prompt: '17 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '3', choices: ['3', '4', '2', '17'], difficulty: 2 },
  { id: 'nb20-19+x', type: 'number_bond', prompt: '19 + ? = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '1', choices: ['1', '2', '0', '19'], difficulty: 2 },
  { id: 'nb20-x+10', type: 'number_bond', prompt: '? + 10 = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '10', choices: ['10', '11', '9', '12'], difficulty: 2 },
  { id: 'nb20-x+14', type: 'number_bond', prompt: '? + 14 = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '6', choices: ['6', '7', '5', '14'], difficulty: 2 },
  { id: 'nb20-x+15', type: 'number_bond', prompt: '? + 15 = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '5', choices: ['5', '6', '4', '15'], difficulty: 2 },
  { id: 'nb20-x+12', type: 'number_bond', prompt: '? + 12 = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '8', choices: ['8', '9', '7', '12'], difficulty: 2 },
  { id: 'nb20-x+8', type: 'number_bond', prompt: '? + 8 = 20', promptEmoji: '2️⃣0️⃣', correctAnswer: '12', choices: ['12', '11', '13', '8'], difficulty: 3 },
];

export const ALL_NUMBER_BONDS_QUESTIONS = [...NUMBER_BONDS_5, ...NUMBER_BONDS_10, ...NUMBER_BONDS_20];
