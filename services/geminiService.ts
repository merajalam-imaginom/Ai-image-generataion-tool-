import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, ImageStyle, LogoBackground, LogoSize, ReferenceImageType } from "../types";
import { getMimeType } from '../utils/fileUtils';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const stripDataUrlPrefix = (dataUrl: string) => dataUrl.split(',')[1];

const getStylePrefix = (style: ImageStyle): string => {
    switch (style) {
        case '2d':
            return 'A clean 2D vector illustration, flat colors, minimalist style. ';
        case '3d':
            return 'A cinematic 3D render, high detail, physically-based rendering, octane render style. ';
        case 'ultra':
            return 'An ultra-realistic photograph, 4K resolution, hyper-detailed, dramatic lighting, professional photography. ';
        case 'graphic':
            return 'A modern graphic design, bold shapes, vibrant colors, suitable for a logo or icon. ';
        case 'default':
        default:
            return '';
    }
};

export const generateVideo = async (prompt: string): Promise<string> => {
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation failed: no download link returned.');
    }

    const urlWithKey = `${downloadLink}&key=${API_KEY}`;
    const response = await fetch(urlWithKey);
    if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const removeBackground = async (base64ImageData: string): Promise<string> => {
    const mimeType = getMimeType(base64ImageData);
    const data = stripDataUrlPrefix(base64ImageData);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: { data, mimeType },
                },
                {
                    text: 'Remove the background from this image, keeping only the main product. The background must be transparent.',
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        const newMimeType = imagePart.inlineData.mimeType;
        return `data:${newMimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error('Background removal failed: no image data returned.');
};

export const inpaintImage = async (baseImage: string, maskImage: string, inpaintPrompt?: string): Promise<string> => {
    const baseMimeType = getMimeType(baseImage);
    const baseData = stripDataUrlPrefix(baseImage);
    const maskMimeType = getMimeType(maskImage);
    const maskData = stripDataUrlPrefix(maskImage);

    const prompt = inpaintPrompt 
        ? `You are an expert image editor. Use the second image as a mask on the first image. Inpaint the area of the first image that corresponds to the white area in the mask with the following concept: "${inpaintPrompt}". Blend the new content seamlessly with the surrounding image. Return only the edited image.`
        : `You are an expert image editor. Use the second image as a mask on the first image. Inpaint the area of the first image that corresponds to the white area in the mask. Fill the area seamlessly to match the surrounding content, effectively removing the object that was there. Return only the edited image.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: baseData, mimeType: baseMimeType } },
                { inlineData: { data: maskData, mimeType: maskMimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        const newMimeType = imagePart.inlineData.mimeType;
        return `data:${newMimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error('Inpainting failed: no image data returned.');
};

export const generateCharacterSheet = async (description: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    text: `Generate a full-body character reference image based on this description: "${description}". 
                    **Crucial rule: The character MUST be on a transparent background.**
                    The style should be a clean, well-lit digital painting. Do not add any background elements, only the character. The output must be a single image.`,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        const newMimeType = imagePart.inlineData.mimeType;
        return `data:${newMimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error('Character generation failed: no image data returned.');
};

export const generateBackgroundImage = async (
    concept: string,
    aspectRatio: AspectRatio,
    imageStyle: ImageStyle,
    referenceImage?: string | null,
    referenceImageType: ReferenceImageType = 'style',
    isVariation: boolean = false
): Promise<string> => {
    const stylePrefix = getStylePrefix(imageStyle);

    let promptText = `Generate a high-quality, photorealistic background scene based on the following detailed prompt. The final image's aspect ratio MUST be strictly ${aspectRatio}. This is a critical requirement.
**IMPORTANT**: This is a background image. Do not generate any specific foreground subjects. The scene should feel like it's waiting for a main subject to be placed into it. For example, if the prompt is for a city street, generate the street and buildings, but leave the central area clear.
- **Style:** ${stylePrefix}
- **Concept:** "${concept}"
The final output must be a single image. Do not add any text unless specifically requested in the concept.`;
    
    if (isVariation) {
        promptText += "\n\n**Instruction**: Generate a creative variation of this scene. Alter the composition, lighting, or specific elements to provide a fresh alternative, while adhering to the core concept and style.";
    }

    const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [
        { text: promptText },
    ];

    if (referenceImage) {
        const refMimeType = getMimeType(referenceImage);
        const refData = stripDataUrlPrefix(referenceImage);
        parts.push({
            inlineData: { data: refData, mimeType: refMimeType },
        });
        
        let referencePromptText = '';
        switch (referenceImageType) {
            case 'composition':
                referencePromptText = "The preceding image is a composition reference. Use its layout, structure, and the arrangement of elements as a strong guide for the new background image you generate based on the main text prompt. Re-imagine the scene with the new concept but maintain the compositional flow.";
                break;
            case 'content':
                referencePromptText = "The preceding image is a content reference. Incorporate the key subjects and elements from this image into the new scene you generate based on the main text prompt. Adapt them to fit the new context and style.";
                break;
            case 'style':
            default:
                referencePromptText = "The preceding image is a style reference. Use its color palette, mood, and artistic style as inspiration for the new background image you generate based on the main text prompt. DO NOT copy the content or composition of the reference image.";
        }
        parts.push({ text: referencePromptText });
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        const newMimeType = imagePart.inlineData.mimeType;
        return `data:${newMimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error('Background generation failed: no image data returned.');
};


export const generateImageFromPrompt = async (
    concept: string,
    aspectRatio: AspectRatio,
    imageStyle: ImageStyle,
    referenceImage?: string | null,
    referenceImageType: ReferenceImageType = 'style',
    mode?: 'product' | 'character' | 'thumbnail',
    isVariation: boolean = false
): Promise<string> => {
    const stylePrefix = getStylePrefix(imageStyle);

    let promptText = `Generate a high-quality, photorealistic image based on the following detailed prompt. The final image's aspect ratio MUST be strictly ${aspectRatio}. This is a critical requirement.
- **Style:** ${stylePrefix}
- **Concept:** "${concept}"
The final output must be a single image. Do not add any text unless specifically requested in the concept.`;

    if (mode === 'thumbnail') {
        promptText = `Generate a vibrant and eye-catching thumbnail, suitable for a platform like YouTube. The final image's aspect ratio MUST be strictly ${aspectRatio}. This is a critical requirement. The composition should be simple, clear, and impactful even when viewed at a small size. Use bold colors and focus on a clear central subject. Do not add any text unless specifically requested.
- **Style:** ${stylePrefix}
- **Concept:** "${concept}"`;
    }
    
    if (isVariation) {
        promptText += "\n\n**Instruction**: Generate a creative variation of this image. Alter the composition, perspective, lighting, or specific elements to provide a fresh alternative, while adhering to the core concept and style.";
    }

    const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [
        { text: promptText },
    ];

    if (referenceImage) {
        const refMimeType = getMimeType(referenceImage);
        const refData = stripDataUrlPrefix(referenceImage);
        parts.push({
            inlineData: { data: refData, mimeType: refMimeType },
        });
        
        let referencePromptText = '';
        switch (referenceImageType) {
            case 'composition':
                referencePromptText = "The preceding image is a composition reference. Use its layout, structure, and the arrangement of elements as a strong guide for the new image you generate based on the main text prompt. Re-imagine the scene with the new concept but maintain the compositional flow.";
                break;
            case 'content':
                referencePromptText = "The preceding image is a content reference. Incorporate the key subjects and elements from this image into the new scene you generate based on the main text prompt. Adapt them to fit the new context and style.";
                break;
            case 'style':
            default:
                referencePromptText = "The preceding image is a style reference. Use its color palette, mood, and artistic style as inspiration for the new image you generate based on the main text prompt. DO NOT copy the content or composition of the reference image.";
        }
        parts.push({ text: referencePromptText });
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        const newMimeType = imagePart.inlineData.mimeType;
        return `data:${newMimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error('Image generation from prompt failed: no image data returned.');
};

export const generateLogo = async (
    concept: string,
    size: LogoSize, // While size isn't a direct API param, it's good to have for future proofing or prompt hints.
    backgroundStyle: LogoBackground,
    backgroundColor?: string
): Promise<string> => {
    let backgroundInstruction = '';
    switch (backgroundStyle) {
        case 'transparent':
            backgroundInstruction = 'The logo MUST be on a transparent background. This is the most important instruction.';
            break;
        case 'dark':
            backgroundInstruction = 'The logo should be on a clean, solid, dark gray (#1A1A1A) background.';
            break;
        case 'light':
            backgroundInstruction = 'The logo should be on a clean, solid, light gray (#F0F0F0) background.';
            break;
        case 'color':
            if (!backgroundColor) {
                throw new Error('Color background selected but no color provided.');
            }
            backgroundInstruction = `The logo should be on a clean, solid background with the exact hex color ${backgroundColor}.`;
            break;
    }

    const prompt = `Generate a modern, simple, and iconic logo based on this concept: "${concept}".

**Critical Instructions:**
1.  **Style**: The logo must be a clean, vector-style graphic. It should be simple, memorable, and easily recognizable. Avoid photorealistic details, complex textures, and excessive gradients. Think flat design or modern minimalist.
2.  **Composition**: The logo must be perfectly centered in the frame.
3.  **Background**: ${backgroundInstruction}
4.  **Output**: The final output MUST be a single, square image. Do not add any text, watermarks, signatures, or annotations unless they are explicitly part of the logo concept itself.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        const newMimeType = imagePart.inlineData.mimeType;
        return `data:${newMimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error('Logo generation failed: no image data returned.');
};

export const editImage = async (baseImage: string, editPrompt: string): Promise<string> => {
    const mimeType = getMimeType(baseImage);
    const data = stripDataUrlPrefix(baseImage);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: { data, mimeType },
                },
                {
                    text: `Apply the following edit to the image: "${editPrompt}". Preserve the original style and aspect ratio unless instructed otherwise.`,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        const newMimeType = imagePart.inlineData.mimeType;
        return `data:${newMimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error('Image editing failed: no image data returned.');
};

export const refinePoster = async (currentPoster: string, refinementPrompt: string): Promise<string> => {
    const mimeType = getMimeType(currentPoster);
    const data = stripDataUrlPrefix(currentPoster);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: { data, mimeType },
                },
                {
                    text: `Refine the provided image based on the following instruction: "${refinementPrompt}". Keep the same aspect ratio.`,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        const newMimeType = imagePart.inlineData.mimeType;
        return `data:${newMimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error('Poster refinement failed: no image data returned.');
};

export const upscalePoster = async (currentPoster: string): Promise<string> => {
    const mimeType = getMimeType(currentPoster);
    const data = stripDataUrlPrefix(currentPoster);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: { data, mimeType },
                },
                {
                    text: 'Upscale this image, significantly increasing its resolution and enhancing details while preserving the original composition and artistic style. The final output should be a high-quality, larger version of the image.',
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        const newMimeType = imagePart.inlineData.mimeType;
        return `data:${newMimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error('Poster upscaling failed: no image data returned.');
};