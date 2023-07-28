export async function chunkText(text: string, chunkSize: number = 2000): Promise<{chunkNumber: number, content: string}[]> {
    const chunks = [];
    const words = text.split(' ');
    let chunkNumber = 0;
    let chunk = '';
    let i = 0;
    while (i < words.length) {
      if (chunk.length + words[i].length > chunkSize) {
        chunks.push({ chunkNumber, content: chunk });
        chunkNumber++;
        chunk = '';
      } else {
        chunk += words[i] + ' ';
        i++;
      }
    }
    if (chunk.length > 0) {
      chunks.push({ chunkNumber, content: chunk });
    }    
  
    return chunks;
  }