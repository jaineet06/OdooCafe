import { useIsFetching } from "@tanstack/react-query";

export function TopProgressBar() {
  const isFetching = useIsFetching();
  const active = isFetching > 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent">
      <div
        className={`h-full bg-accent-primary transition-all duration-300 ${active ? "w-2/3 opacity-100" : "w-full opacity-0"}`}
      />
    </div>
  );
}
