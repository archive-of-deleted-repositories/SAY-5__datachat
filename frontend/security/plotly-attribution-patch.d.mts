import type { Plugin } from "vite";

export function patchPlotlyBundle(source: string, installedVersion: string): string;
export function plotlyAttributionPatch(): Plugin;
