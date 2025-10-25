
export type AspectRatio = '9:16' | '1:1' | '16:9' | '3:4' | '4:3';

export type ImageStyle = 'default' | '2d' | '3d' | 'ultra' | 'graphic';

export type ReferenceImageType = 'style' | 'composition' | 'content';

export type LogoSize = 512 | 100 | 60 | 40;

export type LogoBackground = 'transparent' | 'dark' | 'light' | 'color';

export interface TextElement {
    id: string;
    content: string;
    fontFamily: string;
    fontSize: number;
    color: string;
    isBold: boolean;
    isItalic: boolean;
    x: number;
    y: number;
    width?: number; // Optional: calculated for hit detection
    height?: number; // Optional: calculated for hit detection
    
    // New properties for advanced styling
    textAlign: 'left' | 'center' | 'right';
    strokeEnabled: boolean;
    strokeColor: string;
    strokeWidth: number;
    shadowEnabled: boolean;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
}

export interface CanvasState {
    textElements: TextElement[];
    imageTransform: { x: number; y: number; width: number; height: number };
    imageScale: number;
    canvasBackgroundColor: string;
    imageRotation: number;
    imageFilters: { brightness: number; contrast: number };
}

export interface SavedDesign {
    id: string;
    baseImage: string;
    canvasState: CanvasState;
    createdAt: string;
}

export interface Template {
    id: string;
    name: string;
    thumbnailUrl: string;
    prompt: string;
    aspectRatio: AspectRatio;
    style: ImageStyle;
}

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}
