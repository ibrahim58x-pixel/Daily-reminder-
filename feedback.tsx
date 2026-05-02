import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { t } from "@/lib/i18n";

const WEB_TOP_INSET = 67;
const WEB_BOTTOM_INSET = 34;

const FEEDBACK_EMAIL = "support@reminders.app";

type FeedbackType = "suggestion" | "complaint";

export default function FeedbackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = (isWeb ? WEB_TOP_INSET : insets.top) + 16;
  const bottomPad = (isWeb ? WEB_BOTTOM_INSET : insets.bottom) + 24;

  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("", t.feedbackEmpty);
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const subject = encodeURIComponent(
      type === "suggestion" ? `اقتراح — تطبيق تذكيرات` : `شكوى — تطبيق تذكيرات`,
    );
    const body = encodeURIComponent(message.trim());
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("", "تعذّر فتح تطبيق البريد الإلكتروني.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.isDark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t.feedbackTitle}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="message-circle" size={40} color={colors.primary} />
          <Text style={[styles.iconLabel, { color: colors.foreground }]}>
            رأيك يهمّنا
          </Text>
          <Text style={[styles.iconSub, { color: colors.mutedForeground }]}>
            ساعدنا في تحسين التطبيق بمشاركة ملاحظاتك
          </Text>
        </View>

        {/* Type selector */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          نوع الرسالة
        </Text>
        <View style={styles.typeRow}>
          {(["suggestion", "complaint"] as FeedbackType[]).map((opt) => {
            const active = type === opt;
            const label =
              opt === "suggestion" ? t.feedbackTypeSuggestion : t.feedbackTypeComplaint;
            const icon = opt === "suggestion" ? "thumbs-up" : "alert-circle";
            return (
              <Pressable
                key={opt}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setType(opt);
                }}
                style={({ pressed }) => [
                  styles.typeChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather
                  name={icon}
                  size={16}
                  color={active ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: active ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Message */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          الرسالة
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t.feedbackMessagePlaceholder}
          placeholderTextColor={colors.mutedForeground}
          multiline
          textAlign="right"
          textAlignVertical="top"
          style={[
            styles.messageInput,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: message.length > 0 ? colors.primary : colors.border,
            },
          ]}
        />
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
          {message.length} حرف
        </Text>

        {/* Send button */}
        <Pressable
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor:
                message.trim().length > 0 ? colors.primary : colors.muted,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Feather
            name="send"
            size={18}
            color={
              message.trim().length > 0
                ? colors.primaryForeground
                : colors.mutedForeground
            }
          />
          <Text
            style={[
              styles.sendText,
              {
                color:
                  message.trim().length > 0
                    ? colors.primaryForeground
                    : colors.mutedForeground,
              },
            ]}
          >
            {t.feedbackSendViaEmail}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
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
    gap: 12,
  },
  iconWrap: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 18,
    fontFamily: "Cairo_700Bold",
  },
  iconSub: {
    fontSize: 13,
    fontFamily: "Cairo_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Cairo_600SemiBold",
    marginTop: 8,
    letterSpacing: 0.4,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  typeLabel: {
    fontSize: 15,
    fontFamily: "Cairo_600SemiBold",
  },
  messageInput: {
    fontSize: 15,
    fontFamily: "Cairo_400Regular",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 160,
  },
  charCount: {
    fontSize: 12,
    fontFamily: "Cairo_400Regular",
    textAlign: "left",
    marginTop: -4,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  sendText: {
    fontSize: 16,
    fontFamily: "Cairo_600SemiBold",
  },
});
