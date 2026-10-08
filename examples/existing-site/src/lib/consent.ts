import { gtag, youtube } from '@zeste/services';

// The same services as before, with the same config (gtagUa…).
export const services = () => [gtag({ gtagUa: 'G-TEST000000' }), youtube()];
