import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { FilterChips, FilterKey } from "@/components/FilterChips";
import { ReminderItem } from "@/components/ReminderItem";
import { useReminders } from "@/context/RemindersContext";
import { useColors } from "@/hooks/useColors";
import { isOverdue, isToday, isUpcoming } from "@/lib/dateFormat";
import { getHijriDateShort } from "@/lib/hijriDate";
import { t } from "@/lib/i18n";

const WEB_TOP_INSET = 67;
const WEB_BOTTOM_INSET = 34;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { reminders, loading, toggleComplete } = useReminders();
  const [filter, setFilter] = useState<FilterKey>("today");

  const isWeb = Platform.OS === "web";
  const topPad = (isWeb ? WEB_TOP_INSET : insets.top) + 8;
  const bottomPad = (isWeb ? WEB_BOTTOM_INSET : insets.bottom) + 100;

  const counts = useMemo(() => {
    const today = reminders.filter(
      (r) => !r.completed && (isToday(r.dueAt) || isOverdue(r.dueAt)),
    ).length;
    const upcoming = reminders.filter(
      (r) => !r.completed && isUpcoming(r.dueAt),
    ).length;
    const all = reminders.filter((r) => !r.completed).length;
    const completed = reminders.filter((r) => r.completed).length;
    return { today, upcoming, all, completed };
  }, [reminders]);

  const filtered = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return aTime - bTime;
    });

    switch (filter) {
      case "today":
        return sorted.filter(
          (r) => !r.completed && (isToday(r.dueAt) || isOverdue(r.dueAt)),
        );
      case "upcoming":
        return sorted.filter((r) => !r.completed && isUpcoming(r.dueAt));
      case "all":
        return sorted.filter((r) => !r.completed);
      case "completed":
        return sorted.filter((r) => r.completed);
    }
  }, [reminders, filter]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t.greetingMorning;
    if (h < 17) return t.greetingAfternoon;
    return t.greetingEvening;
  }, []);

  const hijriDate = useMemo(() => getHijriDateShort(), []);

  const subline = useMemo(() => {
    if (counts.today === 0 && counts.all === 0) return t.slateClear;
    if (counts.today === 0) return t.nothingToday;
    if (counts.today === 1) return t.oneToday;
    return t.manyToday(counts.today);
  }, [counts]);

  const handleAdd = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/new");
  };

  const emptyCopy: Record<FilterKey, { title: string; subtitle: string }> = {
    today: {
      title: t.emptyTodayTitle,
      subtitle: t.emptyTodaySubtitle,
    },
    upcoming: {
      title: t.emptyUpcomingTitle,
      subtitle: t.emptyUpcomingSubtitle,
    },
    all: {
      title: t.emptyAllTitle,
      subtitle: t.emptyAllSubtitle,
    },
    completed: {
      title: t.emptyDoneTitle,
      subtitle: t.emptyDoneSubtitle,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.isDark ? "light" : "dark"} />
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {greeting}
          </Text>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            {subline}
          </Text>
          <Text style={[styles.hijriDate, { color: colors.accent }]}>
            {hijriDate}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/settings")}
            style={({ pressed }) => [
              styles.statsBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            hitSlop={8}
          >
            <Feather name="settings" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/stats")}
            style={({ pressed }) => [
              styles.statsBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            hitSlop={8}
          >
            <Feather name="bar-chart-2" size={20} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <View style={styles.filtersWrap}>
        <FilterChips value={filter} onChange={setFilter} counts={counts} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomPad },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <EmptyState
              title={emptyCopy[filter].title}
              subtitle={emptyCopy[filter].subtitle}
              icon={
                filter === "completed"
                  ? "check-circle"
                  : filter === "upcoming"
                    ? "calendar"
                    : "sun"
              }
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 30).duration(220)}
              layout={Layout.springify()}
            >
              <ReminderItem reminder={item} onToggle={toggleComplete} />
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View
        style={[
          styles.fabWrap,
          {
            bottom: (isWeb ? WEB_BOTTOM_INSET : insets.bottom) + 24,
          },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: colors.foreground,
            },
          ]}
        >
          <Feather name="plus" size={24} color={colors.primaryForeground} />
          <Text
            style={[styles.fabText, { color: colors.primaryForeground }]}
          >
            {t.newReminder}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 18,
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
    gap: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  statsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Cairo_500Medium",
  },
  headline: {
    fontSize: 26,
    fontFamily: "Cairo_700Bold",
    lineHeight: 32,
  },
  hijriDate: {
    fontSize: 12,
    fontFamily: "Cairo_500Medium",
    marginTop: 2,
  },
  filtersWrap: {
    paddingBottom: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexGrow: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabText: {
    fontSize: 15,
    fontFamily: "Cairo_600SemiBold",
  },
});
