import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

export default function ManualDetailView() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <Card>
        <CardContent className="p-4 md:p-6">
          <Image
            src="/images/manual.png"
            alt="คู่มือการเพิ่ม CS ONE"
            width={1200}
            height={1800}
            className="w-full rounded-lg"
          />

          <div className="mt-6 flex justify-center">
            <a
              href="https://docs.google.com/document/d/1Jo8RL9S1fwIqEJQc0xASSLnZp8ElkQ8J7G1T9NvGqkc/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-white transition hover:bg-green-700"
            >
              📖 ดูคู่มือทั้งหมด
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
