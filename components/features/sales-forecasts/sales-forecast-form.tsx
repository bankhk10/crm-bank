"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { CreateSalesForecastInput } from "@/types/sales-forecast";

const monthlyDetailSchema = z.object({
  month: z.number().min(1).max(12),
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  quantity: z.number().min(1, "จำนวนต้องมากกว่า 0"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  notes: z.string().optional(),
});

const salesForecastSchema = z.object({
  year: z.number().min(2000).max(2100),
  employeeId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  notes: z.string().optional(),
  monthlyDetails: z.array(monthlyDetailSchema).min(1, "กรุณาเพิ่มรายละเอียดอย่างน้อย 1 รายการ"),
});

type SalesForecastFormData = z.infer<typeof salesForecastSchema>;

interface SalesForecastFormProps {
  initialData?: Partial<CreateSalesForecastInput>;
  employees: Array<{ id: string; name: string; employeeCode?: string | null }>;
  products: Array<{ id: string; name: string; productCode: string; unit?: string | null }>;
  customers: Array<{ id: string; name: string; customerCode: string }>;
  onSubmit: (data: CreateSalesForecastInput) => Promise<void>;
  isLoading?: boolean;
}

const MONTHS = [
  { value: 1, label: "มกราคม" },
  { value: 2, label: "กุมภาพันธ์" },
  { value: 3, label: "มีนาคม" },
  { value: 4, label: "เมษายน" },
  { value: 5, label: "พฤษภาคม" },
  { value: 6, label: "มิถุนายน" },
  { value: 7, label: "กรกฎาคม" },
  { value: 8, label: "สิงหาคม" },
  { value: 9, label: "กันยายน" },
  { value: 10, label: "ตุลาคม" },
  { value: 11, label: "พฤศจิกายน" },
  { value: 12, label: "ธันวาคม" },
];

export function SalesForecastForm({
  initialData,
  employees,
  products,
  customers,
  onSubmit,
  isLoading = false,
}: SalesForecastFormProps) {
  const [calculating, setCalculating] = useState(false);

  const form = useForm<SalesForecastFormData>({
    resolver: zodResolver(salesForecastSchema),
    defaultValues: {
      year: initialData?.year || new Date().getFullYear(),
      employeeId: initialData?.employeeId || "",
      notes: initialData?.notes || "",
      monthlyDetails: initialData?.monthlyDetails || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "monthlyDetails",
  });

  const handleSubmit = async (data: SalesForecastFormData) => {
    await onSubmit(data as CreateSalesForecastInput);
  };

  const calculateTotal = () => {
    setCalculating(true);
    const details = form.getValues("monthlyDetails");
    const total = details.reduce((sum, detail) => {
      return sum + (detail.quantity * detail.unitPrice);
    }, 0);
    setCalculating(false);
    return total;
  };

  const addMonthlyDetail = () => {
    append({
      month: 1,
      productId: "",
      customerId: "",
      quantity: 1,
      unitPrice: 0,
      notes: "",
    });
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.name}${emp.employeeCode ? ` (${emp.employeeCode})` : ""}`,
  }));

  const productOptions = products.map((prod) => ({
    value: prod.id,
    label: `${prod.name} (${prod.productCode})${prod.unit ? ` - ${prod.unit}` : ""}`,
  }));

  const customerOptions = customers.map((cust) => ({
    value: cust.id,
    label: `${cust.name} (${cust.customerCode})`,
  }));

  const monthOptions = MONTHS.map((m) => ({
    value: m.value.toString(),
    label: m.label,
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลทั่วไป</CardTitle>
            <CardDescription>กรอกข้อมูลพื้นฐานของการพยากรณ์การขาย</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ปี</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>พนักงานขาย</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกพนักงาน" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employeeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>รายละเอียดการขายรายเดือน</CardTitle>
                <CardDescription>
                  กรอกรายละเอียดการขายที่คาดการณ์ในแต่ละเดือน
                </CardDescription>
              </div>
              <Button type="button" onClick={addMonthlyDetail} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มรายการ
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ยังไม่มีรายการ กรุณาเพิ่มรายละเอียดการขาย
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          รายการที่ {index + 1}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`monthlyDetails.${index}.month`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เดือน</FormLabel>
                            <Select
                              onValueChange={(val: string) => field.onChange(parseInt(val))}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกเดือน" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {monthOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`monthlyDetails.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>สินค้า</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกสินค้า" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`monthlyDetails.${index}.customerId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ลูกค้า</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกลูกค้า" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {customerOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`monthlyDetails.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>จำนวน</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`monthlyDetails.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ราคาต่อหน่วย (บาท)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`monthlyDetails.${index}.notes`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2 lg:col-span-1">
                            <FormLabel>หมายเหตุ</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2 lg:col-span-3">
                        <div className="text-sm font-medium">
                          ยอดรวม:{" "}
                          <span className="text-blue-600">
                            {(
                              (form.watch(`monthlyDetails.${index}.quantity`) || 0) *
                              (form.watch(`monthlyDetails.${index}.unitPrice`) || 0)
                            ).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            บาท
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {fields.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>ยอดรวมทั้งหมด:</span>
                  <span className="text-blue-600">
                    {calculateTotal().toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    บาท
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
