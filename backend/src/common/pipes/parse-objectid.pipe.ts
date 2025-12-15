import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `Invalid ObjectId format. Expected a valid MongoDB ObjectId (24 hex characters), but received: "${value}"`,
      );
    }
    return value;
  }
}

