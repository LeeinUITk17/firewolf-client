// import { defineNuxtPlugin } from '#app';
// import { io, type Socket } from 'socket.io-client';

// export default defineNuxtPlugin((nuxtApp) => {
//     const config = useRuntimeConfig();
//     const backendUrl = config.public.apiBase || 'http://localhost:8000';

//     const socket: Socket = io(backendUrl, {
//         withCredentials: true,
//         transports: ['websocket', 'polling'],
//         autoConnect: true,
//     });

//     socket.on('connect', () => {
//         console.log('[Socket.IO] Connected to server:', socket.id);
//     });

//     socket.on('disconnect', (reason) => {
//         console.warn('[Socket.IO] Disconnected:', reason);
//     });

//     socket.on('connect_error', (error) => {
//         console.error('[Socket.IO] Connection Error:', error);
//     });

//     socket.on('new_alert', (alertData) => {
//         console.log('[Socket.IO] Received new_alert event:', alertData);

//         try {
//             const audio = new Audio('/sounds/alert.mp3');
//             audio.play().catch((playError) => {
//                 console.warn('Audio playback failed:', playError);
//             });
//             console.log('[Audio] Alert sound played.');
//         } catch (audioError) {
//             console.error('Error playing alert sound:', audioError);
//         }
//     });

//     nuxtApp.provide('socket', socket);

//     nuxtApp.hook('app:beforeMount', () => {});

//     nuxtApp.hook('page:finish', () => {});

//     if (process.client) {
//         window.addEventListener('beforeunload', () => {
//             if (socket.connected) {
//                 console.log('[Socket.IO Plugin] Disconnecting on page unload.');
//                 socket.disconnect();
//             }
//         });
//     }

//     return {
//         provide: {
//             socket: socket,
//         },
//     };
// });
