import React from 'react';

export const ContrastIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a9 9 0 000 0V3z" fill="currentColor"/>
    </svg>
);
