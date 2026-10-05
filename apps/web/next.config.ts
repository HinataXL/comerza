import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilitar acceso de desarrollo a través de túneles
  allowedDevOrigins: [
    "*.ngrok-free.app", 
    "*.ngrok-free.dev", 
    "*.loca.lt"
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*', // Proxy to Spring Boot Backend API
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8080/uploads/:path*', // Proxy to Spring Boot Backend static files
      }
    ];
  },
};

export default nextConfig;
