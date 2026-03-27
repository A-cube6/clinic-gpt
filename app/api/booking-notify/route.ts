import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const raw = await req.json();

    const fullName = String(raw?.fullName ?? raw?.full_name ?? "").trim();
    const phone = String(raw?.phone ?? "").trim();
    const service = String(raw?.service ?? "").trim();
    const preferredDate = String(raw?.preferredDate ?? raw?.preferred_date ?? "").trim();
    const preferredTime = String(raw?.preferredTime ?? raw?.preferred_time ?? "").trim();
    const doctorId = String(raw?.doctorId ?? raw?.doctor_id ?? "").trim();
    const doctorName = String(raw?.doctorName ?? raw?.doctor_name ?? "").trim();

    if (!fullName) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }

    const email = process.env.FORMSUBMIT_EMAIL?.trim();
    const cc = process.env.FORMSUBMIT_CC?.trim();
    const subject = (process.env.FORMSUBMIT_SUBJECT || "New booking request").trim();

    if (!email) {
      return NextResponse.json({ error: "Missing FORMSUBMIT_EMAIL" }, { status: 500 });
    }

    const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;

    const payload: Record<string, string> = {
      name: fullName,
      phone,
      service,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      doctor_id: doctorId,
      doctor_name: doctorName,
      message: [
        "A new booking request has been submitted.",
        `Name: ${fullName}`,
        `Phone: ${phone || "—"}`,
        `Service: ${service || "—"}`,
        `Preferred date: ${preferredDate || "—"}`,
        `Preferred time: ${preferredTime || "—"}`,
        `Doctor ID: ${doctorId || "—"}`,
        `Doctor name: ${doctorName || "Any doctor"}`,
      ].join("\n"),
      _subject: subject,
      _template: "table",
      _captcha: "false",
    };

    if (cc) {
      payload._cc = cc;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const rawText = await response.text();
    let parsed: unknown = rawText;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Leave as text if FormSubmit returns plain text.
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "FormSubmit request failed",
          formsubmitStatus: response.status,
          formsubmitResponse: parsed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      formsubmitStatus: response.status,
      formsubmitResponse: parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
