import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { getShowProductImages } from "@/modules/products/server/show-product-actions";

interface CarouselImage {
  src: string;
  title: string | null;
  description: string | null;
}

// Fallback product images from public/images/products
const fallbackImages: CarouselImage[] = [
  {
    src: "/images/products/p-1.jpg",
    title: "สินค้าแนะนำ 1",
    description: "คุณภาพระดับพรีเมียม",
  },
  {
    src: "/images/products/p-2.jpg",
    title: "สินค้าแนะนำ 2",
    description: "ราคาพิเศษสุดคุ้ม",
  },
  {
    src: "/images/products/p-3.jpg",
    title: "สินค้าแนะนำ 3",
    description: "ของแท้ 100%",
  },
];

export function ProductCarousel() {
  const [images, setImages] = useState<CarouselImage[]>(fallbackImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    let mounted = true;
    getShowProductImages().then((res) => {
      if (mounted) {
        if (res.success && res.data && res.data.length > 0) {
          const mapped = res.data.map((img) => ({
            src: img.url,
            title: img.title,
            description: img.description,
          }));
          setImages(mapped);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

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
    setCurrentIndex(
      (prev) => (prev - 1 + images.length) % images.length
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-2xl">
      {/* Carousel Container */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
        {/* Images */}
        {images.map((image, index) => (
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
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
