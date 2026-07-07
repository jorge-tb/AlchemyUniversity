import { extendTheme } from '@chakra-ui/react';

// On-chain aesthetic: deep space bg, purple→cyan accent, glassmorphism.
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Inter', system-ui, sans-serif`,
    body: `'Inter', system-ui, sans-serif`,
    mono: `'JetBrains Mono', 'SF Mono', ui-monospace, monospace`,
  },
  colors: {
    accent: {
      from: '#7c3aed', // violet
      to: '#22d3ee', // cyan
    },
    surface: {
      base: '#0a0b14',
      card: 'rgba(255, 255, 255, 0.03)',
      border: 'rgba(255, 255, 255, 0.08)',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'surface.base',
        color: 'whiteAlpha.900',
        // Two soft radial glows behind everything.
        backgroundImage: `
          radial-gradient(60vw 60vw at 15% -10%, rgba(124, 58, 237, 0.18), transparent 60%),
          radial-gradient(50vw 50vw at 100% 0%, rgba(34, 211, 238, 0.12), transparent 55%)
        `,
        backgroundAttachment: 'fixed',
        minH: '100vh',
      },
    },
  },
  components: {
    Button: {
      baseStyle: { borderRadius: 'xl', fontWeight: 600 },
      variants: {
        gradient: {
          bgGradient: 'linear(to-r, accent.from, accent.to)',
          color: 'white',
          transition: 'all 0.2s ease',
          _hover: {
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 30px -10px rgba(124, 58, 237, 0.6)',
            _disabled: { transform: 'none', boxShadow: 'none' },
          },
          _active: { transform: 'translateY(0)' },
        },
      },
    },
  },
});

export default theme;
