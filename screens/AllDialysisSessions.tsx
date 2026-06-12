import { useContext, useLayoutEffect } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";

import { SessionsContext } from "../store/session-context";
import Sessions from "../components/Sessions";
import Button from "../components/HeaderButton";
import { useNavigation } from "@react-navigation/native";
import { generateAndShareMarkdown } from "../util/markdownGeneration";
import { exportBackup, pickBackup, mergeSessions } from "../util/backup";

const AllDialysisSessions = () => {
  const { sessions, replaceAllSessions } = useContext(SessionsContext);

  const navigation = useNavigation();

  async function handleRestore() {
    const imported = await pickBackup();
    if (!imported) return;
    const { merged, added, skipped } = mergeSessions(sessions, imported);
    replaceAllSessions(merged);
    Alert.alert(
      "Восстановление завершено",
      `Добавлено сеансов: ${added}.` +
        (skipped > 0 ? ` Пропущено (уже есть): ${skipped}.` : "")
    );
  }

  function openBackupMenu() {
    Alert.alert("Резервная копия", "Выберите действие", [
      { text: "Сохранить копию", onPress: () => exportBackup(sessions) },
      { text: "Восстановить из копии", onPress: handleRestore },
      { text: "Отмена", style: "cancel" },
    ]);
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          name="share"
          size={18}
          color="white"
          onPress={() => generateAndShareMarkdown(sessions)}
        />
      ),
      headerRight: () => (
        <Button
          name="save-outline"
          size={20}
          color="white"
          onPress={openBackupMenu}
        />
      ),
    });
  }, [navigation, sessions]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Sessions sessions={sessions} />
    </KeyboardAvoidingView>
  );
};

export default AllDialysisSessions;
