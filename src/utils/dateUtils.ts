export const getTime = (hoursAgo: number) => (Date.now() - 1000 * 60 * 60 * hoursAgo).toString();
