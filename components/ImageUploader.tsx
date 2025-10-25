import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
    productImage: string | null;
    productImageNoBg: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, productImage, productImageNoBg }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
            />
            <div
                onClick={handleBoxClick}
                className="cursor-pointer border-2 border-dashed border-gray-600 hover:border-cyan-500 transition-colors duration-300 rounded-lg p-4 text-center bg-gray-900/50"
            >
                {!productImage && (
                    <div className="flex flex-col items-center justify-center h-40">
                        <UploadIcon />
                        <p className="mt-2 text-gray-400">
                            Click to upload a product image (Optional)
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                    </div>
                )}
                {productImage && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="font-semibold text-gray-300 mb-2">Original</p>
                            <img src={productImage} alt="Original product" className="rounded-lg max-h-40 mx-auto" />
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <p className="font-semibold text-gray-300 mb-2">Background Removed</p>
                            {productImageNoBg ? (
                                <img src={productImageNoBg} alt="Product with background removed" className="rounded-lg max-h-40 mx-auto" />
                            ) : (
                                <div className="h-40 w-full bg-gray-700 rounded-lg animate-pulse flex items-center justify-center text-sm text-gray-400">Processing...</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;