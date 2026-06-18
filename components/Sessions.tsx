import { useContext, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalColors from "../constants/Colors";

import Session from "./Session";
import SessionEditForm from "./SessionEditForm";
import { SessionsContext } from "../store/session-context";
import { getFormattedDate } from "../util/date";
import { hasValue } from "../util/format";
import { DialysisSession } from "../types";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function hasEmptyCoreFields(session: DialysisSession): boolean {
  return (
    !hasValue(session.weightBefore) ||
    !hasValue(session.weightAfter) ||
    !hasValue(session.preDialysisBP?.systolic) ||
    !hasValue(session.preDialysisBP?.diastolic) ||
    !hasValue(session.postDialysisBP?.systolic) ||
    !hasValue(session.postDialysisBP?.diastolic)
  );
}

const Sessions = ({
  sessions,
  onEditingChange,
}: {
  sessions: DialysisSession[];
  onEditingChange?: (isEditing: boolean) => void;
}) => {
  const { addSession, updateSession, deleteSession } = useContext(SessionsContext);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    onEditingChange?.(editingId !== null);
  }, [editingId, onEditingChange]);

  function startNew() {
    const now = new Date();
    const prev = sessions.length > 0 ? sessions[0] : null;
    const id = addSession({
      date: getFormattedDate(now),
      startTime: now.toString(),
      endTime: new Date(now.getTime() + FOUR_HOURS_MS).toString(),
      weightBefore: null,
      weightAfter: null,
      dryWeight: hasValue(prev?.dryWeight) ? prev!.dryWeight : null,
      notes: "",
      preDialysisBP: { systolic: null, diastolic: null },
      midDialysisBP: { systolic: null, diastolic: null },
      postDialysisBP: { systolic: null, diastolic: null },
    });
    setNewId(id);
    setEditingId(id);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  function handleSave(payload: Omit<DialysisSession, "id">, id: string) {
    updateSession({ ...payload, id }, id);
    setEditingId(null);
    setNewId(null);
  }

  function handleCancel(id: string, isNew: boolean) {
    if (isNew) deleteSession(id);
    setEditingId(null);
    setNewId(null);
  }

  function handleDelete(id: string) {
    deleteSession(id);
    setEditingId(null);
    setNewId(null);
  }

  // Переход к редактированию другой записи: если был несохранённый новый
  // черновик — удалить его, чтобы пустая запись не оставалась в списке.
  function startEdit(id: string) {
    if (newId && newId !== id) deleteSession(newId);
    setNewId(null);
    setEditingId(id);
  }

  return (
    <View style={styles.rootContainer}>
      <FlatList
        ref={listRef}
        data={sessions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        automaticallyAdjustKeyboardInsets
        removeClippedSubviews={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          editingId === null ? (
            <Pressable
              onPress={startNew}
              style={({ pressed }) => [
                styles.newCard,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="add-circle" size={28} color="#4a90d9" />
              <Text style={styles.newText}>Новый сеанс</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) =>
          item.id === editingId ? (
            <SessionEditForm
              session={item}
              isNew={item.id === newId}
              autoFocusFirstEmpty={
                item.id === newId ||
                (item.id === sessions[0]?.id && hasEmptyCoreFields(item))
              }
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          ) : (
            <Session
              date={item.date}
              startTime={item.startTime}
              endTime={item.endTime}
              weightAfter={item.weightAfter}
              weightBefore={item.weightBefore}
              dryWeight={item.dryWeight}
              notes={item.notes}
              id={item.id}
              preDialysisBP={item.preDialysisBP}
              midDialysisBP={item.midDialysisBP}
              postDialysisBP={item.postDialysisBP}
              pulsePre={item.pulsePre}
              pulseMid={item.pulseMid}
              pulsePost={item.pulsePost}
              symptoms={item.symptoms}
              exportedAt={item.exportedAt}
              onEdit={startEdit}
            />
          )
        }
      />
    </View>
  );
};

export default Sessions;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: GlobalColors.primary300,
  },
  content: {
    paddingBottom: 320,
  },
  newCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 14,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e0e8f5",
    borderStyle: "dashed",
  },
  newText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#4a90d9",
  },
});
