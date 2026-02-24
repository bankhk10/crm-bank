"use client";

/**
 * Product Detail Modal Component
 * Shows product details including free items and promotions
 */

import React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProductDetailModalProps } from "../../../types";

export function ProductDetailModal({
    product,
    onClose,
}: ProductDetailModalProps) {
    if (!product) return null;

    return (
        <Dialog open={!!product} onOpenChange={() => onClose()}>
            <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-2xl">
                <DialogHeader className="contents space-y-0 text-left">
                    <ScrollArea className="flex max-h-full flex-col overflow-hidden">
                        <DialogTitle className="px-6 pt-6 text-xl font-semibold">
                            รายละเอียดสินค้า
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="p-6">
                                <p className="text-sm text-muted-foreground mb-4">
                                    {product.name} ({product.productCode})
                                </p>
                                <div className="space-y-6">
                                    {/* Free Items */}
                                    <div>
                                        <h4 className="font-medium text-lg mb-3">รายการของแถม</h4>
                                        {product.freeItems && product.freeItems.length > 0 ? (
                                            <div className="space-y-2">
                                                {product.freeItems.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="font-medium">
                                                                    ซื้อ {item.purchaseQty} แถม {item.freeQty}
                                                                </span>
                                                                {item.netPrice && (
                                                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                                        (ราคาสุทธิ: ฿
                                                                        {Number(item.netPrice).toLocaleString()})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {item.notes && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                หมายเหตุ: {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                                                ไม่มีรายการของแถม
                                            </p>
                                        )}
                                    </div>

                                    {/* Promotion Items */}
                                    <div>
                                        <h4 className="font-medium text-lg mb-3">
                                            รายการส่งเสริมการขาย
                                        </h4>
                                        {product.promotionItems &&
                                            product.promotionItems.length > 0 ? (
                                            <div className="space-y-2">
                                                {product.promotionItems.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="font-medium">{item.name}</span>
                                                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                                    - คงเหลือ {item.quantity} ชิ้น
                                                                </span>
                                                                {item.price && (
                                                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                                        (ราคา: ฿
                                                                        {Number(item.price).toLocaleString()})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {item.notes && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                หมายเหตุ: {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                                                ไม่มีรายการส่งเสริมการขาย
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DialogDescription>
                    </ScrollArea>
                </DialogHeader>
                <DialogFooter
                    sticky
                    className="flex-row items-center justify-end px-6 py-4"
                >
                    <DialogClose asChild>
                        <Button variant="outline">ปิด</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ProductDetailModal;
