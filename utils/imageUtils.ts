/**
 * Converts a Google Drive file URL into a direct, embeddable image URL.
 * If the URL is not a recognized Google Drive link, it returns the original URL.
 * @param url The Google Drive URL (e.g., "https://drive.google.com/file/d/FILE_ID/view?usp=sharing").
 * @returns A direct image link or the original URL.
 */
export const getGoogleDriveImageUrl = (url: string | null | undefined): string => {
    if (!url) {
        return '';
    }
    
    // Regex to capture the file ID from various Google Drive URL formats
    const regex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);

    if (match && match[1]) {
        const fileId = match[1];
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    // Return the original URL if it's not a Google Drive link
    return url;
};
