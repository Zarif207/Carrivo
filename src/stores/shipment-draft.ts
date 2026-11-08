"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ContactStep, ParcelStepInput } from "@/lib/validation/shipment";

export type WizardStep = 1 | 2 | 3;

interface DraftState {
  step: WizardStep;
  contact: Partial<ContactStep>;
  parcel: Partial<ParcelStepInput>;
  setStep: (step: WizardStep) => void;
  saveContact: (values: Partial<ContactStep>) => void;
  saveParcel: (values: Partial<ParcelStepInput>) => void;
  reset: () => void;
}

/** v2: weights moved to pounds (weightLb); older drafts with weightKg are ignored. */
export const SHIPMENT_DRAFT_KEY = "carrivo-shipment-draft-v2";

/**
 * The new-shipment draft survives a refresh. sessionStorage (not localStorage): the draft holds
 * names, phones and addresses, so it lives only as long as the tab. Cleared on success and logout.
 */
export const useShipmentDraft = create<DraftState>()(
  persist(
    (set) => ({
      step: 1,
      contact: {},
      parcel: {},
      setStep: (step) => set({ step }),
      saveContact: (contact) => set({ contact }),
      saveParcel: (parcel) => set((state) => ({ parcel: { ...state.parcel, ...parcel } })),
      reset: () => set({ step: 1, contact: {}, parcel: {} }),
    }),
    {
      name: SHIPMENT_DRAFT_KEY,
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: ({ step, contact, parcel }) => ({ step, contact, parcel }),
    },
  ),
);
