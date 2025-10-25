import React, { useState, useEffect } from 'react';

interface ColorPickerProps {
    label: string;
    color: string;
    onChange: (color: string) => void;
    id?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange, id }) => {
    // Keep internal state for the text input to allow invalid intermediate values
    const [inputValue, setInputValue] = useState(color);

    // Sync input value when the external color prop changes
    useEffect(() => {
        setInputValue(color.toUpperCase());
    }, [color]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setInputValue(newColor);
        // A simple regex to validate hex color format (#RRGGBB)
        if (/^#[0-9A-F]{6}$/i.test(newColor)) {
            onChange(newColor.toUpperCase());
        }
    };
    
    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value.toUpperCase());
    };
    
    // When the user clicks away, if the input is invalid, revert to the last valid color
    const handleBlur = () => {
        if (!/^#[0-9A-F]{6}$/i.test(inputValue)) {
            setInputValue(color.toUpperCase());
        } else {
            // Ensure the parent state is updated with the final (and valid) text input value
            onChange(inputValue.toUpperCase());
        }
    };

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0 w-10 h-10">
                    <input
                        type="color"
                        id={id}
                        value={color}
                        onChange={handlePickerChange}
                        className="absolute w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                        className="w-full h-full rounded-md border-2 border-gray-600"
                        style={{ backgroundColor: color }}
                    />
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleTextChange}
                    onBlur={handleBlur}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 font-mono text-sm h-10"
                    maxLength={7}
                    placeholder="#FFFFFF"
                />
            </div>
        </div>
    );
};

export default ColorPicker;
