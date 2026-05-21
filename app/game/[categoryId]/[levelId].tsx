import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { QuestionCard } from '@/components/game/QuestionCard';
import { AnswerGrid } from '@/components/game/AnswerGrid';
import { FeedbackOverlay } from '@/components/game/FeedbackOverlay';
import { StreakBar } from '@/components/game/StreakBar';
import { HintBubble } from '@/components/game/HintBubble';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useProgress } from '@/store/useProgress';
import { useGameSession } from '@/hooks/useGameSession';
import { getCategoryById, getLevelById } from '@/data/categories';
import { getCharacter } from '@/data/characters';
import { getTheme } from '@/data/shop';
import { GAME_CONFIG } from '@/constants/gameConfig';

export default function GameScreen() {
  const { categoryId, levelId } = useLocalSearchParams<{ categoryId: string; levelId: string }>();
  const router = useRouter();
  const { progress, recordLevelComplete } = useProgress();

  const category = getCategoryById(categoryId);
  const level = getLevelById(levelId);
  const character = progress.characterId ? getCharacter(progress.characterId) : null;
  const characterName = character?.name ?? 'You';
  const theme = getTheme(progress.activeTheme);

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const session = useGameSession(level!, progress.srsCards, characterName);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  useEffect(() => {
    if (session.isComplete && !feedbackVisible) {
      handleSessionComplete();
    }
  }, [session.isComplete, feedbackVisible]);

  if (!category || !level) return null;

  function handleAnswer(choice: string) {
    if (feedbackVisible || selectedChoice) return;

    const correct = session.recordAnswer(choice);
    setSelectedChoice(choice);
    setLastCorrect(correct);
    setFeedbackVisible(true);
    setShowHint(false);

    const newConsec = correct ? consecutiveCorrect + 1 : 0;
    setConsecutiveCorrect(newConsec);

    if (correct) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Show hint after wrong answer if one exists
      if (session.currentQuestion?.hint) {
        setTimeout(() => setShowHint(true), 400);
      }
    }

    feedbackTimer.current = setTimeout(() => {
      dismissFeedback();
    }, GAME_CONFIG.feedbackDurationMs);
  }

  function dismissFeedback() {
    setFeedbackVisible(false);
    setSelectedChoice(null);
    setShowHint(false);

    if (session.isComplete) {
      handleSessionComplete();
    } else {
      session.advance();
    }
  }

  function handleSessionComplete() {
    const newBadges = recordLevelComplete(
      levelId,
      session.correctCount,
      session.totalQuestions,
      session.srsUpdates,
      consecutiveCorrect,
    );

    router.replace(
      `/celebration/${categoryId}/${levelId}?correct=${session.correctCount}&total=${session.totalQuestions}&badges=${newBadges.map((b) => b.badgeId).join(',')}`,
    );
  }

  const bgColors: [string, string] = [category.bgColor, category.darkColor];

  return (
    <BackgroundGradient colors={bgColors}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.quitBtn}>
          <Text style={styles.quitText}>✕</Text>
        </Pressable>
        <ProgressBar current={session.currentIndex} total={session.totalQuestions} />
        {character && (
          <Text style={styles.characterEmoji}>{character.emoji}</Text>
        )}
      </View>

      <StreakBar streak={session.streak} />

      <View style={styles.content}>
        {session.currentQuestion && (
          <QuestionCard question={session.currentQuestion} />
        )}
        {session.currentQuestion?.hint && (
          <HintBubble hint={session.currentQuestion.hint} visible={showHint} />
        )}
      </View>

      {session.currentQuestion && (
        <View style={styles.answers}>
          <AnswerGrid
            choices={session.currentQuestion.choices}
            onSelect={handleAnswer}
            selectedChoice={selectedChoice}
            correctAnswer={session.currentQuestion.correctAnswer}
            disabled={!!selectedChoice}
          />
        </View>
      )}

      <FeedbackOverlay
        visible={feedbackVisible}
        correct={lastCorrect}
        onDismiss={dismissFeedback}
        characterEmoji={character?.emoji}
      />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  quitBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitText: { fontSize: 20, color: '#fff', fontFamily: 'Nunito-Bold' },
  characterEmoji: { fontSize: 28 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  answers: { paddingBottom: 24 },
});
