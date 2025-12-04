// src/components/media/ImageCarousel.tsx

import React, { useState } from 'react';
import { Box, Button, CardMedia, Stack, Typography } from '@mui/material';
import type { ImageUrl } from '../../types';

export interface ImageCarouselProps {
    images: ImageUrl[];
    height?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, height = '200px' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

    const currentImage = images[currentIndex];

    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((currentIndex - 1 + images.length) % images.length);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((currentIndex + 1) % images.length);
    };

    return (
        <Box position="relative" width="100%" height={height} overflow="hidden">
            <CardMedia
                component="img"
                image={currentImage.url}
                alt={currentImage.label || "Imagen del ítem"}
                sx={{ height: '100%', objectFit: 'cover' }}
            />
            {images.length > 1 && (
                <Stack
                    direction="row"
                    spacing={1}
                    position="absolute"
                    bottom={8}
                    right={8}
                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.7)', borderRadius: 1 }}
                >
                    <Typography
                        variant="caption"
                        color="white"
                        px={1}
                        py={0.5}
                        mr={1}
                        sx={{ bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 1 }}
                    >
                        {currentIndex + 1} / {images.length}
                    </Typography>
                    <Button
                        size="small"
                        onClick={handlePrevious}
                        sx={{ color: 'white', minWidth: 'auto' }}
                    >
                        &lt;
                    </Button>
                    <Button
                        size="small"
                        onClick={handleNext}
                        sx={{ color: 'white', minWidth: 'auto' }}
                    >
                        &gt;
                    </Button>
                </Stack>
            )}
        </Box>
    );
};

export default ImageCarousel;
