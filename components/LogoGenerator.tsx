import React from 'react';
import { LogoBackground, LogoSize } from '../types';
import ColorPicker from './ColorPicker';

interface LogoGeneratorProps {
    concept: string;
    onConceptChange: (concept: string) => void;
    size: LogoSize;
    onSizeChange: (size: LogoSize) => void;
    background: LogoBackground;
    onBackgroundChange: (bg: LogoBackground) => void;
    backgroundColor: string;
    onBackgroundColorChange: (color: string) => void;
    placeholder: string;
}

const SIZES: LogoSize[] = [512, 100, 60, 40];
const BACKGROUNDS: { key: LogoBackground, label: string }[] = [
    { key: 'transparent', label: 'Transparent' },
    { key: 'dark', label: 'Dark' },
    { key: 'light', label: 'Light' },
    { key: 'color', label: 'Color' },
];

const LogoGenerator: React.FC<LogoGeneratorProps> = ({
    concept, onConceptChange, size, onSizeChange,
    background, onBackgroundChange, backgroundColor, onBackgroundColorChange,
    placeholder
}) => {
    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="logo-concept" className="block text-xl font-semibold text-gray-300 mb-3">Logo Concept</label>
                <textarea
                    id="logo-concept"
                    rows={4}
                    value={concept}
                    onChange={(e) => onConceptChange(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-base"
                    placeholder={placeholder}
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Size</label>
                <div className="grid grid-cols-4 gap-2">
                    {SIZES.map(s => (
                        <button
                            key={s}
                            onClick={() => onSizeChange(s)}
                            className={`py-2 px-1 text-center rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500
                                ${size === s ? 'bg-cyan-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                            `}
                        >
                            <span className="font-semibold text-sm">{s}x{s}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Background</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {BACKGROUNDS.map(bg => (
                        <button
                            key={bg.key}
                            onClick={() => onBackgroundChange(bg.key)}
                             className={`py-3 px-2 text-center rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 text-sm font-semibold
                                ${background === bg.key ? 'bg-cyan-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                            `}
                        >
                            {bg.label}
                        </button>
                    ))}
                </div>
            </div>

            {background === 'color' && (
                 <ColorPicker
                    label="Background Color"
                    id="logo-bg-color"
                    color={backgroundColor}
                    onChange={onBackgroundColorChange}
                />
            )}
        </div>
    );
};

export default LogoGenerator;
