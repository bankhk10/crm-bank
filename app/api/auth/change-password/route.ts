import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { logPasswordChange } from "@/modules/auth/infrastructure/auth-logging";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { message: "ยังไม่ได้เข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้งาน" },
        { status: 404 }
      );
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isPasswordValid = await compare(currentPassword, user.password);

    if (!isPasswordValid) {
      // บันทึก log กรณีที่เปลี่ยนรหัสผ่านไม่สำเร็จเนื่องจากรหัสผ่านเดิมผิด
      await logPasswordChange(user.id, user.email, false, "รหัสผ่านปัจจุบันไม่ถูกต้อง");
      
      return NextResponse.json(
        { message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await hash(newPassword, 12);

    // อัปเดตรหัสผ่านใหม่ในระบบ
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // บันทึก log เหตุการณ์การเปลี่ยนรหัสผ่าน (สำเร็จ) โดยไม่มีการเก็บรหัสผ่านเป็น plain text
    await logPasswordChange(user.id, user.email, true);

    return NextResponse.json(
      { message: "เปลี่ยนรหัสผ่านสำเร็จ" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
