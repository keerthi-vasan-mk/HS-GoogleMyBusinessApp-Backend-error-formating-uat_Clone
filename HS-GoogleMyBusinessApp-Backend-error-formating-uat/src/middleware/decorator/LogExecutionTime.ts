import { LoggerService } from '../../utils/LoggerService';

export function LogExecutionTime() {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
  
      descriptor.value = async function (...args: any[]) {
        const start = process.hrtime();
        const result = await originalMethod.apply(this, args);
        const diff = process.hrtime(start);
        const durationMs = (diff[0] * 1e9 + diff[1]) / 1e6;
        const req: Request = args.find((arg) => arg?.headers && arg?.method);          
        LoggerService.info(`Execution time for [${req?.url}]: [${durationMs.toFixed(2)} ms]`);
        return result;
      };
  
      return descriptor;
    };
  }
  