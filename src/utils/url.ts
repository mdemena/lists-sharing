export const ensureProtocol = (url: string): string => {
    if (!url) return "";
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
        return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
};
