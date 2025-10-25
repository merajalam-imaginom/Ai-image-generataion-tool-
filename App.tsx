import React, { useState, useCallback, useMemo, useRef } from 'react';
import { AspectRatio, ImageStyle, Template, LogoSize, LogoBackground, ReferenceImageType, CanvasState, SavedDesign } from './types';
import { toBase64 } from './utils/fileUtils';
import { removeBackground, generateBackgroundImage, refinePoster, upscalePoster, generateImageFromPrompt, generateCharacterSheet, generateVideo, editImage, generateLogo, inpaintImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import AspectRatioSelector from './components/AspectRatioSelector';
import ConceptInput from './components/ConceptInput';
import PosterDisplay from './components/PosterDisplay';
import FinalPosterPanel from './components/FinalPosterPanel';
import Loader from './components/Loader';
import { MagicWandIcon } from './components/icons/MagicWandIcon';
import CharacterGenerator from './components/CharacterGenerator';
import StyleSelector from './components/StyleSelector';
import { UploadIcon } from './components/icons/UploadIcon';
import TemplateSelector from './components/TemplateSelector';
import { templates } from './templates';
import LogoGenerator from './components/LogoGenerator';
import { SaveIcon } from './components/icons/SaveIcon';
import { LoadIcon } from './components/icons/LoadIcon';
import { useToast } from './components/ToastProvider';

type Mode = 'product' | 'character' | 'thumbnail' | 'video' | 'edit' | 'logo';

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    console.error(error);
    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted') || errorMessage.includes('quota')) {
            return 'API Quota Exceeded: You have made too many requests today. Please check your plan and billing details, or try again later.';
        }
        try {
            const parsed = JSON.parse(error.message);
            if (parsed.error && parsed.error.message) {
                return `An API error occurred: ${parsed.error.message}`;
            }
        } catch (e) {
            // Not a JSON string, so just use the raw message.
        }
        return `An error occurred: ${error.message}`;
    }
    return defaultMessage;
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>('product');
    const [productImage, setProductImage] = useState<string | null>(null);
    const [productImageNoBg, setProductImageNoBg] = useState<string | null>(null);
    const [characterDescription, setCharacterDescription] = useState('');
    const [characterSheet, setCharacterSheet] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
    const [imageStyle, setImageStyle] = useState<ImageStyle>('default');
    const [concept, setConcept] = useState<string>('');
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [referenceImageType, setReferenceImageType] = useState<ReferenceImageType>('style');
    const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [finalPosters, setFinalPosters] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [currentCanvasImage, setCurrentCanvasImage] = useState<string | null>(null);

    // State for the new Edit mode
    const [editableImage, setEditableImage] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // State for Logo mode
    const [logoConcept, setLogoConcept] = useState('');
    const [logoSize, setLogoSize] = useState<LogoSize>(512);
    const [logoBackground, setLogoBackground] = useState<LogoBackground>('transparent');
    const [logoBackgroundColor, setLogoBackgroundColor] = useState('#ffffff');

    // State for Save/Load functionality
    const [currentCanvasState, setCurrentCanvasState] = useState<CanvasState | null>(null);
    const [initialCanvasState, setInitialCanvasState] = useState<CanvasState | null>(null);
    const [posterDisplayKey, setPosterDisplayKey] = useState(Date.now());
    
    const toast = useToast();


    const handleModeChange = (newMode: Mode) => {
        if (mode === newMode) return;
        setMode(newMode);
        setError(null);
        setGeneratedPoster(null);
        setGeneratedVideo(null);
        setCurrentCanvasImage(null);
        setInitialCanvasState(null); // Clear loaded state on mode change
        setConcept('');
        setLogoConcept('');
        setReferenceImage(null);
        setReferenceImageType('style');
        setImageStyle('default');
        setEditableImage(null);
        setEditPrompt('');

        if (newMode !== 'character') {
            setCharacterDescription('');
            setCharacterSheet(null);
        }
        if (newMode !== 'product') {
            setProductImage(null);
            setProductImageNoBg(null);
        }
    };

    const handleImageUpload = useCallback(async (file: File) => {
        setError(null);
        setGeneratedPoster(null);
        setProductImageNoBg(null);
        setInitialCanvasState(null);
        setIsLoading(true);
        setLoadingMessage('Uploading and processing product image...');
        try {
            const base64Image = await toBase64(file);
            setProductImage(base64Image);

            setLoadingMessage('Removing background...');
            const imageWithoutBg = await removeBackground(base64Image);
            setProductImageNoBg(imageWithoutBg);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to process image. Please try another one.'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, []);
    
    const handleReferenceImageUpload = (base64: string | null) => {
        setReferenceImage(base64);
        if (!base64) {
            setReferenceImageType('style');
        }
    };

    const handleEditableImageUpload = useCallback(async (file: File) => {
        setError(null);
        setGeneratedPoster(null);
        setInitialCanvasState(null);
        setEditPrompt('');
        setIsLoading(true);
        setLoadingMessage('Uploading image...');
        try {
            const base64Image = await toBase64(file);
            setEditableImage(base64Image);
            setGeneratedPoster(base64Image); // Set for immediate display and as the first image to edit
        } catch (err) {
            console.error(err);
            setError('Failed to load image. Please try another one.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, []);
    
    const handleGenerateCharacter = useCallback(async () => {
        if (!characterDescription) {
            setError('Please provide a character description.');
            return;
        }
        setError(null);
        setGeneratedPoster(null);
        setInitialCanvasState(null);
        setIsLoading(true);
        setLoadingMessage('Creating your character...');
        try {
            const sheet = await generateCharacterSheet(characterDescription);
            setCharacterSheet(sheet);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to generate character. Please try again.'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [characterDescription]);

    const handleGenerateVideo = useCallback(async () => {
        if (!concept) {
            setError('Please provide a concept for the animation.');
            return;
        }
        setError(null);
        setGeneratedPoster(null);
        setGeneratedVideo(null);
        setInitialCanvasState(null);
        setIsLoading(true);
        setLoadingMessage('Animating your vision... This can take several minutes.');
        try {
            const videoUrl = await generateVideo(concept);
            setGeneratedVideo(videoUrl);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to generate animation. Please try again.'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [concept]);

    const handleGeneratePoster = useCallback(async (isVariation = false) => {
        if (!concept) {
            setError('Please provide a concept for the scene.');
            return;
        }

        const foregroundImageSrc = mode === 'product' ? productImageNoBg : (mode === 'character' ? characterSheet : null);

        setError(null);
        setGeneratedPoster(null);
        setCurrentCanvasImage(null);
        setGeneratedVideo(null);
        setInitialCanvasState(null);
        setIsLoading(true);

        try {
            let finalPoster: string;
            const currentMode = mode as 'product' | 'character' | 'thumbnail';
            
            if (foregroundImageSrc) {
                setLoadingMessage(isVariation ? 'Generating variation...' : 'Generating background scene...');
                const backgroundImageSrc = await generateBackgroundImage(concept, aspectRatio, imageStyle, referenceImage, referenceImageType, isVariation);
                
                setLoadingMessage('Compositing images...');

                const [bgImg, fgImg] = await Promise.all([
                    loadImage(backgroundImageSrc),
                    loadImage(foregroundImageSrc)
                ]);

                const canvas = document.createElement('canvas');
                canvas.width = bgImg.width;
                canvas.height = bgImg.height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    throw new Error('Could not get canvas context');
                }

                // Draw background
                ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

                // Calculate foreground dimensions to fit within 80% of background, preserving aspect ratio
                const maxFgWidth = canvas.width * 0.8;
                const maxFgHeight = canvas.height * 0.8;
                
                let fgDrawWidth = fgImg.width;
                let fgDrawHeight = fgImg.height;

                const ratio = Math.min(maxFgWidth / fgDrawWidth, maxFgHeight / fgDrawHeight);

                if (ratio < 1) { // Only scale down, not up
                    fgDrawWidth *= ratio;
                    fgDrawHeight *= ratio;
                }
                
                const finalFgX = (canvas.width - fgDrawWidth) / 2;
                const finalFgY = (canvas.height - fgDrawHeight) / 2;

                ctx.drawImage(fgImg, finalFgX, finalFgY, fgDrawWidth, fgDrawHeight);

                finalPoster = canvas.toDataURL('image/png');

            } else {
                setLoadingMessage(isVariation ? 'Generating variation...' : 'Forging your masterpiece... This may take a moment.');
                finalPoster = await generateImageFromPrompt(concept, aspectRatio, imageStyle, referenceImage, referenceImageType, currentMode, isVariation);
            }
            setGeneratedPoster(finalPoster);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to generate the image. Please try again.'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [mode, productImageNoBg, characterSheet, concept, aspectRatio, imageStyle, referenceImage, referenceImageType]);

    const handleGenerateLogo = useCallback(async () => {
        if (!logoConcept) {
            setError('Please provide a concept for the logo.');
            return;
        }
        setError(null);
        setGeneratedPoster(null);
        setCurrentCanvasImage(null);
        setGeneratedVideo(null);
        setInitialCanvasState(null);
        setIsLoading(true);
        setLoadingMessage('Crafting your unique logo...');
    
        try {
            const logo = await generateLogo(logoConcept, logoSize, logoBackground, logoBackground === 'color' ? logoBackgroundColor : undefined);
            setGeneratedPoster(logo);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to generate the logo. Please try again.'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [logoConcept, logoSize, logoBackground, logoBackgroundColor]);

    const handleApplyEdit = useCallback(async () => {
        const imageToEdit = currentCanvasImage || generatedPoster;
        if (!imageToEdit || !editPrompt) {
            setError('Please ensure an image is loaded and an edit description is provided.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Applying your creative edits...');
        try {
            const editedImage = await editImage(imageToEdit, editPrompt);
            setGeneratedPoster(editedImage);
            setCurrentCanvasImage(null);
            setInitialCanvasState(null);
            setEditPrompt(''); // Clear prompt after use for better UX
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to edit the image. Please try again.'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [generatedPoster, editPrompt, currentCanvasImage]);

    const handleRefinePoster = useCallback(async () => {
        const imageToRefine = currentCanvasImage || generatedPoster;
        if (!imageToRefine || !refinementPrompt) {
            setError('There is no poster to refine or no refinement prompt.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Applying your refinements...');
        try {
            const refined = await refinePoster(imageToRefine, refinementPrompt);
            setGeneratedPoster(refined);
            setCurrentCanvasImage(null);
            setInitialCanvasState(null);
            setRefinementPrompt('');
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to refine poster. Please try again.'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [generatedPoster, refinementPrompt, currentCanvasImage]);
    
    const handleUpscalePoster = useCallback(async () => {
        const imageToUpscale = currentCanvasImage || generatedPoster;
        if (!imageToUpscale) {
            setError('There is no poster to upscale.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Upscaling your poster...');
        try {
            const upscaled = await upscalePoster(imageToUpscale);
            setGeneratedPoster(upscaled);
            setCurrentCanvasImage(null);
            setInitialCanvasState(null);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to upscale poster. Please try again.'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [generatedPoster, currentCanvasImage]);
    
    const handleApplyInpaint = useCallback(async (baseImage: string, maskImage: string, inpaintPrompt?: string) => {
        setError(null);
        setIsLoading(true);
        setLoadingMessage(inpaintPrompt ? 'Applying generative fill...' : 'Removing selected area...');
        try {
            const inpaintedImage = await inpaintImage(baseImage, maskImage, inpaintPrompt);
            setGeneratedPoster(inpaintedImage);
            setCurrentCanvasImage(null);
            setInitialCanvasState(null);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to apply removal. Please try again.'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, []);

    const handleAddToPanel = (poster: string) => {
        if (!finalPosters.includes(poster)) {
            setFinalPosters(prev => [...prev, poster]);
        }
    };

    const handleRemoveFromPanel = (index: number) => {
        setFinalPosters(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleSelectTemplate = (template: Template) => {
        setConcept(template.prompt);
        setAspectRatio(template.aspectRatio);
        setImageStyle(template.style);
    };

    const handleSaveDesign = () => {
        if (!generatedPoster || !currentCanvasState) {
            toast('There is no design to save. Please generate an image first.', 'info');
            return;
        }

        try {
            const savedDesignsJSON = localStorage.getItem('imaginom_saved_designs');
            const savedDesigns: SavedDesign[] = savedDesignsJSON ? JSON.parse(savedDesignsJSON) : [];
            
            const newDesign: SavedDesign = {
                id: Date.now().toString(),
                baseImage: generatedPoster,
                canvasState: currentCanvasState,
                createdAt: new Date().toISOString(),
            };

            const updatedDesigns = [newDesign, ...savedDesigns].slice(0, 10); // Keep max 10 saves
            localStorage.setItem('imaginom_saved_designs', JSON.stringify(updatedDesigns));
            toast('Design saved successfully!', 'success');

        } catch (e) {
            console.error('Failed to save design:', e);
            toast('An error occurred while saving. Storage might be full.', 'error');
        }
    };

    const handleLoadDesign = () => {
        try {
            const savedDesignsJSON = localStorage.getItem('imaginom_saved_designs');
            if (!savedDesignsJSON) {
                toast('No saved designs found.', 'info');
                return;
            }
            const savedDesigns: SavedDesign[] = JSON.parse(savedDesignsJSON);
            if (savedDesigns.length === 0) {
                toast('No saved designs found.', 'info');
                return;
            }

            const designToLoad = savedDesigns[0];
            
            setGeneratedPoster(designToLoad.baseImage);
            setInitialCanvasState(designToLoad.canvasState);
            setPosterDisplayKey(Date.now()); // Force remount of PosterDisplay
            
            setError(null);
            setCurrentCanvasImage(null);
            setMode('product'); // Reset to a default mode that allows canvas editing
            toast('Latest design loaded successfully!', 'success');

        } catch (e) {
            console.error('Failed to load design:', e);
            toast('Error loading design. Data might be corrupted.', 'error');
        }
    };

    const handlePosterUpdate = (newPoster: string) => {
        setGeneratedPoster(newPoster);
        setCurrentCanvasImage(null);
        setInitialCanvasState(null);
        setPosterDisplayKey(Date.now()); // Force remount to ensure clean state
    };

    const isGenerationDisabled = useMemo(() => {
        if (isLoading) return true;
        if (mode === 'logo') return !logoConcept;
        if (mode === 'edit') return !editableImage || !editPrompt;
        if (mode === 'video') return !concept;
        if (mode === 'character' && !characterSheet) return !characterDescription;
        if (mode === 'product' && !productImageNoBg) return !concept;
        return !concept;
    }, [isLoading, mode, editableImage, editPrompt, concept, characterDescription, characterSheet, productImageNoBg, logoConcept]);
    
    const primaryActionHandler = useMemo(() => {
        if (mode === 'logo') return handleGenerateLogo;
        if (mode === 'video') return handleGenerateVideo;
        if (mode === 'edit') return handleApplyEdit;
        return handleGeneratePoster;
    }, [mode, handleGenerateVideo, handleApplyEdit, handleGeneratePoster, handleGenerateLogo]);
    
    const buttonText = useMemo(() => {
        if (mode === 'logo') return 'Generate Logo';
        if (mode === 'video') return 'Generate Animation';
        if (mode === 'edit') return 'Apply Edit';
        if (mode === 'thumbnail') return 'Generate Thumbnail';
        const foregroundImage = mode === 'product' ? productImageNoBg : characterSheet;
        if (foregroundImage) {
            return mode === 'product' ? 'Generate Poster' : 'Generate Scene';
        }
        return 'Generate Image from Prompt';
    }, [mode, productImageNoBg, characterSheet]);
    
    const conceptPlaceholder = useMemo(() => {
        switch(mode) {
            case 'product':
                return 'e.g., A futuristic city scene at night with neon lights, product placed on a wet street reflecting the environment...';
            case 'character':
                return 'e.g., Standing on a cliff overlooking a futuristic city at sunset...';
            case 'thumbnail':
                return 'e.g., An astronaut riding a T-Rex on Mars, vibrant colors, epic space background...';
            case 'video':
                return 'e.g., A cinematic drone shot flying through a futuristic canyon...';
            case 'edit':
                return 'e.g., Add a golden crown, change the background to a fantasy forest, make it a pencil sketch...';
            case 'logo':
                return 'e.g., A minimalist fox head icon for a tech company, using shades of orange and white...';
            default:
                return '';
        }
    }, [mode]);

    const conceptLabel = useMemo(() => {
        switch(mode) {
            case 'product':
            case 'character':
                return 'Describe the Scene';
            case 'thumbnail':
                return 'Thumbnail Concept';
            case 'video':
                return 'Animation Concept';
            default:
                return 'Concept';
        }
    }, [mode]);
    
    const conceptHelperText = useMemo(() => {
        switch(mode) {
            case 'thumbnail':
                return 'Describe the key elements, colors, and mood. Think about what would make someone click!';
            case 'video':
                return 'Describe the scene, action, and camera movement. This will be used to generate a short video clip.';
            case 'product':
            case 'character':
                return 'Provide details about the environment, lighting, and atmosphere for the background.';
            default:
                return 'The more detail you provide, the better the result.';
        }
    }, [mode]);

    const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleEditableImageUpload(file);
        }
    };
    
    const handleGenerateVariation = () => {
        // This effectively re-runs the last generation prompt.
        // It relies on the existing state for concept, aspect ratio etc.
        setInitialCanvasState(null);
        handleGeneratePoster(true);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col lg:flex-row antialiased">
            {isLoading && <Loader message={loadingMessage} />}
            <FinalPosterPanel posters={finalPosters} onRemove={handleRemoveFromPanel} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
                <header className="mb-8">
                    <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                                Imaginom
                            </h1>
                            <p className="text-gray-400 mt-2 text-lg">
                                Your AI-powered creative suite for posters, characters, and thumbnails.
                            </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={handleSaveDesign} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700/80 rounded-lg transition-colors hover:bg-gray-700 hover:text-white border border-gray-600">
                                <SaveIcon />
                                <span>Save</span>
                            </button>
                            <button onClick={handleLoadDesign} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700/80 rounded-lg transition-colors hover:bg-gray-700 hover:text-white border border-gray-600">
                                <LoadIcon />
                                <span>Load</span>
                            </button>
                        </div>
                    </div>
                </header>
                
                {error && <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">{error}</div>}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1">
                    <div className="flex flex-col gap-8">
                        {/* Step 1 */}
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl shadow-black/20 backdrop-blur-sm">
                           <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
                               <button onClick={() => handleModeChange('product')} className={`flex-shrink-0 px-4 py-2 text-lg font-semibold transition-colors ${mode === 'product' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>Product Poster</button>
                               <button onClick={() => handleModeChange('character')} className={`flex-shrink-0 px-4 py-2 text-lg font-semibold transition-colors ${mode === 'character' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>Character Scene</button>
                               <button onClick={() => handleModeChange('thumbnail')} className={`flex-shrink-0 px-4 py-2 text-lg font-semibold transition-colors ${mode === 'thumbnail' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>Thumbnail</button>
                               <button onClick={() => handleModeChange('logo')} className={`flex-shrink-0 px-4 py-2 text-lg font-semibold transition-colors ${mode === 'logo' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>Logo</button>
                               <button onClick={() => handleModeChange('video')} className={`flex-shrink-0 px-4 py-2 text-lg font-semibold transition-colors ${mode === 'video' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>Animation</button>
                               <button onClick={() => handleModeChange('edit')} className={`flex-shrink-0 px-4 py-2 text-lg font-semibold transition-colors ${mode === 'edit' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>Edit Image</button>
                           </div>
                           
                           {mode === 'product' && (
                                <div>
                                    <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Step 1: Your Product <span className="text-gray-500 text-lg font-normal">(Optional)</span></h2>
                                    <ImageUploader onImageUpload={handleImageUpload} productImage={productImage} productImageNoBg={productImageNoBg} />
                                </div>
                           )}
                           {mode === 'character' && (
                                <div>
                                    <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Step 1: Create Your Character</h2>
                                    <CharacterGenerator 
                                        description={characterDescription}
                                        onDescriptionChange={setCharacterDescription}
                                        onGenerate={handleGenerateCharacter}
                                        characterSheet={characterSheet}
                                        isLoading={isLoading}
                                    />
                                </div>
                           )}
                           {mode === 'thumbnail' && (
                               <div>
                                    <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Mode: Thumbnail Generation</h2>
                                    <p className="text-gray-400">This mode generates an eye-catching thumbnail from a text prompt. Proceed to Step 2 to describe your concept.</p>
                               </div>
                           )}
                           {mode === 'logo' && (
                               <div>
                                    <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Mode: Logo Generation</h2>
                                    <p className="text-gray-400">Design a unique logo from a text description. Your logo will be generated as a square image with your specified background and size requirements.</p>
                               </div>
                           )}
                           {mode === 'video' && (
                               <div>
                                    <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Mode: Animation Generation</h2>
                                    <p className="text-gray-400">Describe a scene to generate a short, high-quality video (MP4).<br/><span className="font-semibold">Note:</span> Video generation can take several minutes.</p>
                               </div>
                           )}
                           {mode === 'edit' && (
                                <div>
                                    <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
                                        {editableImage ? 'Step 1: Your Image' : 'Step 1: Upload Your Image'}
                                    </h2>
                                    <input type="file" ref={editFileInputRef} onChange={handleEditFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                                    
                                    {!editableImage ? (
                                        <div 
                                            onClick={() => editFileInputRef.current?.click()} 
                                            className="cursor-pointer border-2 border-dashed border-gray-600 hover:border-cyan-500 transition-colors duration-300 rounded-lg p-4 text-center bg-gray-900/50"
                                        >
                                            <div className="flex flex-col items-center justify-center h-40">
                                                <UploadIcon />
                                                <p className="mt-2 text-gray-400">Click to upload an image to edit</p>
                                                <p className="text-xs text-gray-500">Your image will appear in the right panel</p>
                                            </div>
                                        </div>
                                    ) : (
                                         <div className="relative group w-full bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                                            <img src={editableImage} alt="Image to edit" className="rounded-md w-full object-contain max-h-52 mx-auto" />
                                            <div 
                                                onClick={() => editFileInputRef.current?.click()} 
                                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
                                            >
                                                <div className="text-center text-white">
                                                    <UploadIcon className="h-8 w-8 mx-auto" />
                                                    <p className="font-semibold mt-1 text-sm">Change Image</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                           )}
                        </div>

                        {/* Step 2 */}
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl shadow-black/20 backdrop-blur-sm">
                           <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
                            {mode === 'logo' ? 'Step 1: Design Your Logo' : (mode === 'edit' ? 'Step 2: Describe Your Edit' : (mode === 'thumbnail' || mode === 'video' ? 'Step 1: Describe your Concept' : 'Step 2: Scene & Style'))}
                           </h2>
                           {mode === 'logo' ? (
                                <LogoGenerator
                                    concept={logoConcept}
                                    onConceptChange={setLogoConcept}
                                    size={logoSize}
                                    onSizeChange={setLogoSize}
                                    background={logoBackground}
                                    onBackgroundChange={setLogoBackground}
                                    backgroundColor={logoBackgroundColor}
                                    onBackgroundColorChange={setLogoBackgroundColor}
                                    placeholder={conceptPlaceholder}
                                />
                           ) : (
                                <div className="space-y-6">
                                    {(mode === 'product' || mode === 'character' || mode === 'thumbnail') && (
                                        <TemplateSelector templates={templates} onSelect={handleSelectTemplate} />
                                    )}

                                   {mode !== 'video' && mode !== 'edit' && <AspectRatioSelector selected={aspectRatio} onSelect={setAspectRatio} />}
                                   {mode !== 'video' && mode !== 'edit' && <StyleSelector selected={imageStyle} onSelect={setImageStyle} />}
                                   
                                   {mode === 'edit' ? (
                                        <div>
                                            <label htmlFor="edit-prompt" className="block text-xl font-semibold text-gray-300 mb-3">Editing Instructions</label>
                                            <textarea
                                                id="edit-prompt"
                                                rows={6}
                                                value={editPrompt}
                                                onChange={(e) => setEditPrompt(e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-base"
                                                placeholder={conceptPlaceholder}
                                            />
                                        </div>
                                   ) : (
                                       <ConceptInput
                                          concept={concept}
                                          onConceptChange={setConcept}
                                          onReferenceImageUpload={handleReferenceImageUpload}
                                          referenceImage={referenceImage}
                                          conceptPlaceholder={conceptPlaceholder}
                                          referenceImageType={referenceImageType}
                                          onReferenceImageTypeChange={setReferenceImageType}
                                          label={conceptLabel}
                                          helperText={conceptHelperText}
                                        />
                                   )}
                               </div>
                           )}
                        </div>

                        <div className="mt-auto pt-6">
                             <button
                                onClick={primaryActionHandler}
                                disabled={isGenerationDisabled}
                                className="w-full flex items-center justify-center gap-3 text-lg font-bold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-4 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                <MagicWandIcon />
                                {buttonText}
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl shadow-black/20 backdrop-blur-sm flex flex-col">
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
                            {mode === 'logo' ? 'Result: Your Logo' : (mode === 'edit' ? 'Result: Review & Refine' : (mode === 'video' ? 'Step 2: Review & Download' : (mode === 'thumbnail' ? 'Step 2: Refine & Finalize' : 'Step 3: Refine & Finalize')))}
                        </h2>
                        <PosterDisplay 
                            key={posterDisplayKey}
                            poster={generatedPoster}
                            video={generatedVideo}
                            onAddToPanel={handleAddToPanel}
                            refinementPrompt={refinementPrompt}
                            onRefinementChange={setRefinementPrompt}
                            onRefine={handleRefinePoster}
                            onUpscale={handleUpscalePoster}
                            onGenerateVariation={handleGenerateVariation}
                            onInpaint={handleApplyInpaint}
                            isLoading={isLoading}
                            onCanvasChange={setCurrentCanvasImage}
                            finalCanvasImage={currentCanvasImage}
                            onStateChange={setCurrentCanvasState}
                            initialState={initialCanvasState}
                            onPosterUpdate={handlePosterUpdate}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
