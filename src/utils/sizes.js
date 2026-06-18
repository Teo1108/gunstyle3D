export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function defaultSizes() {
  return ALL_SIZES.reduce((acc, size) => ({ ...acc, [size]: true }), {});
}

export function toggleSize(sizes, size) {
  return { ...sizes, [size]: !sizes[size] };
}
