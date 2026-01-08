// src/components/FulfillmentTimeline.tsx
"use client";

type FulfillmentStatus = "received" | "preparing" | "served" | "completed";

type Props = {
  currentStatus: FulfillmentStatus;
};

const steps = [
  {
    status: "received" as const,
    label: "Diterima",
    icon: "📝",
    description: "Order masuk",
  },
  {
    status: "preparing" as const,
    label: "Dibuat",
    icon: "👨‍🍳",
    description: "Diproses",
  }, // Label dipersingkat dikit
  {
    status: "served" as const,
    label: "Disajikan",
    icon: "🍽️",
    description: "Siap diantar",
  },
  {
    status: "completed" as const,
    label: "Selesai",
    icon: "✅",
    description: "Terima kasih",
  },
] as const;

const statusOrder: Record<FulfillmentStatus, number> = {
  received: 0,
  preparing: 1,
  served: 2,
  completed: 3,
};

export function FulfillmentTimeline({ currentStatus }: Props) {
  const currentIndex = statusOrder[currentStatus] ?? 0;

  return (
    <div className="w-full py-4 sm:py-6 px-0 sm:px-2">
      <div className="relative">
        {/* Garis Background */}
        <div className="absolute top-5 sm:top-6 left-0 right-0 h-1 bg-muted rounded-full" />

        {/* Garis Progress */}
        <div
          className="absolute top-5 sm:top-6 left-0 h-1 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div
                key={step.status}
                className="flex flex-col items-center flex-1 z-10"
              >
                {/* Circle Icon */}
                <div
                  className={[
                    "relative flex items-center justify-center transition-all duration-500 border-4 bg-background",
                    // NOTE Ukuran Mobile: w-10 h-10, Ukuran Desktop: w-14 h-14 
                    "w-10 h-10 text-lg sm:w-14 sm:h-14 sm:text-2xl rounded-full",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg ring-2 sm:ring-4 ring-primary/20"
                      : isCompleted
                      ? "bg-primary/20 border-primary text-primary shadow-md"
                      : "bg-muted border-muted-foreground/20 text-muted-foreground",
                  ].join(" ")}
                >
                  {step.icon}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                  )}
                </div>

                {/* Text Label */}
                <div className="mt-2 sm:mt-3 text-center w-full">
                  <div
                    className={[
                      "text-[10px] sm:text-sm font-bold transition-colors duration-300 leading-tight",
                      isActive
                        ? "text-primary"
                        : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground/60",
                    ].join(" ")}
                  >
                    {step.label}
                  </div>

                  {/* Description: Hidden on Mobile, Visible on Small Tablet and up */}
                  {isActive && (
                    <div className="hidden sm:block text-xs text-muted-foreground mt-1 animate-in fade-in duration-300">
                      {step.description}
                    </div>
                  )}
                </div>

                {/* Indikator Active Dot */}
                {isActive && (
                  <div className="mt-1 sm:mt-2 flex justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Text Tambahan di Bawah (Mobile Friendly) */}
      <div className="mt-4 sm:mt-6 text-center">
        <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 rounded-full">
          <p className="text-xs sm:text-sm font-semibold text-primary">
            Status: {steps[currentIndex]?.label}
            <span className="font-normal opacity-70 ml-1">
              - {steps[currentIndex]?.description}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
