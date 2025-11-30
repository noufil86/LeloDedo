import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Status mapping from backend (uppercase) to frontend (lowercase)
 */
const statusMapping: { [key: string]: string } = {
  // Borrow request statuses
  PENDING: 'pending',
  APPROVED: 'accepted',
  DECLINED: 'rejected',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  COMPLETED: 'completed',
  // Report statuses
  RESOLVED: 'resolved',
  IGNORED: 'ignored',
  // Role mapping
  BORROWER: 'borrower',
  LENDER: 'lender',
  ADMIN: 'admin',
  // Availability status
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  REMOVED: 'removed',
};

/**
 * Transforms snake_case database field names to camelCase for API responses
 * Also maps backend status values (uppercase) to frontend format (lowercase)
 */
function transformKeys(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item));
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  const transformed: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );

      let value = obj[key];

      // Transform value recursively
      value = transformKeys(value);

      // Map status fields to lowercase
      if (
        (camelKey === 'status' || camelKey === 'role' || camelKey === 'availabilityStatus') &&
        typeof value === 'string'
      ) {
        value = statusMapping[value] || value.toLowerCase();
      }

      transformed[camelKey] = value;
    }
  }

  return transformed;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => transformKeys(data)));
  }
}

