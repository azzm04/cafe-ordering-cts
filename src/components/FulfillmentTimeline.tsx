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
    label: "Sedang Dibuat",
    icon: "👨‍🍳",
    description: "Diproses",
  },
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
  const currentIndex = statusOrder[currentStatus];

  return (
    <div className="w-full py-6 px-2">
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full" />
        
        {/* Progress Line with animation */}
        <div
          className="absolute top-6 left-0 h-1 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${(currentIndex / (steps.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={step.status} className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className={`
                    relative w-12 h-12 sm:w-14 sm:h-14 rounded-full 
                    flex items-center justify-center text-xl sm:text-2xl
                    transition-all duration-500 border-4
                    ${
                      isActive
                        ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg ring-4 ring-primary/20"
                        : isCompleted
                        ? "bg-primary/20 border-primary text-primary shadow-md"
                        : "bg-muted border-muted-foreground/20 text-muted-foreground"
                    }
                  `}
                >
                  {step.icon}
                  
                  {/* Active pulse effect */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                  )}
                </div>

                {/* Label */}
                <div className="mt-3 text-center max-w-[80px] sm:max-w-[100px]">
                  <div
                    className={`
                      text-xs sm:text-sm font-bold
                      transition-colors duration-300
                      ${
                        isActive
                          ? "text-primary"
                          : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground/60"
                      }
                    `}
                  >
                    {step.label}
                  </div>
                  
                  {/* Description - only show for active */}
                  {isActive && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 animate-in fade-in duration-300">
                      {step.description}
                    </div>
                  )}
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <div className="mt-2 flex justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                )}

                {/* Checkmark for completed */}
                {isCompleted && (
                  <div className="mt-2 flex justify-center">
                    <div className="text-primary text-xs">✓</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status text below timeline */}
      <div className="mt-6 text-center">
        <div className="inline-block px-4 py-2 bg-primary/10 rounded-full">
          <p className="text-sm font-semibold text-primary">
            {steps[currentIndex].label}
          </p>
        </div>
      </div>
    </div>
  );
}