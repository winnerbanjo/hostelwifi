import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const customer = await requireCustomer();
    const { hostelId } = await request.json();
    if (!hostelId) return NextResponse.json({ error: "Hostel is required." }, { status: 400 });

    // Verify hostel exists
    const hostel = await db.hostel.findUnique({ where: { id: hostelId } });
    if (!hostel) return NextResponse.json({ error: "Selected hostel not found." }, { status: 400 });

    // Enforce once in 30 days limit
    if (customer.lastHostelChangedAt) {
      const lastChanged = new Date(customer.lastHostelChangedAt);
      const diffMs = Date.now() - lastChanged.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays < 30) {
        const remainingDays = Math.ceil(30 - diffDays);
        return NextResponse.json({
          error: `You can only change your hostel once every 30 days. Please wait ${remainingDays} more day(s).`
        }, { status: 400 });
      }
    }

    await db.customer.update({
      where: { id: customer.id },
      data: {
        hostelId,
        lastHostelChangedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 400 });
  }
}
