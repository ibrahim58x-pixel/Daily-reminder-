import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemeKey, themes } from "@/constants/colors";
import { useReminders } from "@/context/RemindersContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  cancelReminderNotification,
  requestNotificationPermission,
  scheduleDailyReminder,
} from "@/lib/notifications";
import { t } from "@/lib/i18n";

const WEB_TOP_INSET = 67;
const WEB_BOTTOM_INSET = 34;

const THEME_OPTIONS: { key: ThemeKey; title: string; subtitle: string }[] = [
  { key: "cream", title: t.themeCream, subtitle: t.themeCreamSubtitle },
  { key: "midnight", title: t.themeMidnight, subtitle: t.themeMidnightSubtitle },
];

const PRIVACY_URL = "https://reminders.replit.app/privacy";
const SUPPORT_URL = "https://reminders.replit.app/support";
const APP_VERSION = "1.0.0";

const KEY_NOTIF_ENABLED = "reminders.settings.notifEnabled";
const KEY_DAILY_HOUR = "reminders.settings.dailyHour";
const KEY_DAILY_MINUTE = "reminders.settings.dailyMinute";
const KEY_DAILY_ID = "reminders.settings.dailyId";

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "م" : "ص";
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m} ${period}`;
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = (isWeb ? WEB_TOP_INSET : insets.top) + 16;
  const bottomPad = (isWeb ? WEB_BOTTOM_INSET : insets.bottom) + 24;

  const { theme, setTheme } = useTheme();
  const { reminders, clearCompleted, clearAll } = useReminders();

  // Notification permission state
  const [permGranted, setPermGranted] = useState(false);

  // Notification toggle & daily time
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [dailyHour, setDailyHour] = useState(9);
  const [dailyMinute, setDailyMinute] = useState(0);
  const [dailyId, setDailyId] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load stored settings
  useEffect(() => {
    if (isWeb) return;

    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermGranted(status === "granted");
    });

    (async () => {
      const [enabled, hour, minute, id] = await Promise.all([
        AsyncStorage.getItem(KEY_NOTIF_ENABLED),
        AsyncStorage.getItem(KEY_DAILY_HOUR),
        AsyncStorage.getItem(KEY_DAILY_MINUTE),
        AsyncStorage.getItem(KEY_DAILY_ID),
      ]);
      if (enabled !== null) setNotifEnabled(enabled === "true");
      if (hour !== null) setDailyHour(parseInt(hour, 10));
      if (minute !== null) setDailyMinute(parseInt(minute, 10));
      if (id) setDailyId(id);
    })();
  }, [isWeb]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermGranted(granted);
  };

  const applyDailyNotification = useCallback(
    async (enabled: boolean, hour: number, minute: number, oldId: string | null) => {
      if (oldId) await cancelReminderNotification(oldId);
      if (!enabled || !permGranted) {
        await AsyncStorage.setItem(KEY_DAILY_ID, "");
        setDailyId(null);
        return;
      }
      const newId = await scheduleDailyReminder(hour, minute);
      await AsyncStorage.setItem(KEY_DAILY_ID, newId ?? "");
      setDailyId(newId);
    },
    [permGranted],
  );

  const handleToggleNotif = async (value: boolean) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setNotifEnabled(value);
    await AsyncStorage.setItem(KEY_NOTIF_ENABLED, value ? "true" : "false");
    await applyDailyNotification(value, dailyHour, dailyMinute, dailyId);
  };

  const handleTimeChange = async (_: unknown, date?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (!date) return;
    const h = date.getHours();
    const m = date.getMinutes();
    setDailyHour(h);
    setDailyMinute(m);
    await AsyncStorage.setItem(KEY_DAILY_HOUR, h.toString());
    await AsyncStorage.setItem(KEY_DAILY_MINUTE, m.toString());
    await applyDailyNotification(notifEnabled, h, m, dailyId);
  };

  const handleTheme = async (next: ThemeKey) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    await setTheme(next);
  };

  const handleClearCompleted = useCallback(() => {
    const count = reminders.filter((r) => r.completed).length;
    if (count === 0) { Alert.alert("", t.settingsNoCompleted); return; }
    Alert.alert(t.settingsClearCompletedConfirmTitle, t.settingsClearCompletedConfirmMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.settingsConfirmDelete,
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await clearCompleted();
        },
      },
    ]);
  }, [reminders, clearCompleted]);

  const handleClearAll = useCallback(() => {
    if (reminders.length === 0) { Alert.alert("", t.settingsNoReminders); return; }
    Alert.alert(t.settingsClearAllConfirmTitle, t.settingsClearAllConfirmMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.settingsConfirmDelete,
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await clearAll();
        },
      },
    ]);
  }, [reminders, clearAll]);

  const completedCount = reminders.filter((r) => r.completed).length;

  // Build a Date object for the time picker
  const timePickerDate = new Date();
  timePickerDate.setHours(dailyHour, dailyMinute, 0, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.isDark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t.settingsTitle}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Appearance ── */}
        <SectionLabel label={t.settingsSectionAppearance} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {THEME_OPTIONS.map((opt, i) => {
            const palette = themes[opt.key];
            const active = theme === opt.key;
            const isLast = i === THEME_OPTIONS.length - 1;
            return (
              <React.Fragment key={opt.key}>
                <Pressable
                  onPress={() => handleTheme(opt.key)}
                  style={({ pressed }) => [styles.themeRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.swatch, { backgroundColor: palette.background }]}>
                    <View style={[styles.swatchCard, { backgroundColor: palette.card, borderColor: palette.border }]} />
                    <View style={[styles.swatchPrimary, { backgroundColor: palette.primary }]} />
                    <View style={[styles.swatchAccent, { backgroundColor: palette.accent }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]}>{opt.title}</Text>
                    <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{opt.subtitle}</Text>
                  </View>
                  <View style={[styles.check, {
                    backgroundColor: active ? colors.primary : "transparent",
                    borderColor: active ? colors.primary : colors.border,
                  }]}>
                    {active && <Feather name="check" size={13} color={colors.primaryForeground} />}
                  </View>
                </Pressable>
                {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Notifications ── */}
        <SectionLabel label={t.settingsSectionNotifications} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Permission row — only show if not granted */}
          {!isWeb && !permGranted && (
            <>
              <View style={styles.row}>
                <Feather name="bell-off" size={18} color={colors.mutedForeground} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                    {t.settingsNotificationsDenied}
                  </Text>
                </View>
                <Pressable
                  onPress={handleRequestPermission}
                  style={({ pressed }) => [styles.enableBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text style={[styles.enableBtnText, { color: colors.primaryForeground }]}>
                    {t.settingsNotificationsEnable}
                  </Text>
                </Pressable>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          )}

          {/* Enable / disable toggle */}
          <View style={styles.row}>
            <Feather
              name={notifEnabled && (permGranted || isWeb) ? "bell" : "bell-off"}
              size={18}
              color={notifEnabled && (permGranted || isWeb) ? colors.accent : colors.mutedForeground}
              style={{ marginTop: 1 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                {t.settingsNotificationsToggle}
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {t.settingsNotificationsToggleSub}
              </Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotif}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.primaryForeground}
              ios_backgroundColor={colors.border}
            />
          </View>

          {/* Daily reminder time — visible only when enabled and native */}
          {!isWeb && notifEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Pressable
                onPress={() => {
                  if (!permGranted) { handleRequestPermission(); return; }
                  setShowTimePicker(true);
                }}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Feather name="clock" size={18} color={colors.mutedForeground} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                    {t.settingsDailyReminder}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                    {t.settingsDailyReminderSub}
                  </Text>
                </View>
                <Text style={[styles.timeLabel, { color: colors.primary }]}>
                  {permGranted ? formatTime(dailyHour, dailyMinute) : t.settingsDailyReminderOff}
                </Text>
                <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
              </Pressable>
            </>
          )}
        </View>

        {/* Time picker — iOS inline / Android modal */}
        {showTimePicker && !isWeb && (
          <View style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <DateTimePicker
              value={timePickerDate}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
              locale="ar"
              style={{ alignSelf: "center" }}
            />
            {Platform.OS === "ios" && (
              <Pressable
                onPress={() => setShowTimePicker(false)}
                style={({ pressed }) => [styles.pickerDoneBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={[styles.pickerDoneText, { color: colors.primaryForeground }]}>
                  {t.themeDone}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Manage Reminders ── */}
        <SectionLabel label={t.settingsSectionTasks} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            onPress={handleClearCompleted}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="check-circle" size={18} color={colors.accent} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t.settingsClearCompleted}</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {t.settingsClearCompletedSub}{completedCount > 0 ? ` (${completedCount})` : ""}
              </Text>
            </View>
            <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            onPress={handleClearAll}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="trash-2" size={18} color="#E55934" style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: "#E55934" }]}>{t.settingsClearAll}</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {t.settingsClearAllSub}{reminders.length > 0 ? ` (${reminders.length})` : ""}
              </Text>
            </View>
            <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* ── About ── */}
        <SectionLabel label={t.settingsSectionAbout} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* App identity block */}
          <View style={[styles.aboutBlock, { borderBottomColor: colors.border }]}>
            <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
              <Feather name="bell" size={28} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.appName, { color: colors.foreground }]}>تذكيرات</Text>
            <Text style={[styles.appDesc, { color: colors.mutedForeground }]}>
              نظّم مهامك وتذكيراتك بسهولة،{"\n"}ولا تفوّت شيئاً مهماً.
            </Text>
            <View style={[styles.versionBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
                الإصدار {APP_VERSION}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/feedback" as never)}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="message-circle" size={18} color={colors.accent} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t.feedbackSettingsRow}</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{t.feedbackSettingsRowSub}</Text>
            </View>
            <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            onPress={() => Linking.openURL(PRIVACY_URL)}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="shield" size={18} color={colors.mutedForeground} style={{ marginTop: 1 }} />
            <Text style={[styles.rowTitle, { color: colors.foreground, flex: 1 }]}>{t.settingsPrivacyPolicy}</Text>
            <Feather name="external-link" size={15} color={colors.mutedForeground} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            onPress={() => Linking.openURL(SUPPORT_URL)}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="help-circle" size={18} color={colors.mutedForeground} style={{ marginTop: 1 }} />
            <Text style={[styles.rowTitle, { color: colors.foreground, flex: 1 }]}>{t.settingsSupport}</Text>
            <Feather name="external-link" size={15} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

type ColorsType = ReturnType<typeof useColors>;
function SectionLabel({ label, colors }: { label: string; colors: ColorsType }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Cairo_700Bold",
  },
  scroll: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Cairo_600SemiBold",
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: "Cairo_600SemiBold",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Cairo_400Regular",
    marginTop: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontFamily: "Cairo_600SemiBold",
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  swatchCard: {
    position: "absolute",
    top: 7,
    left: 6,
    right: 6,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
  },
  swatchPrimary: {
    position: "absolute",
    bottom: 7,
    left: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  swatchAccent: {
    position: "absolute",
    bottom: 7,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  enableBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enableBtnText: {
    fontSize: 13,
    fontFamily: "Cairo_600SemiBold",
  },
  pickerCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 12,
    gap: 12,
  },
  pickerDoneBtn: {
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  pickerDoneText: {
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
  },
  aboutBlock: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 20,
    fontFamily: "Cairo_700Bold",
  },
  appDesc: {
    fontSize: 13,
    fontFamily: "Cairo_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  versionBadge: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 12,
    fontFamily: "Cairo_500Medium",
  },
});
