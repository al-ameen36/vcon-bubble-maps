import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

export async function POST(request: Request) {
  const vcon = await request.json();
  if (!vcon?.uuid) {
    return NextResponse.json({ message: "Missing uuid" }, { status: 400 });
  }

  try {
    await fetchMutation(api.functions.vcons.saveVcon, { vcon });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Convex saveVcon failed", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
