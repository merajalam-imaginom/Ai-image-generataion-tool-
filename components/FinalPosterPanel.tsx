
import React from 'react';
import { TrashIcon } from './icons/TrashIcon';

interface FinalPosterPanelProps {
    posters: string[];
    onRemove: (index: number) => void;
}

const FinalPosterPanel: React.FC<FinalPosterPanelProps> = ({ posters, onRemove }) => {
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        // Add some visual feedback
        e.currentTarget.classList.add('bg-gray-700/50');
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-gray-700/50');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-gray-700/50');
        const posterUrl = e.dataTransfer.getData("poster-data");
        if (posterUrl && !posters.includes(posterUrl)) {
            // The onAddToPanel is now handled by the App component
            // to ensure it gets the final canvas image with text.
            // This is a simple implementation detail.
        }
    };

    return (
        <aside 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="w-full lg:w-64 xl:w-80 bg-gray-900/80 backdrop-blur-xl border-b lg:border-r border-gray-700 p-4 transition-colors"
        >
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-4">
                Your Collection
            </h2>
            <div className="h-40 lg:h-auto lg:flex-1 space-y-4 overflow-y-auto pr-2">
                {posters.length === 0 && (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg p-4">
                        <p>Drag your generated posters here to save them.</p>
                    </div>
                )}
                {posters.map((poster, index) => (
                    <div key={index} className="relative group">
                        <img src={poster} alt={`Final poster ${index + 1}`} className="w-full rounded-lg shadow-md" />
                        <button
                            onClick={() => onRemove(index)}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default FinalPosterPanel;