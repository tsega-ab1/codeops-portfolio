// What a person's or a place's name may contain: letters in ANY script (Amharic included), digits, spaces and . , ' ’ & ( ) -
// It must START with a letter or digit. No < > " / = or backticks: that is the constraint that stops a stored <script>.
// The API constrains what it accepts and stores what was sent; it does NOT HTML-escape (that corrupts the data for
// every other consumer). Encoding for HTML is the frontend's job.
export const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()-]*$/u;
export const NAME_MESSAGE = "must contain only letters, digits, spaces and . , ' & ( ) -";
