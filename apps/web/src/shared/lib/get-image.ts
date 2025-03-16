export const getImage = (image: string, category: 'tree') => {
  return `${import.meta.env.VITE_CLOUDFLARE_URL}/${category}/${image}`;
};
