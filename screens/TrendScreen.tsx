import { useContext } from "react";
import { SessionsContext } from "../store/session-context";
import TrendChart from "../components/TrendChart";

const TrendScreen = () => {
  const { sessions } = useContext(SessionsContext);
  return <TrendChart sessions={sessions} />;
};

export default TrendScreen;
