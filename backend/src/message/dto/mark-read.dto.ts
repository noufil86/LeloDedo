export class MarkReadDto {
  conversation_id: number;
  // optional: list of message ids to mark read
  message_ids?: number[];
}
