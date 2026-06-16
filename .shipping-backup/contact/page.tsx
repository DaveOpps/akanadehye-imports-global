import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact — Akanadehye Imports Global",
  description: "Reach our trade desk by phone, email, or WhatsApp.",
};

const OFFICES = [
  {
    city: "Tema (Head Office)",
    address: "Harbour Road, Community 1, Tema",
    phone: "+233 50 000 0000",
    email: "tema@akanadehye.com",
    hours: "Mon–Sat 7:00–20:00",
  },
  {
    city: "Accra",
    address: "12 Independence Ave, Ridge, Accra",
    phone: "+233 30 200 0000",
    email: "accra@akanadehye.com",
    hours: "Mon–Fri 8:00–18:00",
  },
  {
    city: "Kumasi",
    address: "Adum High St, near Kejetia, Kumasi",
    phone: "+233 32 200 0000",
    email: "kumasi@akanadehye.com",
    hours: "Mon–Fri 8:00–18:00",
  },
  {
    city: "Takoradi",
    address: "Liberation Rd, Market Circle, Takoradi",
    phone: "+233 31 200 0000",
    email: "takoradi@akanadehye.com",
    hours: "Mon–Fri 8:00–18:00",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-[color:var(--brand-navy)] text-white py-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-gold)]">
            Contact
          </p>
          <h1 className="mt-2 text-4xl lg:text-5xl font-bold leading-tight max-w-3xl">
            Talk to a real person — usually within an hour.
          </h1>
          <p className="mt-4 max-w-2xl text-white/75 text-lg">
            Quote questions, tracking help, customs advice — our trade desk
            is open six days a week.
          </p>
        </div>
      </section>

      <section className="py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-[2fr_3fr] gap-10">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--brand-navy)]">
              Offices
            </h2>
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              {OFFICES.map((o) => (
                <div
                  key={o.city}
                  className="bg-[color:var(--brand-cream)] rounded-xl p-5 border border-[color:var(--border)]"
                >
                  <div className="font-bold text-[color:var(--brand-navy)]">
                    {o.city}
                  </div>
                  <address className="not-italic text-sm text-[color:var(--muted)] mt-1.5 leading-relaxed">
                    {o.address}
                    <a
                      href={`tel:${o.phone.replace(/\s/g, "")}`}
                      className="block mt-2 text-[color:var(--brand-clay)] font-medium"
                    >
                      {o.phone}
                    </a>
                    <a
                      href={`mailto:${o.email}`}
                      className="block text-[color:var(--brand-navy)] underline"
                    >
                      {o.email}
                    </a>
                    <div className="mt-1 text-xs">{o.hours}</div>
                  </address>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 bg-[color:var(--brand-navy)] text-white rounded-xl">
              <div className="text-xs uppercase tracking-wider text-[color:var(--brand-gold)] font-semibold">
                After-hours operations
              </div>
              <div className="mt-1 text-2xl font-bold">+233 50 999 0000</div>
              <div className="mt-1 text-sm text-white/70">
                24/7 emergency line for active shipments
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
