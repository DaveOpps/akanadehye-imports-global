"use client";
import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Freight enquiry",
    message: "",
  });

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-[color:var(--border)] p-8 lg:p-10">
        <div className="w-14 h-14 rounded-full bg-[color:var(--brand-gold)] flex items-center justify-center text-2xl">
          ✓
        </div>
        <h2 className="mt-5 text-2xl font-bold text-[color:var(--brand-navy)]">
          Message received.
        </h2>
        <p className="mt-2 text-[color:var(--muted)]">
          A specialist will reply to {form.email} within a few hours.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setForm({
              name: "",
              email: "",
              phone: "",
              subject: "Freight enquiry",
              message: "",
            });
          }}
          className="mt-6 btn-outline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="bg-white rounded-2xl border border-[color:var(--border)] p-7 lg:p-9 space-y-5"
    >
      <div>
        <h2 className="text-2xl font-bold text-[color:var(--brand-navy)]">
          Send a message
        </h2>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          We respond within one business hour during opening times.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-semibold mb-1.5">Full name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border-2 border-[color:var(--border)] focus:border-[color:var(--brand-gold)] outline-none"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold mb-1.5">Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border-2 border-[color:var(--border)] focus:border-[color:var(--brand-gold)] outline-none"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold mb-1.5">Phone</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border-2 border-[color:var(--border)] focus:border-[color:var(--brand-gold)] outline-none"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold mb-1.5">Subject</span>
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border-2 border-[color:var(--border)] focus:border-[color:var(--brand-gold)] outline-none"
          >
            <option>Freight enquiry</option>
            <option>Tracking help</option>
            <option>Customs question</option>
            <option>Warehousing</option>
            <option>Partnership</option>
            <option>Other</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-semibold mb-1.5">Message</span>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Tell us what you're moving, where from, where to…"
          className="w-full px-4 py-3 rounded-lg border-2 border-[color:var(--border)] focus:border-[color:var(--brand-gold)] outline-none"
        />
      </label>

      <button type="submit" className="btn-primary w-full justify-center">
        Send message →
      </button>
    </form>
  );
}
