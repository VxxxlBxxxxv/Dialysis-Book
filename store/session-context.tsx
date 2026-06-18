import React, { createContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { DialysisSession } from "../types";

interface SessionsContextType {
  sessions: DialysisSession[];
  addSession: (session: Omit<DialysisSession, "id">) => string;
  deleteSession: (id: string) => void;
  updateSession: (session: DialysisSession, id: string) => void;
  replaceAllSessions: (sessions: DialysisSession[]) => void;
  markSessionsExported: (ids: string[], exportedAt: string) => void;
}

export const SessionsContext = createContext<SessionsContextType>({
  sessions: [],
  addSession: () => "",
  updateSession: () => {},
  deleteSession: () => {},
  replaceAllSessions: () => {},
  markSessionsExported: () => {},
});

const STORAGE_KEY = "dialysis_sessions";

function makeId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

// Гарантирует уникальный id у каждого сеанса. Прежний генератор брал
// prevSessions[last].id+1 — а last это самый старый сеанс → коллизии id,
// из-за которых тап по записи открывал чужую (F6). Чиним при загрузке.
function ensureUniqueIds(sessions: DialysisSession[]): DialysisSession[] {
  const seen = new Set<string>();
  return sessions.map((session, index) => {
    let id = session.id != null ? String(session.id) : "";
    if (id === "" || seen.has(id)) {
      id = `${makeId()}-${index}`;
    }
    seen.add(id);
    return { ...session, id };
  });
}

interface SessionsProviderProps {
  children: ReactNode;
}

export function SessionsContextProvider({ children }: SessionsProviderProps) {
  const [sessions, setSessionsState] = useState<DialysisSession[]>([]);

  // 🔹 Load from AsyncStorage on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData) {
          setSessionsState(ensureUniqueIds(JSON.parse(storedData)));
        }
      } catch (error) {
        console.error("Failed to load sessions from storage:", error);
      }
    };

    loadSessions();
  }, []);

  // 🔹 Save to AsyncStorage whenever sessions change
  useEffect(() => {
    const saveSessions = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (error) {
        console.error("Failed to save sessions to storage:", error);
      }
    };

    saveSessions();
  }, [sessions]);

  function addSession(sessionData: Omit<DialysisSession, "id">): string {
    const id = makeId();
    setSessionsState((prevSessions) => [
      { ...sessionData, id },
      ...prevSessions,
    ]);
    return id;
  }

  function updateSession(sessionData: DialysisSession, id: String) {
    setSessionsState((prevSessions) => {
      const sessionToBeUpdatedIndex = prevSessions.findIndex(
        (session) => session.id === id
      );

      const newSessions = [...prevSessions];

      newSessions[sessionToBeUpdatedIndex] = { ...sessionData };

      return newSessions;
    });
  }

  function deleteSession(id: string) {
    setSessionsState((prevSessions) =>
      prevSessions.filter((item) => item.id !== id)
    );
  }

  // Полная замена списка (восстановление из резервной копии). Прогоняем через
  // ensureUniqueIds на случай коллизий id между импортом и текущими данными.
  function replaceAllSessions(next: DialysisSession[]) {
    setSessionsState(ensureUniqueIds(next));
  }

  function markSessionsExported(ids: string[], exportedAt: string) {
    const idSet = new Set(ids);
    setSessionsState((prevSessions) =>
      prevSessions.map((session) =>
        idSet.has(session.id) ? { ...session, exportedAt } : session
      )
    );
  }

  const value: SessionsContextType = {
    sessions,
    addSession,
    deleteSession,
    updateSession,
    replaceAllSessions,
    markSessionsExported,
  };

  return (
    <SessionsContext.Provider value={value}>
      {children}
    </SessionsContext.Provider>
  );
}
