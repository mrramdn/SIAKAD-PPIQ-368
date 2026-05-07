type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText: string;
  isPending: boolean;
};

export function SubmitButton({ children, pendingText, isPending }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="min-h-12 w-full rounded-2xl bg-brand px-5 text-base font-semibold text-paper shadow-[0_16px_36px_oklch(0.44_0.15_147_/_0.22)] transition-[transform,background-color,box-shadow,opacity] duration-200 ease-out active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
    >
      {isPending ? pendingText : children}
    </button>
  );
}
