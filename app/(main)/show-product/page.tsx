"use client";

import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { EditCarouselDialog } from "./_components/edit-carousel-dialog";
import { getAllShowProductImages } from "@/modules/products/server/show-product-actions";
import { ShowProductImage } from "@prisma/client";

function ProductCarousel({ images }: { images: ShowProductImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (images.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-2xl">
      {/* Carousel Container */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
        {/* Images */}
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentIndex
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105"
            }`}
          >
            <Image
              src={image.url}
              alt={image.title || "Image"}
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
                {image.title && (
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {image.title}
                  </h2>
                )}
                {image.description && (
                  <p className="text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md">
                    {image.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
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
              {images.map((_, index) => (
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
          </>
        )}

        {/* Auto-play indicator */}
        {isAutoPlaying && images.length > 1 && (
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const { allowed, isLoading, hasPermission } =
    usePermission("menu.show_product");
  const [images, setImages] = useState<ShowProductImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    getAllShowProductImages().then((res) => {
      if (mounted) {
        if (res.success && res.data) {
          setImages(res.data);
        }
        setLoadingImages(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const handleUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!isLoading && !allowed) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>คุณไม่มีสิทธิ์เข้าถึงหน้าแรก</AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeImages = images.filter((img) => img.isActive);
  const canEdit = hasPermission("menu.show_product.edit");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 md:p-8 space-y-6 md:space-y-8 rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        {canEdit && (
          <EditCarouselDialog initialImages={images} onUpdate={handleUpdate} />
        )}
      </div>

      {loadingImages ? (
        <div className="flex justify-center items-center h-64">
          กำลังโหลด...
        </div>
      ) : activeImages.length > 0 ? (
        <ProductCarousel images={activeImages} />
      ) : (
        <div className="text-center p-12 bg-white/50 rounded-2xl">
          <p className="text-muted-foreground">ไม่มีรูปภาพสินค้าแนะนำ</p>
        </div>
      )}
    </div>
  );
}
