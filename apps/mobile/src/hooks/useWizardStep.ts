import { useRouter, usePathname } from 'expo-router';
import { useWizard } from '@/context/WizardContext';
import { DOCUMENT_TYPES, STEP_ROUTES, type WizardStep } from '@/config/documentTypes';
import { ROUTES } from '@/navigation/constants';

export function useWizardStep() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useWizard();

  const docType = (state.docType ?? 'report') as keyof typeof DOCUMENT_TYPES;
  const config = DOCUMENT_TYPES[docType] ?? DOCUMENT_TYPES.report;

  // Derive current step from the last URL segment
  const currentStep = pathname.split('/').pop() as WizardStep;
  const stepIndex = config.steps.indexOf(currentStep);

  // Progress tracks only the "visible" steps (excludes transitions like voice-idle, processing, voice, send)
  const progressIndex = config.progressSteps.indexOf(currentStep);
  const progress = progressIndex >= 0
    ? (progressIndex + 1) / config.progressSteps.length
    : 0;

  // Step indicator for Header (1-based, counts only progressSteps)
  const stepNum = progressIndex >= 0 ? progressIndex + 1 : undefined;
  const stepOf = config.progressSteps.length;

  const goNext = () => {
    if (stepIndex < 0) { router.back(); return; }
    const nextStep = config.steps[stepIndex + 1];
    if (nextStep) {
      router.push(STEP_ROUTES[nextStep] as never);
    } else {
      router.replace(ROUTES.APP_HOME);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      const prevStep = config.steps[stepIndex - 1]!;
      router.push(STEP_ROUTES[prevStep] as never);
    } else {
      router.replace(ROUTES.APP_CREATE);
    }
  };

  return { goNext, goBack, progress, stepNum, stepOf, currentStep, config };
}
