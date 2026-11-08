"use client";

// Client: step 1 form (sender and receiver).
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { TextField } from "@/components/shared/form-fields";
import { UsAddressFields } from "@/components/shared/us-address-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { EMPTY_US_ADDRESS, US_PHONE_PLACEHOLDER } from "@/lib/us";
import { contactStepSchema, type ContactStep } from "@/lib/validation/shipment";
import { useShipmentDraft } from "@/stores/shipment-draft";
import { useServerErrors } from "./use-server-errors";

const FIELDS = ["senderName", "senderPhone", "pickupAddress.street", "receiverName", "receiverPhone", "receiverEmail", "deliveryAddress.street"] as const;

/** The API checks each address as one line; its message goes on the street input. */
const toFormErrors = (errors?: Record<string, string>) =>
  errors && Object.fromEntries(Object.entries(errors).map(([name, message]) => [name.endsWith("Address") ? `${name}.street` : name, message]));

export function ContactStepForm({ defaults, serverErrors }: { defaults: Partial<ContactStep>; serverErrors?: Record<string, string> }) {
  const draft = useShipmentDraft((s) => s.contact);
  const saveContact = useShipmentDraft((s) => s.saveContact);
  const setStep = useShipmentDraft((s) => s.setStep);

  const form = useForm<ContactStep>({
    resolver: zodResolver(contactStepSchema),
    defaultValues: {
      senderName: "",
      senderPhone: "",
      pickupAddress: EMPTY_US_ADDRESS,
      receiverName: "",
      receiverPhone: "",
      receiverEmail: "",
      deliveryAddress: EMPTY_US_ADDRESS,
      ...defaults,
      ...draft,
    },
  });
  useServerErrors(form, toFormErrors(serverErrors), FIELDS);

  // Autosave as you type, so a refresh keeps the step exactly as it was.
  const typed = useWatch({ control: form.control });
  useEffect(() => {
    saveContact(typed as Partial<ContactStep>);
  }, [typed, saveContact]);

  const next = form.handleSubmit((values) => {
    saveContact(values);
    setStep(2);
  });

  return (
    <Form {...form}>
      <form onSubmit={next} noValidate className="space-y-8">
        <fieldset className="space-y-5 rounded-xl bg-card p-6 shadow-card">
          <legend className="sr-only">Sender</legend>
          <h3 className="text-lg font-bold" aria-hidden="true">
            Sender
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField control={form.control} name="senderName" label="Name" autoComplete="name" />
            <TextField control={form.control} name="senderPhone" label="Phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={US_PHONE_PLACEHOLDER} />
          </div>
          <UsAddressFields control={form.control} name="pickupAddress" legend="Pickup address" description="The courier collects from here." autofillSection="pickup" />
        </fieldset>

        <fieldset className="space-y-5 rounded-xl bg-card p-6 shadow-card">
          <legend className="sr-only">Receiver</legend>
          <h3 className="text-lg font-bold" aria-hidden="true">
            Receiver
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField control={form.control} name="receiverName" label="Name" />
            <TextField control={form.control} name="receiverPhone" label="Phone" type="tel" inputMode="tel" placeholder="(323) 555-0144" />
          </div>
          <TextField control={form.control} name="receiverEmail" label="Email" optional type="email" inputMode="email" description="We'll only use it for delivery updates." />
          <UsAddressFields control={form.control} name="deliveryAddress" legend="Delivery address" autofillSection="delivery" />
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Next: parcel <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
