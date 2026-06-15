"use server";

import { db } from "@/lib/db";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

export async function getShowProductImages() {
  try {
    const images = await db.showProductImage.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return { success: true, data: images };
  } catch (error) {
    console.error("Failed to get show product images:", error);
    return { success: false, message: "Failed to load images" };
  }
}

export async function getAllShowProductImages() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }
  try {
    const images = await db.showProductImage.findMany({
      orderBy: { order: "asc" },
    });
    return { success: true, data: images };
  } catch (error) {
    console.error("Failed to get all show product images:", error);
    return { success: false, message: "Failed to load images" };
  }
}

export async function uploadShowProductImage(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  if (!session.user.permissionKeys?.includes("menu.show_product.edit")) {
    return { success: false, message: "Forbidden: Insufficient permissions" };
  }

  // Permission check could be added here if needed

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, message: "No file provided" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "show-products");
    
    // Create directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/show-products/${filename}`;

    // Get highest order
    const lastImage = await db.showProductImage.findFirst({
      orderBy: { order: "desc" },
    });
    const order = lastImage ? lastImage.order + 1 : 0;

    const newImage = await db.showProductImage.create({
      data: {
        url,
        filename,
        order,
        title: formData.get("title") as string | null,
        description: formData.get("description") as string | null,
      },
    });

    revalidatePath("/(main)/show-product", "page");
    return { success: true, data: newImage };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, message: "Failed to upload image" };
  }
}

export async function updateShowProductImage(
  id: string,
  data: { title?: string; description?: string; order?: number; isActive?: boolean }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  if (!session.user.permissionKeys?.includes("menu.show_product.edit")) {
    return { success: false, message: "Forbidden: Insufficient permissions" };
  }

  try {
    const updated = await db.showProductImage.update({
      where: { id },
      data,
    });
    revalidatePath("/(main)/show-product", "page");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update error:", error);
    return { success: false, message: "Failed to update image details" };
  }
}

export async function updateShowProductImagesOrder(
  updates: { id: string; order: number }[]
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  if (!session.user.permissionKeys?.includes("menu.show_product.edit")) {
    return { success: false, message: "Forbidden: Insufficient permissions" };
  }

  try {
    await db.$transaction(
      updates.map((update) =>
        db.showProductImage.update({
          where: { id: update.id },
          data: { order: update.order },
        })
      )
    );
    revalidatePath("/(main)/show-product", "page");
    return { success: true };
  } catch (error) {
    console.error("Update order error:", error);
    return { success: false, message: "Failed to update order" };
  }
}

export async function deleteShowProductImage(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  if (!session.user.permissionKeys?.includes("menu.show_product.edit")) {
    return { success: false, message: "Forbidden: Insufficient permissions" };
  }

  try {
    const image = await db.showProductImage.findUnique({ where: { id } });
    if (!image) {
      return { success: false, message: "Image not found" };
    }

    // Delete file
    const filePath = path.join(process.cwd(), "public", "uploads", "show-products", image.filename);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.warn("Could not delete file, perhaps already deleted:", e);
    }

    // Delete from DB
    await db.showProductImage.delete({ where: { id } });

    revalidatePath("/(main)/show-product", "page");
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, message: "Failed to delete image" };
  }
}
