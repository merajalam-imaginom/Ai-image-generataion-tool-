
import React, { useRef } from 'react';
import { toBase64 } from '../utils/fileUtils';
import { UploadIcon } from './icons/UploadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ReferenceImageType } from '../types';

interface ConceptInputProps {
    concept: string;
    onConceptChange: (concept: string) => void;
    onReferenceImageUpload: (base64: string | null) => void;
    referenceImage: string | null;
    conceptPlaceholder?: string;
    referenceImageType: ReferenceImageType;
    onReferenceImageTypeChange: (type: ReferenceImageType) => void;
    label?: string;
    helperText?: string;
}

const referenceTypes: { key: ReferenceImageType, label: string, description: string }[] = [
    { key: 'style', label: 'Style', description: 'Use color, mood, and artistic style.' },
    { key: 'composition', label: 'Composition', description: 'Use layout and arrangement.' },
    { key: 'content', label: 'Content', description: 'Incorporate subjects and elements.' },
];

const ConceptInput: React.FC<ConceptInputProps> = ({ 
    concept, 
    onConceptChange, 
    onReferenceImageUpload, 
    referenceImage, 
    conceptPlaceholder,
    referenceImageType,
    onReferenceImageTypeChange,
    label,
    helperText,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const base64 = await toBase64(file);
            onReferenceImageUpload(base64);
        }
    };
    
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="concept" className="block text-sm font-medium text-gray-400 mb-2">{label || 'Poster Concept'}</label>
                <textarea
                    id="concept"
                    rows={4}
                    value={concept}
                    onChange={(e) => onConceptChange(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    placeholder={conceptPlaceholder || "e.g., A futuristic city scene at night with neon lights, product placed on a wet street reflecting the environment..."}
                />
                {helperText && <p className="text-xs text-gray-500 mt-2">{helperText}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Reference Image (Optional)</label>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
                 {referenceImage ? (
                     <div className="space-y-3">
                        <div className="relative group w-full max-w-xs">
                            <img src={referenceImage} alt="Reference" className="rounded-lg w-full max-h-32 object-contain" />
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                            >
                                <span className="text-white font-semibold text-sm bg-gray-800/80 px-3 py-1 rounded-md">Change Image</span>
                            </div>
                            <button
                                onClick={() => onReferenceImageUpload(null)}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors z-10"
                                aria-label="Remove reference image"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">How to use reference image:</label>
                            <div className="grid grid-cols-3 gap-2">
                                {referenceTypes.map(type => (
                                    <button
                                        key={type.key}
                                        onClick={() => onReferenceImageTypeChange(type.key)}
                                        className={`py-2 px-1 text-center rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500
                                            ${referenceImageType === type.key ? 'bg-cyan-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                                        `}
                                        title={type.description}
                                    >
                                        <span className="font-semibold text-sm">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                 ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer border-2 border-dashed border-gray-600 hover:border-cyan-500 transition-colors duration-300 rounded-lg p-4 text-center bg-gray-900/50">
                        <div className="flex flex-col items-center justify-center h-20">
                            <UploadIcon />
                            <p className="mt-2 text-gray-400 text-sm">Upload a style reference</p>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default ConceptInput;
