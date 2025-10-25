import { Template } from './types';

export const templates: Template[] = [
    {
        id: 'neon-noir',
        name: 'Neon Noir City',
        thumbnailUrl: 'https://images.unsplash.com/photo-1545156521-13a890471c5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
        prompt: 'A sleek, modern product placed on a wet, reflective street in a futuristic city at night. The scene is illuminated by vibrant neon signs and holographic advertisements. Moody, cinematic lighting with a shallow depth of field.',
        aspectRatio: '9:16',
        style: 'ultra',
    },
    {
        id: 'enchanted-forest',
        name: 'Enchanted Forest',
        thumbnailUrl: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
        prompt: 'A fantasy character standing in a magical, ancient forest. Sunbeams pierce through the dense canopy, illuminating mystical glowing flora and ancient ruins. The atmosphere is serene and mysterious.',
        // FIX: Changed invalid aspect ratio '4:5' to '3:4' as '4:5' is not a supported type.
        aspectRatio: '3:4',
        style: '3d',
    },
    {
        id: 'minimalist-studio',
        name: 'Minimalist Studio',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
        prompt: 'Product displayed on a minimalist pedestal in a clean, brightly-lit studio. Soft shadows and a simple, single-color background. Focus on the product\'s form and texture. Elegant and modern.',
        aspectRatio: '1:1',
        style: 'default',
    },
    {
        id: 'cosmic-explosion',
        name: 'Cosmic Thumbnail',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80',
        prompt: 'An epic, vibrant scene of an astronaut riding a space shark through a colorful nebula. High-energy, eye-catching composition perfect for a thumbnail. Dynamic, with a sense of motion and excitement.',
        aspectRatio: '16:9',
        style: 'graphic',
    },
    {
        id: 'vintage-adventure',
        name: 'Vintage Adventure',
        thumbnailUrl: 'https://images.unsplash.com/photo-1508249254148-73489a7215c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        prompt: 'A character styled as a 1940s adventurer, examining an ancient map in a dimly lit, wood-paneled study. The scene has a warm, vintage film look, with rich textures and a sense of history and mystery. Desaturated colors, film grain.',
        aspectRatio: '4:3',
        style: 'ultra',
    },
    {
        id: 'cyberpunk-alley',
        name: 'Cyberpunk Alley',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618022035342-536f7a68037a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80',
        prompt: 'A character in futuristic gear stands in a narrow, gritty alleyway of a cyberpunk city. Rain-slicked pavement reflects the glow of neon signs. Steam rises from vents. High-contrast, moody atmosphere.',
        aspectRatio: '3:4',
        style: '3d',
    },
];
