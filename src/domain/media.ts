export function deviceLocalPath(value: string): boolean {
  return /^(file:|content:|ph:|assets-library:)/i.test(value.trim());
}
