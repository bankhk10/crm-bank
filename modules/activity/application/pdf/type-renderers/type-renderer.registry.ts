import type { TypePdfRenderer } from "./type-renderer.interface";
import { getWorkTypeCode } from "@/modules/activity/constants";

import { Type1PdfRenderer } from "./type-1.renderer";
import { Type2PdfRenderer } from "./type-2.renderer";
import { Type3PdfRenderer } from "./type-3.renderer";
import { Type4PdfRenderer } from "./type-4.renderer";
import { Type5PdfRenderer } from "./type-5.renderer";
import { Type6PdfRenderer } from "./type-6.renderer";
import { Type7aPdfRenderer } from "./type-7a.renderer";
import { Type7bPdfRenderer } from "./type-7b.renderer";
import { Type8PdfRenderer } from "./type-8.renderer";
import { Type9PdfRenderer } from "./type-9.renderer";
import { Type10PdfRenderer } from "./type-10.renderer";
import { Type11PdfRenderer } from "./type-11.renderer";
import { Type12PdfRenderer } from "./type-12.renderer";
import { Type13PdfRenderer } from "./type-13.renderer";
import { Type14PdfRenderer } from "./type-14.renderer";
import { DefaultTypePdfRenderer } from "./default.renderer";

export class TypeRendererRegistry {
  private static instance: TypeRendererRegistry;
  private readonly renderers = new Map<string, TypePdfRenderer>();
  private readonly fallbackRenderer: TypePdfRenderer;

  private constructor() {
    this.fallbackRenderer = new DefaultTypePdfRenderer();

    // Register all default renderers
    this.register(new Type1PdfRenderer());
    this.register(new Type2PdfRenderer());
    this.register(new Type3PdfRenderer());
    this.register(new Type4PdfRenderer());
    this.register(new Type5PdfRenderer());
    this.register(new Type6PdfRenderer());
    this.register(new Type7aPdfRenderer());
    this.register(new Type7bPdfRenderer());
    this.register(new Type8PdfRenderer());
    this.register(new Type9PdfRenderer());
    this.register(new Type10PdfRenderer());
    this.register(new Type11PdfRenderer());
    this.register(new Type12PdfRenderer());
    this.register(new Type13PdfRenderer());
    this.register(new Type14PdfRenderer());
  }

  public static getInstance(): TypeRendererRegistry {
    if (!TypeRendererRegistry.instance) {
      TypeRendererRegistry.instance = new TypeRendererRegistry();
    }
    return TypeRendererRegistry.instance;
  }

  public register(renderer: TypePdfRenderer): void {
    const code = renderer.workTypeCode.toUpperCase();
    this.renderers.set(code, renderer);
  }

  public getRenderer(codeOrName: string): TypePdfRenderer {
    if (!codeOrName) return this.fallbackRenderer;
    const resolvedCode = getWorkTypeCode(codeOrName).toUpperCase();
    return this.renderers.get(resolvedCode) || this.fallbackRenderer;
  }

  public hasRenderer(codeOrName: string): boolean {
    const resolvedCode = getWorkTypeCode(codeOrName).toUpperCase();
    return this.renderers.has(resolvedCode);
  }
}

export const typeRendererRegistry = TypeRendererRegistry.getInstance();

