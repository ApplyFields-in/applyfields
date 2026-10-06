import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

/** Validates a request body with a zod schema: @Body(new ZodPipe(schema)). 400 lists every problem. */
export class ZodPipe<T extends z.ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Some fields are not valid',
        errors: result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`),
      });
    }
    return result.data;
  }
}
