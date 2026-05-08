// types.ts or AppNavigator.ts
export type RootStackParamList = {
  "Manage Session": undefined;
  "Dialysis Sessions": undefined;
};

export interface HeaderButtonProps {
  name: string; 
  size: number;
  color: string;
  id:number;
  onPress:()=>void;
}

export interface ButtonProps {

  

  onPress:()=>void;
  text:string,
}



export type DialysisSession = {
  id: string;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
  weightBefore: number;  // in kg
  weightAfter: number;   // in kg
  notes?: string;
  preDialysisBP:{ systolic :number,diastolic:number},
  midDialysisBP:{systolic:number,diastolic:number},
  postDialysisBP:{systolic:number,diastolic:number}
};

