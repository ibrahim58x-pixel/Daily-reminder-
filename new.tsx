import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ReminderForm } from "@/components/ReminderForm";
import { useReminders } from "@/context/RemindersContext";
import { useColors } from "@/hooks/useColors";
import { t } from "@/lib/i18n";

export default function NewReminderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addReminder } = useReminders();

  const isWeb = Platform.OS === "web";
  const topPad = (isWeb ? 67 : insets.top) + 8;
  const bottomPad = (isWeb ? 34 : insets.bottom) + 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.isDark ? "light" : "dark"} />
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[
            styles.iconBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="x" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t.newReminder}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: bottomPad },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ReminderForm
            submitLabel={t.saveReminder}
            onSubmit={async (value) => {
              await addReminder(value);
              router.back();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 17,
    fontFamily: "Cairo_600SemiBold",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
