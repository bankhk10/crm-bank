"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  Bell,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

const myTasks = [
  {
    id: 1,
    title: "เตรียมการนำเสนอการขาย",
    deadline: "วันนี้",
    status: "pending",
    priority: "สูง",
  },
  {
    id: 2,
    title: "ติดตามลูกค้าบริษัท X",
    deadline: "พรุ่งนี้",
    status: "pending",
    priority: "ปานกลาง",
  },
  {
    id: 3,
    title: "ส่งรายงานค่าใช้จ่าย",
    deadline: "25 ธ.ค.",
    status: "done",
    priority: "ต่ำ",
  },
  {
    id: 4,
    title: "ทบทวนเป้าหมายไตรมาส 4",
    deadline: "28 ธ.ค.",
    status: "pending",
    priority: "สูง",
  },
];

const announcements = [
  {
    title: "ขอเชิญร่วมงานปาร์ตี้ประจำปี",
    date: "30 ธ.ค.",
    content: "มาร่วมเฉลิมฉลองประจำปีกับเรา!",
  },
  {
    title: "ปิดปรับปรุงระบบ",
    date: "05 ม.ค.",
    content: "เซิร์ฟเวอร์จะปิดให้บริการเป็นเวลา 2 ชั่วโมง",
  },
];

const priorityStyle: Record<string, string> = {
  สูง: "bg-red-100 text-red-700",
  ปานกลาง: "bg-amber-100 text-amber-700",
  ต่ำ: "bg-emerald-100 text-emerald-700",
};

// Product images from public/uploads/products
const productImages = [
  {
    src: "/uploads/products/p-1.jpg",
    title: "สินค้าแนะนำ 1",
    description: "คุณภาพระดับพรีเมียม",
  },
  {
    src: "/uploads/products/p-2.jpg",
    title: "สินค้าแนะนำ 2",
    description: "ราคาพิเศษสุดคุ้ม",
  },
  {
    src: "/uploads/products/p-3.jpg",
    title: "สินค้าแนะนำ 3",
    description: "ของแท้ 100%",
  },
];

function ProductCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % productImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const goToPrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + productImages.length) % productImages.length
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % productImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-2xl">
      {/* Carousel Container */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
        {/* Images */}
        {productImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentIndex
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105"
            }`}
          >
            <Image
              src={image.src}
              alt={image.title}
              fill
              className="object-cover"
              priority={index === 0}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 lg:p-16">
              <div
                className={`transform transition-all duration-700 delay-300 ${
                  index === currentIndex
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 font-semibold text-sm md:text-base uppercase tracking-wider">
                    สินค้าแนะนำ
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                  {image.title}
                </h2>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md">
                  {image.description}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 md:p-4 transition-all duration-300 hover:scale-110 group"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-white group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 md:p-4 transition-all duration-300 hover:scale-110 group"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-white group-hover:scale-110 transition-transform" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {productImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "bg-white w-12 h-3"
                  : "bg-white/50 hover:bg-white/70 w-3 h-3"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Auto-play indicator */}
        {isAutoPlaying && (
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {/* <span className="text-white text-sm font-medium">Auto</span> */}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Product Carousel */}
      <ProductCarousel />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My Tasks */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              งานของฉัน
            </CardTitle>
            <CardDescription>
              คุณมีงานที่รอดำเนินการ{" "}
              {myTasks.filter((t) => t.status !== "done").length} งาน
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {myTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between rounded-xl border bg-card p-4 transition hover:shadow-md hover:-translate-y-[1px]"
              >
                <div className="flex items-start gap-4">
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mt-0.5" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground mt-0.5" />
                  )}

                  <div>
                    <p
                      className={`font-medium leading-tight ${
                        task.status === "done"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {task.deadline}
                    </div>
                  </div>
                </div>

                <Badge
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    priorityStyle[task.priority]
                  }`}
                >
                  {task.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Performance */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                ประสิทธิภาพการทำงาน
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>การประเมินประจำเดือน</span>
                  <span className="text-muted-foreground">75%</span>
                </div>
                <Progress value={75} className="h-2 rounded-full" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>ความสำเร็จของโครงการ</span>
                  <span className="text-muted-foreground">90%</span>
                </div>
                <Progress value={90} className="h-2 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>ประกาศ</CardTitle>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-[220px] pr-4">
                <div className="space-y-4">
                  {announcements.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-3 hover:bg-muted/40 transition"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {item.date}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
