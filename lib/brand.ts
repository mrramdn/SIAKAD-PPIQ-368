export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Pesantren Digital";
export const APP_SHORT = "Pesantren";
export const APP_TAGLINE = "Sistem Informasi Pondok Pesantren";

export const LEVEL_LABEL = { SD: "SD", SMP: "SMP", SMA: "SMA" } as const;
export const LEVEL_FULL = {
  SD: "Sekolah Dasar",
  SMP: "Madrasah Tsanawiyah / SMP",
  SMA: "Madrasah Aliyah / SMA",
} as const;

export type Level = keyof typeof LEVEL_LABEL;
export const LEVELS: Level[] = ["SD", "SMP", "SMA"];
