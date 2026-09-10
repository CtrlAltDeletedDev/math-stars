import { useState } from 'react';
import { Topic } from '@/data/topics';
import { TopicMastery } from '@/engine/mastery';
import { rankFor } from '@/data/skills';
import MasteryRing from '@/components/ui/MasteryRing';

interface Props {
  topic: Topic;
  mastery: TopicMastery;
  onPress: () => void;
}

// One picture, one ring, one word. Nothing is ever locked, so there is no
// padlock, no "N/M levels", and no NEW! flag competing for her attention.
//
// A plain <button>: the old CategoryCard had to be a role="button" div because
// Master Mode was nested inside it, which cost keyboard support and the
// browser's own press handling. Master Mode lives on the topic screen now.

export default function TopicTile({ topic, mastery, onPress }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onPress}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      aria-label={topic.title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '16px 10px 14px',
        border: 'none',
        borderRadius: 22,
        background: `linear-gradient(160deg, ${topic.bgColor}, ${topic.darkColor})`,
        boxShadow: pressed ? '0 2px 6px rgba(0,0,0,0.2)' : '0 5px 14px rgba(0,0,0,0.22)',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        cursor: 'pointer',
        // Comfortably past the 44px minimum in both directions — she taps with
        // a whole fingertip, not a cursor.
        minHeight: 132,
        width: '100%',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <MasteryRing
        fill={mastery.fill}
        size={72}
        rank={mastery.everPlayed ? rankFor(mastery.rung) : undefined}
      >
        <span>{topic.emoji}</span>
      </MasteryRing>
      <span
        style={{
          fontFamily: 'Nunito',
          fontWeight: 800,
          fontSize: 14,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.15,
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        {topic.title}
      </span>
    </button>
  );
}
