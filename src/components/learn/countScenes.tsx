import { Scene } from '@/data/learn';

// Pictures for counting, pairs, groups, tens and ones, number bonds and coins.
// Each is drawn from the few numbers in its Scene, so a lesson stays data.

type Of<K extends Scene['kind']> = Extract<Scene, { kind: K }>;

// Placeholders until each picture is drawn: the numbers, so nothing is blank.
const Placeholder = ({ text }: { text: string }) => (
  <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 28, color: '#3A4652', textAlign: 'center' }}>{text}</div>
);

export function ObjectsScene({ n, emoji }: Of<'objects'>) {
  return <Placeholder text={emoji.repeat(n)} />;
}

export function PairsScene({ n, emoji = '🔵' }: Of<'pairs'>) {
  return <Placeholder text={emoji.repeat(n)} />;
}

export function GroupsScene({ groups, size, emoji }: Of<'groups'>) {
  return <Placeholder text={Array.from({ length: groups }, () => emoji.repeat(size)).join('  ')} />;
}

export function TensOnesScene({ numbers }: Of<'tensOnes'>) {
  return <Placeholder text={numbers.join('  ')} />;
}

export function BondScene({ whole, parts }: Of<'bond'>) {
  const show = (n: number | null) => (n === null ? '?' : String(n));
  return <Placeholder text={`${show(whole)} = ${show(parts[0])} + ${show(parts[1])}`} />;
}

export function CoinsScene({ coins }: Of<'coins'>) {
  return <Placeholder text={coins.map((c) => `${c}¢`).join(' ')} />;
}
