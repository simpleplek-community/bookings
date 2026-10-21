import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  variable: "--font-invite-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${instrumentSerif.variable} flex flex-1 flex-col`}>{children}</div>;
}
