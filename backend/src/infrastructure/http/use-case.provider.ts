import { InjectionToken, Provider } from '@nestjs/common';

/**
 * Registers a domain use case as a Nest provider without adding framework
 * decorators to the domain layer: its constructor dependencies are resolved
 * from the given injection tokens, in order.
 */
export function useCaseProvider<T>(
  useCase: new (...args: any[]) => T,
  inject: InjectionToken[],
): Provider {
  return {
    provide: useCase,
    useFactory: (...deps: unknown[]) => new useCase(...deps),
    inject,
  };
}
