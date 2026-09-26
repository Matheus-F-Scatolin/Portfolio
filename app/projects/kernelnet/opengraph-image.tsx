// The page's own openGraph export replaces the layout's, and Next attaches a
// file-based image only in the segment that holds the file, so each case page
// re-exports the root share card.
export { default, alt, size, contentType } from '../../opengraph-image';
