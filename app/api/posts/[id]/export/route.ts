import { NextRequest, NextResponse } from "next/server";
import { getProperty, listBookings } from "@/lib/firebase";

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// Helper to construct a Date at a specific hour/minute in SAST (UTC+2) timezone
function setTimeInSast(date: Date, hours: number, minutes: number): Date {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const isoStr = `${year}-${month}-${day}T${hh}:${mm}:00+02:00`;
  return new Date(isoStr);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await getProperty(id);
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const bookings = await listBookings(id);
    const activeBookings = bookings.filter(
      (b: any) => b.paymentStatus !== "failed" && b.paymentStatus !== "refunded"
    );

    const isHourly = property.bookingType === "hourly";

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//Simpleplek//Property Export ${id}//EN`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    for (const booking of activeBookings) {
      let start = new Date(booking.fromDate);
      let end = new Date(booking.toDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

      if (!isHourly) {
        start = setTimeInSast(start, 14, 0); // Check-in at 14:00 SAST (12:00 UTC)
        end = setTimeInSast(end, 10, 0); // Check-out at 10:00 SAST (08:00 UTC)
      }

      icsLines.push("BEGIN:VEVENT");
      icsLines.push(`UID:booking-${booking.id}@simpleplek.co.za`);
      icsLines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
      icsLines.push(`DTSTART:${formatIcsDate(start)}`);
      icsLines.push(`DTEND:${formatIcsDate(end)}`);
      icsLines.push("SUMMARY:Booked");
      icsLines.push(`DESCRIPTION:Booking Reference: ${booking.id}\\nProperty: ${property.title || "Stay"}`);
      icsLines.push(`LOCATION:${property.location || property.title || "South Africa"}`);
      icsLines.push("STATUS:CONFIRMED");
      icsLines.push("TRANSP:OPAQUE");
      icsLines.push("END:VEVENT");
    }

    icsLines.push("END:VCALENDAR");

    const icsContent = icsLines.join("\r\n");

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="property-${id}.ics"`,
      },
    });
  } catch (err: any) {
    console.error("GET /api/posts/[id]/export error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
