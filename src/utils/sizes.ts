export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function defaultSizes(): Record<string, boolean> {
  return ALL_SIZES.reduce((acc, size) => ({ ...acc, [size]: true }), {});
}

export function toggleSize(sizes: Record<string, boolean>, size: string): Record<string, boolean> {
  return { ...sizes, [size]: !sizes[size] };
}
