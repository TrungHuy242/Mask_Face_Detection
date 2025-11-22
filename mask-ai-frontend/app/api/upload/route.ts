import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const formData = await req.formData();

    // forward to FastAPI
    const forwardRes = await fetch("http://localhost:8000/detect", {
        method: "POST",
        body: formData as any, // forward raw form data
    });

    const text = await forwardRes.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { text }; }

    return NextResponse.json(json);
}