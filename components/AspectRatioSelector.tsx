
import React from 'react';
import { AspectRatio } from '../types';

interface AspectRatioSelectorProps {
    selected: AspectRatio;
    onSelect: (ratio: AspectRatio) => void;
}

const ratios: AspectRatio[] = ['9:16', '1:1', '16:9', '4:3', '3:4'];
const ratioLabels: Record<AspectRatio, string> = {
    '9:16': 'Story / Reel',
    '1:1': 'Square Post',
    '16:9': 'YouTube / Wide',
    '4:3': 'Classic',
    '3:4': 'Portrait',
};


const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selected, onSelect }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ratios.map(ratio => (
                    <button
                        key={ratio}
                        onClick={() => onSelect(ratio)}
                        className={`py-2 px-1 text-center rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500
                            ${selected === ratio ? 'bg-cyan-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                        `}
                    >
                        <span className="font-semibold text-sm">{ratio}</span>
                        <span className="block text-xs text-gray-300/80 mt-1">{ratioLabels[ratio]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AspectRatioSelector;