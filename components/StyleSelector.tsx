import React from 'react';
import { ImageStyle } from '../types';

interface StyleSelectorProps {
    selected: ImageStyle;
    onSelect: (style: ImageStyle) => void;
}

const styles: ImageStyle[] = ['default', '2d', '3d', 'ultra', 'graphic'];
const styleLabels: Record<ImageStyle, string> = {
    'default': 'Default',
    '2d': '2D Illustration',
    '3d': '3D Render',
    'ultra': 'Ultra-Realistic',
    'graphic': 'Graphic Art',
};

const StyleSelector: React.FC<StyleSelectorProps> = ({ selected, onSelect }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Style & Quality</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {styles.map(style => (
                    <button
                        key={style}
                        onClick={() => onSelect(style)}
                        className={`py-3 px-2 text-center rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 text-sm font-semibold
                            ${selected === style ? 'bg-cyan-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                        `}
                    >
                        {styleLabels[style]}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StyleSelector;
