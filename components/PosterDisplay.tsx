import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { TextElement, CanvasState } from '../types';
import TextTool from './TextTool';
import ColorPicker from './ColorPicker';
import { LockIcon } from './icons/LockIcon';
import { UnlockIcon } from './icons/UnlockIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { EraserIcon } from './icons/EraserIcon';
import { CropIcon } from './icons/CropIcon';
import { RotateLeftIcon } from './icons/RotateLeftIcon';
import { RotateRightIcon } from './icons/RotateRightIcon';
import { SunIcon } from './icons/SunIcon';
import { ContrastIcon } from './icons/ContrastIcon';

interface PosterDisplayProps {
    poster: string | null;
    video: string | null;
    onAddToPanel: (poster: string) => void;
    refinementPrompt: string;
    onRefinementChange: (prompt: string) => void;
    onRefine: () => void;
    onUpscale: () => void;
    onGenerateVariation: () => void;
    onInpaint: (baseImage: string, maskImage: string, inpaintPrompt?: string) => Promise<void>;
    isLoading: boolean;
    onCanvasChange: (base64: string | null) => void;
    finalCanvasImage: string | null;
    onStateChange: (state: CanvasState) => void;
    initialState?: CanvasState | null;
    onPosterUpdate: (newPoster: string) => void;
}

const TEXT_RESIZE_HANDLE_SIZE = 10;
const TEXT_RESIZE_HANDLE_PADDING = 4;

