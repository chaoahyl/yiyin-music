export enum ELANG_VALUE {
  En = "en-US",
  Zh = "zh-CN",
}

const ELANG = Object.values(ELANG_VALUE);

type TElang = typeof ELANG;
export type TElangs = TElang[number];
