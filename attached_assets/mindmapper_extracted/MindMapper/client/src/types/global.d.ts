declare module 'culori' {
  export interface OKLCHColor {
    l: number;
    c: number;
    h: number;
  }
  
  export function oklch(color: OKLCHColor): any;
  export function formatCss(color: any): string;
  export const converter: any;
}

declare module 'd3-force-3d' {
  export function forceSimulation(nodes?: any[]): any;
  export function forceLink(links?: any[]): any;
  export function forceManyBody(): any;
  export function forceCenter(x?: number, y?: number, z?: number): any;
  export function forceCollide(): any;
}

declare module 'troika-three-text' {
  export class Text {
    constructor();
    text: string;
    fontSize: number;
    color: string | number;
    anchorX: string;
    anchorY: string;
    outlineWidth: number;
    outlineColor: string;
    position: [number, number, number];
    sync(): void;
  }
}