const PosterDisplay: React.FC<PosterDisplayProps> = ({ 
    poster, video, onAddToPanel, refinementPrompt, onRefinementChange, 
    onRefine, onUpscale, onGenerateVariation, onInpaint, isLoading, onCanvasChange, finalCanvasImage,
    onStateChange, initialState, onPosterUpdate
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const downloadMenuRef = useRef<HTMLDivElement>(null);
    const naturalSizeRef = useRef({ width: 1, height: 1 });
    
    // Canvas State
    const [textElements, setTextElements] = useState<TextElement[]>(() => initialState?.textElements || []);
    const [imageTransform, setImageTransform] = useState(() => initialState?.imageTransform || { x: 0, y: 0, width: 1, height: 1 });
    const [imageScale, setImageScale] = useState(() => initialState?.imageScale || 1);
    const [canvasBackgroundColor, setCanvasBackgroundColor] = useState(() => initialState?.canvasBackgroundColor || '#1F2937');
    const [imageRotation, setImageRotation] = useState(() => initialState?.imageRotation || 0);
    const [imageFilters, setImageFilters] = useState(() => initialState?.imageFilters || { brightness: 100, contrast: 100 });
    
    // Interaction State
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
    const [dragStartPos, setDragStartPos] = useState<{mouseX: number, mouseY: number, textX: number, textY: number} | null>(null);
    const [resizingState, setResizingState] = useState<{ id: string, startX: number, startY: number, startFontSize: number } | null>(null);
    const [isImageSelected, setIsImageSelected] = useState(false);
    const [imageInteraction, setImageInteraction] = useState<{ handle: string; startMouseX: number; startMouseY: number; startTransform: typeof imageTransform } | null>(null);
    const [isRatioLocked, setIsRatioLocked] = useState(true);
    const [inputWidth, setInputWidth] = useState('0');
    const [inputHeight, setInputHeight] = useState('0');
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

    // Eraser State
    const [isErasing, setIsErasing] = useState(false);
    const [eraserSize, setEraserSize] = useState(40);
    const [isDrawingOnMask, setIsDrawingOnMask] = useState(false);
    const [inpaintPrompt, setInpaintPrompt] = useState('');
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    // Crop State
    const [isCropping, setIsCropping] = useState(false);
    const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [cropStartPoint, setCropStartPoint] = useState<{ x: number; y: number } | null>(null);

    const [history, setHistory] = useState<CanvasState[]>(() => initialState ? [initialState] : []);
    const [historyIndex, setHistoryIndex] = useState(() => initialState ? 0 : -1);

    const isMediaAvailable = poster || video;
    const isVideo = !!video;

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const saveState = useCallback((overrideState: Partial<CanvasState> = {}) => {
        const currentState: CanvasState = {
            textElements,
            imageTransform,
            imageScale,
            canvasBackgroundColor,
            imageRotation,
            imageFilters
        };
        const newState = { ...currentState, ...overrideState };

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        onStateChange(newState);
    }, [textElements, imageTransform, imageScale, canvasBackgroundColor, imageRotation, imageFilters, history, historyIndex, onStateChange]);

    const restoreState = (stateToRestore: CanvasState) => {
        setTextElements(stateToRestore.textElements);
        setImageTransform(stateToRestore.imageTransform);
        setImageScale(stateToRestore.imageScale);
        setCanvasBackgroundColor(stateToRestore.canvasBackgroundColor);
        setImageRotation(stateToRestore.imageRotation);
        setImageFilters(stateToRestore.imageFilters);
    };

    const handleUndo = useCallback(() => {
        if (canUndo) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            restoreState(history[newIndex]);
        }
    }, [history, historyIndex, canUndo]);

    const handleRedo = useCallback(() => {
        if (canRedo) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            restoreState(history[newIndex]);
        }
    }, [history, historyIndex, canRedo]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if(isCropping) handleCancelCrop();
                if(isErasing) handleCancelErase();
            }
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        handleRedo();
                    } else {
                        handleUndo();
                    }
                } else if (e.key === 'y') {
                    e.preventDefault();
                    handleRedo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, isCropping, isErasing]);


    useEffect(() => {
        setInputWidth(Math.round(imageTransform.width).toString());
        setInputHeight(Math.round(imageTransform.height).toString());
    }, [imageTransform.width, imageTransform.height]);

    const getTextMetrics = (ctx: CanvasRenderingContext2D, text: TextElement) => {
        const fontWeight = text.isBold ? 'bold' : 'normal';
        const fontStyle = text.isItalic ? 'italic' : 'normal';
        ctx.font = `${fontStyle} ${fontWeight} ${text.fontSize}px ${text.fontFamily}`;
        return ctx.measureText(text.content);
    };
    
    const getTextBoundingBox = (text: TextElement, metrics: TextMetrics) => {
        let x = text.x;
        if (text.textAlign === 'center') {
            x = text.x - metrics.width / 2;
        } else if (text.textAlign === 'right') {
            x = text.x - metrics.width;
        }
        return {
            x: x,
            y: text.y,
            w: metrics.width,
            h: text.fontSize, // Using fontSize is a decent approximation for height
        };
    };

    const getTextResizeHandleRect = (text: TextElement, metrics: TextMetrics) => {
        const bbox = getTextBoundingBox(text, metrics);
        const handleX = bbox.x + bbox.w + TEXT_RESIZE_HANDLE_PADDING;
        const handleY = bbox.y + bbox.h + TEXT_RESIZE_HANDLE_PADDING;
        return {
            x: handleX - TEXT_RESIZE_HANDLE_SIZE / 2,
            y: handleY - TEXT_RESIZE_HANDLE_SIZE / 2,
            w: TEXT_RESIZE_HANDLE_SIZE,
            h: TEXT_RESIZE_HANDLE_SIZE,
        };
    };

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imageRef.current;
        if (!canvas || !ctx || !img || !img.complete) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = canvasBackgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.filter = `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%)`;

        const centerX = imageTransform.x + imageTransform.width / 2;
        const centerY = imageTransform.y + imageTransform.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(imageRotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);

        ctx.drawImage(img, imageTransform.x, imageTransform.y, imageTransform.width, imageTransform.height);
        ctx.restore();

        if (isImageSelected) {
            ctx.strokeStyle = '#06b6d4'; // cyan-500
            ctx.lineWidth = 2;
            ctx.strokeRect(imageTransform.x, imageTransform.y, imageTransform.width, imageTransform.height);
        }

        textElements.forEach(text => {
            ctx.save();
            const fontWeight = text.isBold ? 'bold' : 'normal';
            const fontStyle = text.isItalic ? 'italic' : 'normal';
            ctx.font = `${fontStyle} ${fontWeight} ${text.fontSize}px ${text.fontFamily}`;

            const metrics = ctx.measureText(text.content);
            
            if (text.shadowEnabled) {
                ctx.shadowColor = text.shadowColor;
                ctx.shadowBlur = text.shadowBlur;
                ctx.shadowOffsetX = text.shadowOffsetX;
                ctx.shadowOffsetY = text.shadowOffsetY;
            }

            ctx.textAlign = text.textAlign;
            ctx.fillStyle = text.color;
            ctx.textBaseline = 'top';
            
            ctx.fillText(text.content, text.x, text.y);
            
            if (text.strokeEnabled) {
                ctx.strokeStyle = text.strokeColor;
                ctx.lineWidth = text.strokeWidth;
                ctx.strokeText(text.content, text.x, text.y);
            }
            
            ctx.restore();

            if (text.id === selectedTextId) {
                const bbox = getTextBoundingBox(text, metrics);
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 2;
                ctx.strokeRect(bbox.x - TEXT_RESIZE_HANDLE_PADDING, bbox.y - TEXT_RESIZE_HANDLE_PADDING, bbox.w + TEXT_RESIZE_HANDLE_PADDING * 2, bbox.h + TEXT_RESIZE_HANDLE_PADDING * 2);

                const handle = getTextResizeHandleRect(text, metrics);
                ctx.fillStyle = '#06b6d4';
                ctx.fillRect(handle.x, handle.y, handle.w, handle.h);
            }
        });
        
        if (isCropping && cropRect) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (cropRect.w > 0 && cropRect.h > 0) {
              ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
            }
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
        }


        onCanvasChange(canvas.toDataURL('image/png'));
    }, [textElements, selectedTextId, onCanvasChange, imageTransform, isImageSelected, canvasBackgroundColor, imageRotation, imageFilters, isCropping, cropRect]);
    
    useEffect(() => {
        if (!poster) {
            imageRef.current = null;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageRef.current = img;
            const canvas = canvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            if (canvas && maskCanvas) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                maskCanvas.width = img.naturalWidth;
                maskCanvas.height = img.naturalHeight;
                naturalSizeRef.current = { width: img.naturalWidth, height: img.naturalHeight };
                
                if (initialState) {
                    setIsImageSelected(true);
                    drawCanvas();
                    return;
                }
                
                const initialTransform = { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
                const newInitialState: CanvasState = { 
                    textElements: [], 
                    imageTransform: initialTransform, 
                    imageScale: 1, 
                    canvasBackgroundColor, 
                    imageRotation: 0, 
                    imageFilters: { brightness: 100, contrast: 100 } 
                };
                restoreState(newInitialState);
                setSelectedTextId(null);
                setIsImageSelected(true);
                setHistory([newInitialState]);
                setHistoryIndex(0);
                onStateChange(newInitialState);
            }
        };
        img.src = poster;
    }, [poster]);

    useEffect(() => {
        if (imageRef.current && imageRef.current.complete) {
            drawCanvas();
        }
    }, [drawCanvas]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
                setIsDownloadMenuOpen(false);
            }
        };

        if (isDownloadMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDownloadMenuOpen]);


    const handleAddText = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const newText: TextElement = {
            id: Date.now().toString(),
            content: 'Sample Text',
            fontFamily: 'Roboto',
            fontSize: Math.max(48, Math.round(canvas.width / 20)),
            color: '#FFFFFF',
            isBold: false,
            isItalic: false,
            x: canvas.width / 2,
            y: canvas.height / 2 - 25,
            textAlign: 'center',
            strokeEnabled: false,
            strokeColor: '#000000',
            strokeWidth: 2,
            shadowEnabled: false,
            shadowColor: '#000000',
            shadowBlur: 5,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
        };
        const newTextElements = [...textElements, newText];
        setTextElements(newTextElements);
        setSelectedTextId(newText.id);
        setIsImageSelected(false);
        saveState({ textElements: newTextElements });
    };

    const handleUpdateText = (updatedText: TextElement) => {
        const newTextElements = textElements.map(text => text.id === updatedText.id ? updatedText : text);
        setTextElements(newTextElements);
        saveState({ textElements: newTextElements });
    };

    const handleDeleteText = (id: string) => {
        const newTextElements = textElements.filter(text => text.id !== id);
        setTextElements(newTextElements);
        setSelectedTextId(null);
        saveState({ textElements: newTextElements });
    };

    const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };
    
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const mainCanvas = canvasRef.current;
        if (!mainCanvas) return;
        const { x: mouseX, y: mouseY } = getMousePos(e, mainCanvas);

        if (isCropping) {
            setCropStartPoint({ x: mouseX, y: mouseY });
            setCropRect({ x: mouseX, y: mouseY, w: 0, h: 0 });
            return;
        }

        if (isErasing) {
            setIsDrawingOnMask(true);
            lastPointRef.current = { x: mouseX, y: mouseY };
            return;
        }

        const ctx = mainCanvas.getContext('2d');
        if (!ctx) return;
        
        if (selectedTextId) {
            const selectedText = textElements.find(t => t.id === selectedTextId);
            if (selectedText) {
                const metrics = getTextMetrics(ctx, selectedText);
                const handle = getTextResizeHandleRect(selectedText, metrics);
                if (mouseX >= handle.x && mouseX <= handle.x + handle.w && mouseY >= handle.y && mouseY <= handle.y + handle.h) {
                    setResizingState({ id: selectedTextId, startX: mouseX, startY: mouseY, startFontSize: selectedText.fontSize });
                    return;
                }
            }
        }
        
        let clickedOnText = false;
        for (let i = textElements.length - 1; i >= 0; i--) {
            const text = textElements[i];
            const metrics = getTextMetrics(ctx, text);
            const bbox = getTextBoundingBox(text, metrics);
            if (mouseX >= bbox.x && mouseX <= bbox.x + bbox.w && mouseY >= bbox.y && mouseY <= bbox.y + bbox.h) {
                setSelectedTextId(text.id);
                setDraggingTextId(text.id);
                setDragStartPos({ mouseX, mouseY, textX: text.x, textY: text.y });
                setIsImageSelected(false);
                clickedOnText = true;
                break;
            }
        }
        if (clickedOnText) return;

        if (poster) {
            const { x, y, width, height } = imageTransform;
            if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
                setSelectedTextId(null);
                setIsImageSelected(true);
                setImageInteraction({ handle: 'drag', startMouseX: mouseX, startMouseY: mouseY, startTransform: { ...imageTransform } });
                return;
            }
        }

        setSelectedTextId(null);
        setIsImageSelected(false);
    };
    
    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { x: mouseX, y: mouseY } = getMousePos(e, canvas);

        if (isCropping && cropStartPoint) {
            const newX = Math.min(mouseX, cropStartPoint.x);
            const newY = Math.min(mouseY, cropStartPoint.y);
            const newW = Math.abs(mouseX - cropStartPoint.x);
            const newH = Math.abs(mouseY - cropStartPoint.y);
            setCropRect({ x: newX, y: newY, w: newW, h: newH });
            return;
        }

        if (isErasing && isDrawingOnMask) {
            const maskCanvas = maskCanvasRef.current;
            const maskCtx = maskCanvas?.getContext('2d');
            if (maskCtx && lastPointRef.current) {
                maskCtx.beginPath();
                maskCtx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
                maskCtx.lineTo(mouseX, mouseY);
                maskCtx.strokeStyle = 'white';
                maskCtx.lineWidth = eraserSize;
                maskCtx.lineCap = 'round';
                maskCtx.lineJoin = 'round';
                maskCtx.stroke();
                lastPointRef.current = { x: mouseX, y: mouseY };
            }
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (imageInteraction?.handle === 'drag') {
            const dx = mouseX - imageInteraction.startMouseX;
            const dy = mouseY - imageInteraction.startMouseY;
            const { startTransform } = imageInteraction;
            setImageTransform({ ...imageTransform, x: startTransform.x + dx, y: startTransform.y + dy });
            return;
        }

        if (resizingState) {
            const dx = mouseX - resizingState.startX;
            const newSize = Math.max(8, Math.round(resizingState.startFontSize + dx * 0.5));
            setTextElements(prev => prev.map(text => text.id === resizingState.id ? { ...text, fontSize: newSize } : text));
            return;
        }

        if (draggingTextId && dragStartPos) {
            const dx = mouseX - dragStartPos.mouseX;
            const dy = mouseY - dragStartPos.mouseY;
            setTextElements(prev => prev.map(text => text.id === draggingTextId ? { ...text, x: dragStartPos.textX + dx, y: dragStartPos.textY + dy } : text));
            return;
        }
    };

    const handleCanvasMouseUp = () => {
        if (isCropping) {
            setCropStartPoint(null);
            return;
        }
        if (isErasing) {
            setIsDrawingOnMask(false);
            lastPointRef.current = null;
            return;
        }
        if (draggingTextId || resizingState || imageInteraction) {
            saveState();
        }
        setDraggingTextId(null);
        setDragStartPos(null);
        setResizingState(null);
        setImageInteraction(null);
        if (canvasRef.current) {
            onCanvasChange(canvasRef.current.toDataURL('image/png'));
        }
    };
    
    const clearMask = useCallback(() => {
        const maskCanvas = maskCanvasRef.current;
        const maskCtx = maskCanvas?.getContext('2d');
        if (maskCanvas && maskCtx) {
            maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        }
    }, []);

    const handleCancelErase = useCallback(() => {
        clearMask();
        setIsErasing(false);
        setInpaintPrompt('');
    }, [clearMask]);

    const handleApplyErase = async () => {
        if (!finalCanvasImage) return;
        const maskCanvas = maskCanvasRef.current;
        if (!maskCanvas) return;
        
        const maskDataUrl = maskCanvas.toDataURL('image/png');
        await onInpaint(finalCanvasImage, maskDataUrl, inpaintPrompt);
        handleCancelErase();
    };

    const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScale = parseFloat(e.target.value);
        const { width: naturalWidth, height: naturalHeight } = naturalSizeRef.current;
        
        const centerX = imageTransform.x + imageTransform.width / 2;
        const centerY = imageTransform.y + imageTransform.height / 2;
        
        const newWidth = naturalWidth * newScale;
        const newHeight = naturalHeight * newScale;
        
        const newX = centerX - newWidth / 2;
        const newY = centerY - newHeight / 2;

        const newTransform = { x: newX, y: newY, width: newWidth, height: newHeight };
        setImageScale(newScale);
        setImageTransform(newTransform);
        saveState({ imageScale: newScale, imageTransform: newTransform });
    };
    
    const handleResetTransform = () => {
        const { width: naturalWidth, height: naturalHeight } = naturalSizeRef.current;
        const newScale = 1;
        const newTransform = { x: 0, y: 0, width: naturalWidth, height: naturalHeight };
        setImageScale(newScale);
        setImageTransform(newTransform);
        saveState({ imageScale: newScale, imageTransform: newTransform });
    };

    const handleDimensionCommit = (axis: 'width' | 'height') => {
        const value = axis === 'width' ? inputWidth : inputHeight;
        const newDim = parseInt(value, 10);

        if (isNaN(newDim) || newDim <= 0) {
            setInputWidth(Math.round(imageTransform.width).toString());
            setInputHeight(Math.round(imageTransform.height).toString());
            return;
        }

        const { width: naturalWidth, height: naturalHeight } = naturalSizeRef.current;
        const aspectRatio = naturalWidth / naturalHeight;

        let newWidth, newHeight;

        if (isRatioLocked) {
            if (axis === 'width') {
                newWidth = newDim;
                newHeight = newDim / aspectRatio;
            } else { // axis === 'height'
                newHeight = newDim;
                newWidth = newDim * aspectRatio;
            }
        } else {
            newWidth = axis === 'width' ? newDim : imageTransform.width;
            newHeight = axis === 'height' ? newDim : imageTransform.height;
        }

        const centerX = imageTransform.x + imageTransform.width / 2;
        const centerY = imageTransform.y + imageTransform.height / 2;
        const newX = centerX - newWidth / 2;
        const newY = centerY - newHeight / 2;
        
        const newScale = newWidth / naturalWidth;
        const newTransform = { x: newX, y: newY, width: newWidth, height: newHeight };
        setImageTransform(newTransform);
        setImageScale(newScale);
        saveState({ imageTransform: newTransform, imageScale: newScale });
    };

    const handleDimensionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, axis: 'width' | 'height') => {
        if (e.key === 'Enter') {
            handleDimensionCommit(axis);
            e.currentTarget.blur();
        }
    };
    
    const handleDownloadVideo = () => {
        if (!video) return;
        const link = document.createElement('a');
        link.href = video;
        link.download = `ai-animation-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadImage = (format: 'png' | 'jpeg' | 'webp') => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const mimeType = `image/${format}`;
        const quality = format === 'png' ? undefined : 0.92;
        const href = canvas.toDataURL(mimeType, quality);
        
        const link = document.createElement('a');
        link.href = href;
        
        const extension = format === 'jpeg' ? 'jpg' : format;
        link.download = `ai-poster-${Date.now()}.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloadMenuOpen(false);
    };

    const handleBackgroundColorChange = (newColor: string) => {
        setCanvasBackgroundColor(newColor);
        saveState({ canvasBackgroundColor: newColor });
    };

    const handleRotate = (degrees: number) => {
        const newRotation = (imageRotation + degrees) % 360;
        setImageRotation(newRotation);
        saveState({ imageRotation: newRotation });
    };

    const handleFilterChange = (filter: 'brightness' | 'contrast', value: number) => {
        const newFilters = { ...imageFilters, [filter]: value };
        setImageFilters(newFilters);
        // Defer saving state to mouse up to avoid too many history entries
    };

    const handleResetAdjustments = () => {
        const newRotation = 0;
        const newFilters = { brightness: 100, contrast: 100 };
        setImageRotation(newRotation);
        setImageFilters(newFilters);
        saveState({ imageRotation: newRotation, imageFilters: newFilters });
    };

    const handleStartCrop = () => setIsCropping(true);
    const handleCancelCrop = () => {
        setIsCropping(false);
        setCropRect(null);
        setCropStartPoint(null);
    };
    const handleApplyCrop = () => {
        const canvas = canvasRef.current;
        if (!canvas || !cropRect || cropRect.w === 0 || cropRect.h === 0) {
            handleCancelCrop();
            return;
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropRect.w;
        tempCanvas.height = cropRect.h;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.drawImage(
            canvas,
            cropRect.x, cropRect.y, cropRect.w, cropRect.h,
            0, 0, cropRect.w, cropRect.h
        );

        const newDataUrl = tempCanvas.toDataURL('image/png');
        onPosterUpdate(newDataUrl);
        handleCancelCrop();
    };


    const selectedText = textElements.find(t => t.id === selectedTextId);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 bg-gray-900/50 rounded-lg flex items-center justify-center p-4 border border-gray-700 min-h-[300px] xl:min-h-0 overflow-hidden relative">
                {video ? (
                    <video
                        src={video}
                        controls
                        className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                        autoPlay
                        loop
                        playsInline
                    />
                ) : poster ? (
                    <div className="relative max-w-full max-h-full" style={{ cursor: isCropping ? 'crosshair' : (isErasing ? 'crosshair' : 'default') }}>
                        <canvas 
                            ref={canvasRef}
                            className="max-w-full max-h-full object-contain rounded-md shadow-lg block"
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                        />
                        <canvas
                            ref={maskCanvasRef}
                            className="absolute top-0 left-0 max-w-full max-h-full object-contain rounded-md shadow-lg opacity-50"
                            style={{ pointerEvents: isErasing ? 'auto' : 'none' }}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                        />
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <MagicWandIcon className="mx-auto h-12 w-12" />
                        <p className="mt-2">Your generated image or animation will appear here.</p>
                    </div>
                )}
            </div>
            {isMediaAvailable && (
                <div className="mt-6 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {isVideo ? (
                             <button
                                onClick={handleDownloadVideo}
                                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                            >
                                <DownloadIcon />
                                Download Video
                            </button>
                        ) : (
                            <div className="relative w-full sm:w-auto flex-1" ref={downloadMenuRef}>
                                <button
                                    onClick={() => setIsDownloadMenuOpen(prev => !prev)}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                                >
                                    <DownloadIcon />
                                    Download
                                </button>
                                {isDownloadMenuOpen && (
                                    <div className="absolute bottom-full mb-2 w-full bg-gray-600 rounded-lg shadow-xl z-10 text-white">
                                        <button onClick={() => handleDownloadImage('png')} className="w-full text-left px-4 py-2 hover:bg-gray-500 rounded-t-lg text-sm font-semibold">as PNG</button>
                                        <button onClick={() => handleDownloadImage('jpeg')} className="w-full text-left px-4 py-2 hover:bg-gray-500 text-sm font-semibold">as JPG</button>
                                        <button onClick={() => handleDownloadImage('webp')} className="w-full text-left px-4 py-2 hover:bg-gray-500 rounded-b-lg text-sm font-semibold">as WebP</button>
                                    </div>
                                )}
                            </div>
                        )}
                         {!isVideo && (
                           <>
                                <button
                                    onClick={onUpscale}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SparkleIcon />
                                    Upscale
                                </button>
                                <button
                                    onClick={onGenerateVariation}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshIcon />
                                    Variation
                                </button>
                           </>
                        )}
                    </div>
                     {!isVideo && (
                        <>
                            <div className="space-y-2">
                                <label htmlFor="refine" className="block text-sm font-medium text-gray-400">Edit with a text prompt</label>
                                <textarea
                                    id="refine"
                                    rows={2}
                                    value={refinementPrompt}
                                    onChange={(e) => onRefinementChange(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                    placeholder="e.g., Change the background to a sunny beach, add a lens flare..."
                                />
                                <button
                                    onClick={onRefine}
                                    disabled={!refinementPrompt || isLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MagicWandIcon />
                                    Apply Text Edit
                                </button>
                            </div>
                            
                            <div className="border-t border-gray-700 pt-4 mt-2 space-y-4">
                                <div className="flex items-center justify-between gap-4 border-b border-gray-700 pb-4 mb-4">
                                     <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleUndo}
                                            disabled={!canUndo || isErasing || isCropping}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg transition-colors hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Undo"
                                        >
                                            <UndoIcon />
                                            Undo
                                        </button>
                                        <button
                                            onClick={handleRedo}
                                            disabled={!canRedo || isErasing || isCropping}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg transition-colors hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Redo"
                                        >
                                            <RedoIcon />
                                            Redo
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setIsErasing(prev => !prev)}
                                        disabled={isCropping}
                                        className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isErasing ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    >
                                        <EraserIcon />
                                        {isErasing ? 'Cancel' : 'Erase / Fill'}
                                    </button>
                                </div>

                                {isCropping ? (
                                    <div className="p-3 bg-gray-900/50 rounded-lg border border-cyan-500/50 space-y-3 text-center">
                                         <p className="text-sm text-cyan-300 font-semibold">Draw a rectangle on the image to crop.</p>
                                        <div className="flex gap-4">
                                            <button onClick={handleApplyCrop} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">Apply Crop</button>
                                            <button onClick={handleCancelCrop} className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                                        </div>
                                    </div>
                                ) : isErasing ? (
                                    <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 space-y-4">
                                        <p className="text-sm text-gray-300 text-center font-semibold">Erase & Inpaint Tool</p>
                                        <p className="text-xs text-gray-400 text-center -mt-3 pb-2">Paint over areas to remove or replace.</p>

                                        <div>
                                            <label htmlFor="eraser-size" className="text-sm font-medium text-gray-300">
                                                Brush Size: {eraserSize}px
                                            </label>
                                            <input
                                                type="range"
                                                id="eraser-size"
                                                min="5"
                                                max="150"
                                                step="1"
                                                value={eraserSize}
                                                onChange={(e) => setEraserSize(parseInt(e.target.value, 10))}
                                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb mt-1"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="inpaint-prompt" className="text-sm font-medium text-gray-300">Generative Fill Prompt (Optional)</label>
                                            <input
                                                type="text"
                                                id="inpaint-prompt"
                                                value={inpaintPrompt}
                                                onChange={(e) => setInpaintPrompt(e.target.value)}
                                                placeholder="e.g., a field of flowers"
                                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 text-sm focus:ring-1 focus:ring-cyan-500 mt-1"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Leave blank to remove objects and fill with background.</p>
                                        </div>
                                        
                                        <button
                                            onClick={handleApplyErase}
                                            disabled={isLoading}
                                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <MagicWandIcon />
                                            {inpaintPrompt ? 'Apply Generative Fill' : 'Apply Removal'}
                                        </button>
                                    </div>
                                ) : (
                                 <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-semibold text-cyan-400">Image Adjustments</h3>
                                            <button onClick={handleResetAdjustments} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Reset</button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button onClick={handleStartCrop} className="flex flex-col items-center justify-center gap-1 text-sm py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"><CropIcon /> Crop</button>
                                            <button onClick={() => handleRotate(-90)} className="flex flex-col items-center justify-center gap-1 text-sm py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"><RotateLeftIcon /> Left</button>
                                            <button onClick={() => handleRotate(90)} className="flex flex-col items-center justify-center gap-1 text-sm py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"><RotateRightIcon /> Right</button>
                                        </div>
                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label htmlFor="brightness" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><SunIcon/> Brightness: {imageFilters.brightness - 100}</label>
                                                <input id="brightness" type="range" min="0" max="200" value={imageFilters.brightness} onChange={(e) => handleFilterChange('brightness', parseInt(e.target.value))} onMouseUp={saveState} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
                                            </div>
                                            <div>
                                                <label htmlFor="contrast" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><ContrastIcon/> Contrast: {imageFilters.contrast - 100}</label>
                                                <input id="contrast" type="range" min="0" max="200" value={imageFilters.contrast} onChange={(e) => handleFilterChange('contrast', parseInt(e.target.value))} onMouseUp={saveState} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-700 pt-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-semibold text-cyan-400">Canvas & Image</h3>
                                            <button
                                                onClick={() => setIsImageSelected(prev => !prev)}
                                                disabled={!poster}
                                                className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isImageSelected ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                                            >
                                                {isImageSelected ? 'Image Selected' : 'Select Image'}
                                            </button>
                                        </div>
                                        <div className="mt-3">
                                            <ColorPicker 
                                                label="Background"
                                                id="canvas-bg"
                                                color={canvasBackgroundColor}
                                                onChange={handleBackgroundColorChange}
                                            />
                                        </div>
                                        {isImageSelected && poster && (
                                            <div className="mt-4 space-y-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                                <div className="flex items-center justify-between">
                                                    <label htmlFor="image-scale" className="text-sm font-medium text-gray-300">
                                                        Image Scale
                                                    </label>
                                                    <button 
                                                        onClick={handleResetTransform}
                                                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                                <input
                                                    type="range"
                                                    id="image-scale"
                                                    min="0.1"
                                                    max="3"
                                                    step="0.01"
                                                    value={imageScale}
                                                    onChange={handleScaleChange}
                                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
                                                />
                                                <div className="pt-2">
                                                    <label className="text-sm font-medium text-gray-300">Image Dimensions</label>
                                                    <div className="grid grid-cols-5 items-center gap-2 mt-1">
                                                        <div className="col-span-2">
                                                            <div className="relative">
                                                                <input type="number" value={inputWidth} onChange={(e) => setInputWidth(e.target.value)} onBlur={() => handleDimensionCommit('width')} onKeyDown={(e) => handleDimensionKeyDown(e, 'width')} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 text-center text-sm focus:ring-1 focus:ring-cyan-500" />
                                                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500">W</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1 justify-self-center">
                                                            <button onClick={() => setIsRatioLocked(prev => !prev)} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-cyan-400 transition-colors">
                                                                {isRatioLocked ? <LockIcon /> : <UnlockIcon />}
                                                            </button>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <div className="relative">
                                                            <input type="number" value={inputHeight} onChange={(e) => setInputHeight(e.target.value)} onBlur={() => handleDimensionCommit('height')} onKeyDown={(e) => handleDimensionKeyDown(e, 'height')} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 text-center text-sm focus:ring-1 focus:ring-cyan-500" />
                                                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500">H</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-gray-700 pt-4">
                                        {selectedText ? (
                                            <TextTool 
                                                textElement={selectedText} 
                                                onUpdate={handleUpdateText}
                                                onDelete={handleDeleteText}
                                            />
                                        ) : (
                                            <button
                                                onClick={handleAddText}
                                                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
                                            >
                                                Add Text
                                            </button>
                                        )}
                                    </div>
                                </>
                                )}
                            </div>
                            
                            <p className="text-xs text-gray-500 text-center">Drag your final creation to the panel on the left to save it.</p>
                        </>
                     )}
                </div>
            )}
        </div>
    );
};

export default PosterDisplay;
