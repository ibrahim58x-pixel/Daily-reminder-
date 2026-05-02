import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReminders } from "@/context/RemindersContext";
import { useColors } from "@/hooks/useColors";
import { repeatLabel } from "@/lib/dateFormat";
import { t } from "@/lib/i18n";
import {
  computeStats,
  currentStreak,
  last7DaysActivity,
  topCompleted,
} from "@/lib/stats";

const WEB_TOP_INSET = 67;
const WEB_BOTTOM_INSET = 34;

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { reminders } = useReminders();

  const isWeb = Platform.OS === "web";
  const topPad = (isWeb ? WEB_TOP_INSET : insets.top) + 8;
  const bottomPad = (isWeb ? WEB_BOTTOM_INSET : insets.bottom) + 32;

  const buckets = useMemo(() => computeStats(reminders), [reminders]);
  const streak = useMemo(() => currentStreak(reminders), [reminders]);
  const top = useMemo(() => topCompleted(reminders, 5), [reminders]);
  const week = useMemo(() => last7DaysActivity(reminders), [reminders]);

  const maxBar = Math.max(1, ...week.map((d) => d.count));

  const cards: { label: string; value: number; icon: string }[] = [
    { label: t.statsToday, value: buckets.today, icon: "sun" },
    { label: t.statsThisWeek, value: buckets.week, icon: "calendar" },
    { label: t.statsThisMonth, value: buckets.month, icon: "grid" },
    { label: t.statsThisYear, value: buckets.year, icon: "award" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.isDark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          hitSlop={8}
        >
          <Feather name="chevron-right" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
            {t.statsEyebrow}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.statsTitle}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.streakCard,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.foreground,
            },
          ]}
        >
          <View style={styles.streakRow}>
            <View style={styles.streakIconWrap}>
              <Feather
                name="zap"
                size={22}
                color={colors.primaryForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.streakLabel,
                  { color: colors.primaryForeground },
                ]}
              >
                {t.currentStreak}
              </Text>
              <Text
                style={[
                  styles.streakValue,
                  { color: colors.primaryForeground },
                ]}
              >
                {streak === 1 ? `1 ${t.daysOne}` : t.daysMany(streak)}
              </Text>
            </View>
            <View>
              <Text
                style={[
                  styles.streakSubLabel,
                  { color: colors.primaryForeground },
                ]}
              >
                {t.allTime}
              </Text>
              <Text
                style={[
                  styles.streakSubValue,
                  { color: colors.primaryForeground },
                ]}
              >
                {buckets.allTime}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          {cards.map((c) => (
            <View
              key={c.label}
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather
                name={c.icon as keyof typeof Feather.glyphMap}
                size={16}
                color={colors.accent}
              />
              <Text
                style={[
                  styles.statValue,
                  { color: colors.foreground },
                ]}
              >
                {c.value}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                {c.label}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t.last7Days}
          </Text>
          <View style={styles.barRow}>
            {week.map((d) => {
              const heightPct = (d.count / maxBar) * 100;
              return (
                <View key={d.label} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(d.count > 0 ? 8 : 0, heightPct)}%`,
                          backgroundColor:
                            d.count > 0 ? colors.primary : colors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barCount,
                      { color: colors.foreground },
                    ]}
                  >
                    {d.count}
                  </Text>
                  <Text
                    style={[
                      styles.barLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {d.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t.mostCompleted}
          </Text>
          {top.length === 0 ? (
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              {t.statsEmpty}
            </Text>
          ) : (
            <View style={{ gap: 12 }}>
              {top.map((t, i) => (
                <View key={t.id} style={styles.topRow}>
                  <View
                    style={[
                      styles.rank,
                      {
                        backgroundColor:
                          i === 0 ? colors.primary : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        {
                          color:
                            i === 0
                              ? colors.primaryForeground
                              : colors.foreground,
                        },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.topTitle,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {t.title}
                    </Text>
                    {t.repeat !== "none" ? (
                      <Text
                        style={[
                          styles.topMeta,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {repeatLabel(t.repeat, null)}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[styles.topCount, { color: colors.accent }]}
                  >
                    ×{t.count}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 18,
    gap: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  eyebrow: {
    fontSize: 13,
    fontFamily: "Cairo_500Medium",
  },
  title: {
    fontSize: 26,
    fontFamily: "Cairo_700Bold",
    lineHeight: 32,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  streakCard: {
    borderRadius: 18,
    padding: 20,
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  streakIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  streakLabel: {
    fontSize: 13,
    fontFamily: "Cairo_500Medium",
    opacity: 0.9,
  },
  streakValue: {
    fontSize: 24,
    fontFamily: "Cairo_700Bold",
    marginTop: 2,
  },
  streakSubLabel: {
    fontSize: 11,
    fontFamily: "Cairo_500Medium",
    opacity: 0.85,
    textAlign: "right",
  },
  streakSubValue: {
    fontSize: 18,
    fontFamily: "Cairo_700Bold",
    textAlign: "right",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Cairo_700Bold",
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Cairo_500Medium",
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Cairo_600SemiBold",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    height: 130,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    borderRadius: 8,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
  },
  barCount: {
    fontSize: 12,
    fontFamily: "Cairo_600SemiBold",
  },
  barLabel: {
    fontSize: 11,
    fontFamily: "Cairo_500Medium",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 12,
    fontFamily: "Cairo_700Bold",
  },
  topTitle: {
    fontSize: 14,
    fontFamily: "Cairo_600SemiBold",
  },
  topMeta: {
    fontSize: 12,
    fontFamily: "Cairo_500Medium",
    marginTop: 2,
  },
  topCount: {
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Cairo_500Medium",
    lineHeight: 19,
  },
});
