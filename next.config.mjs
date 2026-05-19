/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para resolver problemas de pacotes CommonJS/ESM
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
