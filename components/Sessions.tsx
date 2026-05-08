import { useRef } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import GlobalColors from "../constants/Colors";

import Session from "../components/Session";
import InlineSessionForm from "../components/InlineSessionForm";


const Sessions = ({ sessions }) => {
  const listRef = useRef<FlatList>(null);

  const scrollToY = (y: number) => {
    listRef.current?.scrollToOffset({ offset: y, animated: true });
  };

  return (
    <View style={styles.rootContainer}>
      <FlatList
        ref={listRef}
        data={sessions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <InlineSessionForm onScrollRequest={scrollToY} />
        }
        renderItem={({ item }) => (
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
          />
        )}
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
});
