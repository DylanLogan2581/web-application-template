import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Check, Database, Router } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { helloQueryOptions, sessionQueryOptions } from "@/features/home";
import { cn } from "@/lib/utils";

import type { JSX } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
});

function getErrorText(errors: unknown[]): string {
  return errors
    .map((error) => {
      if (typeof error === "string") {
        return error;
      }

      if (error !== null && typeof error === "object" && "message" in error) {
        const message = error.message;
        return typeof message === "string" ? message : "Invalid value.";
      }

      return "Invalid value.";
    })
    .join(", ");
}

function HomePage(): JSX.Element {
  const [submittedName, setSubmittedName] = useState("");
  const adaptedErrors =
    zodValidator()().validate(
      { value: { name: submittedName }, validationSource: "form" },
      formSchema,
    ) ?? null;
  const helloQuery = useQuery(helloQueryOptions);
  const sessionQuery = useQuery(sessionQueryOptions);
  const form = useForm({
    defaultValues: { name: "" },
    validators: { onChange: formSchema },
    onSubmit: ({ value }) => {
      setSubmittedName(value.name);
    },
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 py-6">
      <section className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          web application template
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Minimal library examples
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every installed runtime library below has a deliberately small
          example.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Router className="size-4" />
            <h2 className="font-medium">TanStack Router</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            This page is the <code>/</code> route. The About link is a second
            file-based route.
          </p>
        </article>

        <article className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Check className="size-4" />
            <h2 className="font-medium">React Query</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {helloQuery.data ?? "Loading query..."}
          </p>
        </article>

        <article className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Database className="size-4" />
            <h2 className="font-medium">Supabase</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {sessionQuery.data ?? "Checking auth session..."}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-medium">TanStack Form + Zod</h2>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="name"
            children={(field) => (
              <label className="flex flex-1 flex-col gap-2">
                <span className="text-sm text-muted-foreground">Name</span>
                <input
                  className={cn(
                    "h-9 rounded-md border bg-background px-3 outline-none transition",
                    field.state.meta.errors.length > 0
                      ? "border-destructive"
                      : "",
                  )}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Ada"
                />
                <span className="min-h-5 text-sm text-destructive">
                  {getErrorText(field.state.meta.errors)}
                </span>
              </label>
            )}
          />
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
            children={([canSubmit, isSubmitting]) => (
              <Button className="sm:mt-7" disabled={!canSubmit}>
                {isSubmitting ? "Saving..." : "Submit"}
              </Button>
            )}
          />
        </form>
        <p className="mt-2 text-sm text-muted-foreground">
          Submitted value:{" "}
          {submittedName !== "" ? submittedName : "Nothing yet."}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Zod adapter output:{" "}
          {adaptedErrors !== null
            ? "returns formatted errors for invalid values."
            : "valid result."}
        </p>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-medium">shadcn/ui + Radix + utility helpers</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button>
            <Check />
            Default button
          </Button>
          <Button asChild variant="outline">
            <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">
              Slot-based link button
            </a>
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          The button component uses <code>class-variance-authority</code>,{" "}
          <code>radix-ui</code>, <code>clsx</code>, and{" "}
          <code>tailwind-merge</code>.
        </p>
      </section>
    </main>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
