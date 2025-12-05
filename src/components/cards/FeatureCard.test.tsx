import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FeatureCard from './FeatureCard';
import { FaGift } from 'react-icons/fa';

describe('FeatureCard', () => {
    it('renders title and text correctly', () => {
        const title = 'Test Title';
        const text = 'Test Description';
        
        render(<FeatureCard icon={FaGift} title={title} text={text} />);
        
        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(text)).toBeInTheDocument();
    });
});
