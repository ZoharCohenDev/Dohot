import { File, Paths } from 'expo-file-system';

function draftFile() {
  return new File(Paths.document, 'wizard_draft.json');
}

export async function saveWizardDraft(state: object): Promise<void> {
  try {
    draftFile().write(JSON.stringify(state));
  } catch (e) {
    console.warn('[wizardDraft] Failed to save draft', e);
  }
}

export async function loadWizardDraft(): Promise<Record<string, unknown> | null> {
  try {
    const file = draftFile();
    if (!file.exists) return null;
    const raw = await file.text();
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    console.warn('[wizardDraft] Failed to load draft', e);
    return null;
  }
}

export async function clearWizardDraft(): Promise<void> {
  try {
    const file = draftFile();
    if (file.exists) file.delete();
  } catch (e) {
    console.warn('[wizardDraft] Failed to clear draft', e);
  }
}
