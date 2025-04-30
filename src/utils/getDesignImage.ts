export function getDesignImage(designRef?: string): string {
    // Vite importe toutes les images du dossier assets/design (jpg/png/webp)
    const images = import.meta.glob('/src/assets/design/*.{jpg,png,webp}', { eager: true, as: 'url' }) as Record<string, string>;
  
    if (!designRef) return images['/src/assets/design/default.jpg'] || '';
    const lower = designRef.toLowerCase();
    // Recherche une image dont le nom contient le design (avant extension)
    const entry = Object.entries(images).find(([path]) =>
      path.toLowerCase().includes(`/${lower}.`)
    );
    return entry ? entry[1] : images['/src/assets/design/default.jpg'] || '';
  }