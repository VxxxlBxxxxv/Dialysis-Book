import { StyleSheet, Text, View } from "react-native";
import { BUILD_NUMBER } from "../constants/build";

export default function BuildBadge() {
  return (
    <View style={styles.badge} pointerEvents="none">
      <Text style={styles.text}>#{BUILD_NUMBER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: 12,
    bottom: 10,
    zIndex: 9999,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(0, 0, 0, 0.3)",
  },
});
