import React from 'react';
import { MagicWandIcon } from './icons/MagicWandIcon';

interface CharacterGeneratorProps {
    description: string;
    onDescriptionChange: (value: string) => void;
    onGenerate: () => void;
    characterSheet: string | null;
    isLoading: boolean;
}

const CharacterGenerator: React.FC<CharacterGeneratorProps> = ({
    description,
    onDescriptionChange,
    onGenerate,
    characterSheet,
    isLoading
}) => {
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="character-desc" className="block text-sm font-medium text-gray-400 mb-2">
                    Character Description
                </label>
                <textarea
                    id="character-desc"
                    rows={3}
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    placeholder="e.g., A young female astronaut, short pink hair, silver spacesuit with blue neon accents, determined expression."
                />
            </div>
            <button
                onClick={onGenerate}
                disabled={!description || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <MagicWandIcon />
                Generate Character
            </button>
            {characterSheet && (
                <div className="mt-4">
                     <p className="font-semibold text-gray-300 mb-2 text-center">Your Character</p>
                     <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                        <img src={characterSheet} alt="Generated Character" className="rounded-md max-h-60 mx-auto" />
                     </div>
                </div>
            )}
        </div>
    );
};

export default CharacterGenerator;
