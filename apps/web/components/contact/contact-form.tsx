"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { type ChangeEvent, type FormEvent, useState } from "react";

const TOPICS = [
  "General",
  "News tip",
  "Correction",
  "Advertising & partnerships",
  "Poll & voter inquiry",
] as const;

type Topic = (typeof TOPICS)[number];

export function ContactForm({ contactEmail }: { contactEmail: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<Topic>("General");
  const [articleUrl, setArticleUrl] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const subject = encodeURIComponent(topic);
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Email: ${email}`,
        `Topic: ${topic}`,
        articleUrl ? `Article URL: ${articleUrl}` : null,
        "",
        message,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <div>
      <form
        className="grid gap-4 rounded-xl border bg-card p-5"
        aria-labelledby="contact-form-heading"
        onSubmit={handleSubmit}
        noValidate
      >
        <h3
          id="contact-form-heading"
          className="font-display text-2xl font-extrabold uppercase"
        >
          Send a message
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-name">
              Name{" "}
              <span className="text-primary" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="contact-name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-email">
              Email address{" "}
              <span className="text-primary" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contact-topic">
            Topic{" "}
            <span className="text-primary" aria-hidden>
              *
            </span>
          </Label>
          <Select
            value={topic}
            onValueChange={(value) => setTopic(value as Topic)}
          >
            <SelectTrigger id="contact-topic" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOPICS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contact-url">
            Article URL{" "}
            <span className="font-normal text-muted-foreground">
              (optional, for corrections)
            </span>
          </Label>
          <Input
            id="contact-url"
            name="url"
            type="url"
            inputMode="url"
            placeholder="https://example.com/your-story"
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contact-message">
            Message{" "}
            <span className="text-primary" aria-hidden>
              *
            </span>
          </Label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            required
            maxLength={2000}
            value={message}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setMessage(event.target.value)
            }
            aria-describedby="contact-message-hint"
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
          <p
            id="contact-message-hint"
            className="text-sm text-muted-foreground"
          >
            Up to 2,000 characters.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Send message</Button>
          <p className="text-sm text-muted-foreground">
            Opens your email app with the message pre-filled.
          </p>
        </div>
      </form>
      {submitted ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-up/40 bg-up/5 p-4 text-sm"
        >
          <div className="font-semibold">Ready to send</div>
          <p className="text-muted-foreground">
            If your mail app did not open, email us at {contactEmail} with your
            topic in the subject line.
          </p>
        </div>
      ) : null}
    </div>
  );
}
