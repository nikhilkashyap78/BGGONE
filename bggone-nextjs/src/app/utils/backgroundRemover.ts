import { removeBackground as removeBackgroundLib } from '@imgly/background-removal';

let isInitialized = false;

export async function removeBackground(imageFile: File): Promise<Blob> {
    try {
        // The library auto-initializes on first use
        if (!isInitialized) {
            isInitialized = true;
        }

        const blob = await removeBackgroundLib(imageFile, {
            debug: true,
            progress: (key, current, total) => {
                console.log(`Processing: ${key} - ${current}/${total}`);
            },
        });

        return blob;
    } catch (error) {
        console.error('Background removal failed:', error);
        throw new Error('Failed to remove background. Please try again.');
    }
}
