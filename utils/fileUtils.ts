
export const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result);
        } else {
            reject(new Error('FileReader result is not a string'));
        }
    };
    reader.onerror = (error) => reject(error);
  });

export const getMimeType = (base64: string): string => {
  return base64.substring(base64.indexOf(':') + 1, base64.indexOf(';'));
}
