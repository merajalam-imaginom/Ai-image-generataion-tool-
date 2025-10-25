import React from 'react';
import { Template } from '../types';

interface TemplateSelectorProps {
    templates: Template[];
    onSelect: (template: Template) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, onSelect }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Or start with a template</label>
            <div className="flex overflow-x-auto space-x-4 pb-4 -mb-4">
                {templates.map(template => (
                    <div 
                        key={template.id} 
                        onClick={() => onSelect(template)}
                        className="flex-shrink-0 w-32 cursor-pointer group"
                    >
                        <img 
                            src={template.thumbnailUrl} 
                            alt={template.name} 
                            className="w-full h-40 object-cover rounded-lg border-2 border-gray-700 group-hover:border-cyan-500 transition-all duration-300 transform group-hover:scale-105"
                        />
                        <p className="text-center text-sm mt-2 text-gray-300 group-hover:text-cyan-400 transition-colors">{template.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TemplateSelector;
