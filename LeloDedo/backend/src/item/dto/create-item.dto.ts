export class CreateItemDto {
  title: string;
  description?: string;
  image_url?: string;
  category_id: number;
  price_per_day?: number;
  condition?: string;
}
