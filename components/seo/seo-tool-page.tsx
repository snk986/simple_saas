import type { ReactNode } from "react";
import {
  CheckCircle2,
  Music2,
  Search,
  Sparkles,
} from "lucide-react";

interface ToolPageCard {
  title: string;
  description: string;
}

interface ToolPageFaq {
  question: string;
  answer: string;
}

interface SeoToolPageProps {
  eyebrow: string;
  title: string;
  description: string;
  secondaryCta: string;
  secondaryHref: string;
  form: ReactNode;
  benefitsTitle: string;
  benefitsDescription: string;
  benefits: ToolPageCard[];
  stepsTitle: string;
  stepsDescription: string;
  steps: ToolPageCard[];
  faqTitle: string;
  faqs: ToolPageFaq[];
}

const icons = [Sparkles, Music2, Search];

export function SeoToolPage({
  eyebrow,
  title,
  description,
  secondaryCta,
  secondaryHref,
  form,
  benefitsTitle,
  benefitsDescription,
  benefits,
  stepsTitle,
  stepsDescription,
  steps,
  faqTitle,
  faqs,
}: SeoToolPageProps) {
  return (
    <div className="bg-background">
      <section className="border-b bg-muted/30 py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="sr-only">
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
            <a href={secondaryHref}>{secondaryCta}</a>
          </div>
          <div className="mx-auto max-w-6xl">{form}</div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-normal md:text-4xl">
              {benefitsTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              {benefitsDescription}
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map((item, index) => {
              const Icon = icons[index % icons.length];
              return (
                <article
                  key={item.title}
                  className="rounded-lg border bg-card p-5 shadow-sm"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold tracking-normal">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-normal md:text-4xl">
                {stepsTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                {stepsDescription}
              </p>
            </div>
            <ol className="grid gap-3">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="grid gap-3 rounded-lg border bg-card p-5 shadow-sm sm:grid-cols-[42px_1fr]"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span>
                    <strong className="text-base">{step.title}</strong>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-normal md:text-4xl">
            {faqTitle}
          </h2>
          <div className="mt-6 grid gap-3">
            {faqs.map((item, index) => (
              <details
                key={item.question}
                open={index === 0}
                className="rounded-lg border bg-card p-5"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 font-semibold [&::-webkit-details-marker]:hidden">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
