"use client";

// Client: validates the message and hands it to the visitor's email app (there is no contact API).
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Mail, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SelectField, TextareaField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CONTACT_TOPICS, contactSchema, type ContactValues } from "@/lib/validation/public";

function buildEmail(values: ContactValues): { subject: string; body: string } {
  const topic = CONTACT_TOPICS.find((t) => t.value === values.topic)?.label ?? "Question";
  const subject = values.trackingId ? `${topic}: ${values.trackingId.toUpperCase()}` : topic;
  const lines = [values.message, "", `Name: ${values.name}`, `Reply to: ${values.email}`];
  if (values.trackingId) lines.push(`Tracking ID: ${values.trackingId.toUpperCase()}`);
  return { subject, body: lines.join("\n") };
}

export function ContactForm({ to }: { to: string }) {
  const [prepared, setPrepared] = useState<{ subject: string; body: string } | null>(null);
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", topic: "", trackingId: "", message: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    const email = buildEmail(values);
    setPrepared(email);
    window.location.assign(`mailto:${to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`);
  });

  const copy = async () => {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(`To: ${to}\nSubject: ${prepared.subject}\n\n${prepared.body}`);
      toast.success("Message copied");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };

  if (prepared) {
    return (
      <div className="space-y-5 rounded-2xl bg-card p-6 shadow-card sm:p-8" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight">Your email is ready to send</h2>
          <p className="text-muted-foreground">
            Your email app should have opened with the message filled in. Press send there to reach us. If nothing opened, copy the message and email it
            to <a className="font-semibold text-brand-text underline underline-offset-4" href={`mailto:${to}`}>{to}</a>.
          </p>
        </div>
        <pre className="max-h-56 overflow-auto rounded-xl bg-surface p-4 text-sm whitespace-pre-wrap">{`Subject: ${prepared.subject}\n\n${prepared.body}`}</pre>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copy} variant="outline">
            <Copy aria-hidden="true" /> Copy message
          </Button>
          <Button variant="ghost" onClick={() => setPrepared(null)}>
            Edit message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <p className="rounded-xl bg-surface p-4 text-sm text-muted-foreground">
          This form doesn&rsquo;t send anything by itself. It opens your email app with the message filled in, addressed to {to}.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="name" label="Your name" autoComplete="name" />
          <TextField control={form.control} name="email" label="Your email" type="email" autoComplete="email" inputMode="email" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            control={form.control}
            name="topic"
            label="What's it about?"
            options={CONTACT_TOPICS.map((t) => ({ value: t.value, label: t.label }))}
          />
          <TextField control={form.control} name="trackingId" label="Tracking ID" optional placeholder="CRV-261101-SEED05" maxLength={24} />
        </div>
        <TextareaField control={form.control} name="message" label="Message" rows={6} maxLength={1500} />
        <Button type="submit" size="lg">
          <Mail aria-hidden="true" /> Open in my email app
        </Button>
      </form>
    </Form>
  );
}
