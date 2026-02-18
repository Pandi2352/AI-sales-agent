import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils';

interface StepDef {
  label: string;
}

interface StepIndicatorProps {
  steps: StepDef[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <nav className="flex items-start" aria-label="Wizard progress">
      {steps.map((step, i) => {
        const completed = i < currentStep;
        const active = i === currentStep;

        return (
          <Fragment key={step.label}>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => completed && onStepClick(i)}
                disabled={!completed}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all',
                  completed &&
                    'cursor-pointer bg-blue-600 text-white hover:bg-blue-700',
                  active && 'bg-blue-600 text-white ring-4 ring-blue-100',
                  !completed && !active && 'bg-gray-200 text-gray-500',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {completed ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  i + 1
                )}
              </button>
              <span
                className={cn(
                  'text-center text-xs font-medium',
                  completed || active ? 'text-blue-600' : 'text-gray-400',
                )}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 mt-4 h-0.5 flex-1',
                  i < currentStep ? 'bg-blue-600' : 'bg-gray-200',
                )}
              />
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
