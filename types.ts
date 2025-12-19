
export enum CameraView {
  FirstPerson = 'FIRST_PERSON',
  ThirdPerson = 'THIRD_PERSON'
}

export interface CarState {
  speed: number;
  gear: number;
  rpm: number;
  steering: number;
  isBraking: boolean;
  damage: number; // 0 to 100
  indicators: {
    left: boolean;
    right: boolean;
  };
}

export interface DrivingTip {
  title: string;
  instruction: string;
}
