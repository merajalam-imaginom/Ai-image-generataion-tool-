import React from 'react';
import { TextElement } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { AlignLeftIcon } from './icons/AlignLeftIcon';
import { AlignCenterIcon } from './icons/AlignCenterIcon';
import { AlignRightIcon } from './icons/AlignRightIcon';
import ColorPicker from './ColorPicker';

interface TextToolProps {
    textElement: TextElement;
    onUpdate: (updatedText: TextElement) => void;
    onDelete: (id: string) => void;
}

const fonts = [
    { name: 'Roboto', family: 'Roboto, sans-serif' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Playfair Display', family: "'Playfair Display', serif" },
    { name: 'Lobster', family: 'Lobster, cursive' },
    { name: 'Anton', family: 'Anton, sans-serif' },
    { name: 'Bebas Neue', family: "'Bebas Neue', cursive" },
    { name: 'Caveat', family: 'Caveat, cursive' },
    { name: 'Oswald', family: 'Oswald, sans-serif' },
    { name: 'Pacifico', family: 'Pacifico, cursive' },
];

const TextTool: React.FC<TextToolProps> = ({ textElement, onUpdate, onDelete }) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        onUpdate({ ...textElement, [name]: value });
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onUpdate({ ...textElement, [name]: parseInt(value, 10) || 0 });
    };
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        onUpdate({ ...textElement, [name]: checked });
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-cyan-400">Text Tools</h3>
                <button
                    onClick={() => onDelete(textElement.id)}
                    className="p-2 bg-red-600/50 hover:bg-red-600 rounded-full text-white transition-colors"
                    aria-label="Delete text element"
                >
                    <TrashIcon />
                </button>
            </div>
            
            <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-400 mb-1">Text</label>
                <textarea
                    id="content"
                    name="content"
                    rows={2}
                    value={textElement.content}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-400 mb-1">Font</label>
                    <select
                        id="fontFamily"
                        name="fontFamily"
                        value={textElement.fontFamily}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500"
                    >
                        {fonts.map(font => (
                            <option key={font.name} value={font.name} style={{ fontFamily: font.family }}>{font.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="fontSize" className="block text-sm font-medium text-gray-400 mb-1">Size</label>
                    <input
                        type="number"
                        id="fontSize"
                        name="fontSize"
                        value={textElement.fontSize}
                        onChange={handleNumberChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Alignment</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                            key={align}
                            onClick={() => onUpdate({ ...textElement, textAlign: align })}
                            className={`py-2 px-1 flex justify-center items-center rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${textElement.textAlign === align ? 'bg-cyan-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            aria-label={`Align ${align}`}
                        >
                            {align === 'left' && <AlignLeftIcon />}
                            {align === 'center' && <AlignCenterIcon />}
                            {align === 'right' && <AlignRightIcon />}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 items-center">
                <ColorPicker
                    label="Color"
                    id="color"
                    color={textElement.color}
                    onChange={(newColor) => onUpdate({ ...textElement, color: newColor })}
                />
                <div className="flex gap-4 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="isBold" checked={textElement.isBold} onChange={handleCheckboxChange} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                        <span className="font-bold text-gray-300">Bold</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="isItalic" checked={textElement.isItalic} onChange={handleCheckboxChange} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                        <span className="italic text-gray-300">Italic</span>
                    </label>
                </div>
            </div>

             {/* --- Stroke --- */}
            <div className="space-y-3 pt-4 border-t border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="strokeEnabled" checked={textElement.strokeEnabled} onChange={handleCheckboxChange} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                    <span className="font-semibold text-gray-300">Stroke (Outline)</span>
                </label>
                {textElement.strokeEnabled && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                        <ColorPicker
                            label="Color"
                            id="strokeColor"
                            color={textElement.strokeColor}
                            onChange={(newColor) => onUpdate({ ...textElement, strokeColor: newColor })}
                        />
                        <div>
                            <label htmlFor="strokeWidth" className="block text-xs font-medium text-gray-400 mb-1">Width</label>
                            <input type="number" id="strokeWidth" name="strokeWidth" value={textElement.strokeWidth} onChange={handleNumberChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                        </div>
                    </div>
                )}
            </div>

            {/* --- Shadow --- */}
            <div className="space-y-3 pt-4 border-t border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="shadowEnabled" checked={textElement.shadowEnabled} onChange={handleCheckboxChange} className="form-checkbox h-5 w-5 bg-gray-900 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                    <span className="font-semibold text-gray-300">Shadow</span>
                </label>
                {textElement.shadowEnabled && (
                    <div className="space-y-3 pl-6">
                        <div className="grid grid-cols-2 gap-4">
                            <ColorPicker
                                label="Color"
                                id="shadowColor"
                                color={textElement.shadowColor}
                                onChange={(newColor) => onUpdate({ ...textElement, shadowColor: newColor })}
                            />
                             <div>
                                <label htmlFor="shadowBlur" className="block text-xs font-medium text-gray-400 mb-1">Blur</label>
                                <input type="number" id="shadowBlur" name="shadowBlur" value={textElement.shadowBlur} onChange={handleNumberChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="shadowOffsetX" className="block text-xs font-medium text-gray-400 mb-1">Offset X</label>
                                <input type="number" id="shadowOffsetX" name="shadowOffsetX" value={textElement.shadowOffsetX} onChange={handleNumberChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label htmlFor="shadowOffsetY" className="block text-xs font-medium text-gray-400 mb-1">Offset Y</label>
                                <input type="number" id="shadowOffsetY" name="shadowOffsetY" value={textElement.shadowOffsetY} onChange={handleNumberChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextTool;
