import Image from "next/image";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-11 w-11",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export function BrandMark({ size = "md" }: BrandMarkProps) {
  return (
    <div
      className={`${sizeClass[size]} overflow-hidden rounded-full bg-paper shadow-[0_1px_0_rgba(0,0,0,0.1),0_16px_40px_oklch(0.24_0.035_135_/_0.14)]`}
    >
      <Image
        src="/logo.png"
        alt="Logo Pondok Pesantren Integritas Qurani"
        width={160}
        height={160}
        priority={size === "lg"}
        className="h-full w-full object-cover outline outline-1 outline-[rgba(0,0,0,0.1)]"
      />
    </div>
  );
}
