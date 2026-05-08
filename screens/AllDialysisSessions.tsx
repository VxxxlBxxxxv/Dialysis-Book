import { useContext, useLayoutEffect } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";

import { SessionsContext } from "../store/session-context";
import Sessions from "../components/Sessions";
import Button from "../components/HeaderButton";
import { useNavigation } from "@react-navigation/native";
import { generateAndShareMarkdown } from "../util/markdownGeneration";

const AllDialysisSessions = () => {
  const { sessions } = useContext(SessionsContext);

  const navigation = useNavigation();

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
