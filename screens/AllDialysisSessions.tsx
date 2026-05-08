import { useContext, useLayoutEffect } from "react";

import { SessionsContext } from "../store/session-context";
import Sessions from "../components/Sessions";
import Info from "../components/Info";
import Button from "../components/HeaderButton";
import { useNavigation } from "@react-navigation/native";
import { generateAndShareMarkdown } from "../util/markdownGeneration";

const AllDialysisSessions = () => {
  const { sessions } = useContext(SessionsContext);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          name="add"
          size={18}
          color="white"
          onPress={() => navigation.navigate("Manage Session")}
        />
      ),

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

  return sessions.length > 0 ? (
    <Sessions sessions={sessions} />
  ) : (
    <Info info="Сеансов пока нет" />
  );
};

export default AllDialysisSessions;
