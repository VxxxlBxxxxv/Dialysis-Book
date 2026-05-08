export type RootStackParamList = {
  "Manage Session": { selectedSession?: string };
  "Dialysis Sessions": undefined;
};

export interface HeaderButtonProps {
  name: string;
  size: number;
  color: string;
  id: number;
  onPress: () => void;
}

export interface ButtonProps {
  onPress: () => void;
  text: string;
}

export type DialysisSession = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  weightBefore: number;
  weightAfter: number;
  dryWeight: number;
  notes?: string;
  preDialysisBP: { systolic: number; diastolic: number };
  midDialysisBP: { systolic: number; diastolic: number };
  postDialysisBP: { systolic: number; diastolic: number };
};
