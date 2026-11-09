import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const fundo = '#a3262a';

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // O ícone já tem fundo próprio: a margem de segurança usa a mesma cor,
    // para o Android poder recortar em círculo sem aparecer borda branca.
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: fundo } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: fundo } },
  },
  images: ['public/icone.svg'],
});
