declare module 'redlock' {
    export interface Lock {
        release(): Promise<void>;
    }

    export default class Redlock {
        acquire(resources: string[], ttl: number): Promise<Lock>;
        // Add other methods as needed
    }
}
