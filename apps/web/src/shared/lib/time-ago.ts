const fmt = (n: number, unit: string) =>
  `${n} ${unit}${n === 1 ? '' : 's'} ago`;

export const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - new Date(date).getTime()) / 1000,
  );

  if (diffInSeconds < 60) return fmt(diffInSeconds, 'second');

  if (diffInSeconds < 3600)
    return fmt(Math.floor(diffInSeconds / 60), 'minute');

  if (diffInSeconds < 86400)
    return fmt(Math.floor(diffInSeconds / 3600), 'hour');

  if (diffInSeconds < 2592000)
    return fmt(Math.floor(diffInSeconds / 86400), 'day');

  if (diffInSeconds < 31536000)
    return fmt(Math.floor(diffInSeconds / 2592000), 'month');

  return fmt(Math.floor(diffInSeconds / 31536000), 'year');
};
