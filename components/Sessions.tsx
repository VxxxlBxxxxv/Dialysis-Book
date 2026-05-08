import { FlatList, StyleSheet, Text, View } from "react-native";
import GlobalColors from "../constants/Colors";

import Session from "../components/Session";


const Sessions = ({ sessions }) => {

  console.log(sessions)
  return (
    <View style={styles.rootContainer}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
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
});
