declare module 'redlock' {
    import { Redis } from 'ioredis';

    interface RedlockOptions {
        retryCount?: number;
        retryDelay?: number;
        retryJitter?: number;
        automaticExtensionThreshold?: number;
    }

    class Redlock {
        constructor(clients: Redis[], options?: RedlockOptions);
        on(event: string, callback: (error: Error) => void): void;
        acquire(resources: string[], ttl: number): Promise<any>;
        release(lock: any): Promise<void>;
    }

    export = Redlock;
}
