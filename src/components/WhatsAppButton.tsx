const PHONE = "233500000000";
const MESSAGE = "Hi Akanadehye! I have a question about your platform.";

export default function WhatsAppButton() {
  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.85 11.85 0 0012.04 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.36-1.67a11.83 11.83 0 005.68 1.45h.01c6.54 0 11.84-5.3 11.84-11.85a11.8 11.8 0 00-3.37-8.45zM12.05 21.8h-.01a9.94 9.94 0 01-5.07-1.39l-.36-.21-3.77.99 1.01-3.68-.24-.38a9.92 9.92 0 01-1.52-5.28c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.13 1.03 7 2.9a9.85 9.85 0 012.9 7c0 5.46-4.45 9.97-9.92 9.97zm5.45-7.42c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07a8.16 8.16 0 01-2.4-1.48 9 9 0 01-1.66-2.07c-.17-.3-.02-.45.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01a1.1 1.1 0 00-.8.37c-.27.3-1.05 1.02-1.05 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
      </svg>
    </a>
  );
}
