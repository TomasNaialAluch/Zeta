import type { Config } from 'tailwindcss'
export default { content:['./app/**/*.tsx','./components/**/*.tsx'],
theme:{extend:{colors:{paper:'#F4F1EB',ink:'#0E0E0E',g1:'#8A8783',g2:'#D9D6D0'},
fontFamily:{serif:['var(--serif)','serif'],sans:['var(--sans)','sans-serif']}}},plugins:[] } satisfies Config
